import { EventEmitter } from 'events';
import StatisticsRepository from "../domain/StatisticsRepository";
import PrediccionsRequest from "../domain/DTOS/PrediccionsRequest";
import { PredictionsResponse, dataPoint } from "../domain/DTOS/PrediccionsResponse";
import PredictionMathInterface from "./utils/PredictionMath";
import { ICacheRepository } from "../domain/ICacheRepository";
import { Mutex } from "async-mutex";

export default class GetPredictionsUseCase {
    private readonly CACHE_TTL = 600; // tiempo de vida de la cache es de 10 minutos
    private readonly eventEmitter: EventEmitter;
    private readonly activeRequests: Map<string, boolean> = new Map();
    private readonly mutexes: Map<string, Mutex> = new Map();

    constructor(
        readonly statisticsRepository: StatisticsRepository,
        readonly predictionMath: PredictionMathInterface,
        readonly cacheRepository: ICacheRepository
    ) {
        this.eventEmitter = new EventEmitter();
        
    }

    /**
     * Obtiene o crea un mutex para una clave de caché específica
     */
    private getMutex(cacheKey: string): Mutex {
        if (!this.mutexes.has(cacheKey)) {
            this.mutexes.set(cacheKey, new Mutex());
        }
        return this.mutexes.get(cacheKey)!;
    }

    /**
     * Genera una clave de cache para la solicitud de predicciones
     */
    private generateCacheKey(request: PrediccionsRequest): string {
        return `predictions:${request.idPlant}:${request.typeSensor}:${request.typePredictions}:${request.startDate}:${request.endDate}`;
    }

    /**
     * Obtiene los datos históricos de la base de datos, según el tipo de predicciones
     */
    private async fetchHistoricalData(request: PrediccionsRequest): Promise<dataPoint[]> {
        let historicalData: dataPoint[] | null;

        switch (request.typePredictions) {
            case 'week':
                historicalData = await this.statisticsRepository.getPredictionsByWeek(request);
                break;
            case 'hours':
                historicalData = await this.statisticsRepository.getPredictionsByHour(request);
                break;
            case 'days':
                historicalData = await this.statisticsRepository.getPredictionsByDays(request);
                break;
            default:
                throw new Error(`Tipo de predicción no soportado: ${request.typePredictions}`);
        }

        if (!historicalData || historicalData.length < 2) {
            throw new Error("Datos históricos insuficientes para generar predicciones");
        }

        return historicalData;
    }

    /**
     * Ejecuta el flujo completo de la solicitud de predicciones incluyendo la recuperación
     * de datos históricos, cálculos de predicciones y almacenamiento en caché
     */
    async run(request: PrediccionsRequest): Promise<PredictionsResponse | null> {
        // Verifica primero en cache
        const cacheKey = this.generateCacheKey(request);
        const cachedResult = await this.cacheRepository.get(cacheKey);

        if (cachedResult) {
            console.log('Solicitud obtenida desde caché', cacheKey);
            return JSON.parse(cachedResult);
        }

        // Obtiene el mutex para esta clave de caché específica
        const mutex = this.getMutex(cacheKey);

        // Si ya hay una solicitud activa con la misma clave y el mutex está bloqueado
        if (this.activeRequests.has(cacheKey) && mutex.isLocked()) {
            console.log('Esperando a que termine la solicitud existente para:', cacheKey);
            
            // Crear una promesa que se resolverá cuando se emita el evento de finalización
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.eventEmitter.removeListener(`finished:${cacheKey}`, onFinished);
                    reject(new Error('Tiempo de espera agotado para la solicitud de predicciones'));
                }, 60000); // Timeout de 1 minuto

                const onFinished = async () => {
                    clearTimeout(timeout);
                    try {
                        // Intentar obtener el resultado de la caché después de que la otra solicitud termine
                        const result = await this.cacheRepository.get(cacheKey);
                        if (result) {
                            resolve(JSON.parse(result));
                        } else {
                            // Si no hay resultado en caché, ejecutar la solicitud nuevamente
                            resolve(await this.run(request));
                        }
                    } catch (error) {
                        reject(error);
                    }
                };

                this.eventEmitter.once(`finished:${cacheKey}`, onFinished);
            });
        }

        // Usamos el mutex para asegurar que solo un proceso realice el cálculo
        return mutex.runExclusive(async () => {
            // Verificamos nuevamente si la solicitud ya está activa
            // (podría haber cambiado mientras esperábamos por el mutex)
            if (this.activeRequests.has(cacheKey)) {
                console.log('La solicitud ya está siendo procesada por otro hilo, esperando...');
                
                return new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        this.eventEmitter.removeListener(`finished:${cacheKey}`, onFinished);
                        reject(new Error('Tiempo de espera agotado para la solicitud de predicciones'));
                    }, 60000);

                    const onFinished = async () => {
                        clearTimeout(timeout);
                        try {
                            const result = await this.cacheRepository.get(cacheKey);
                            if (result) {
                                resolve(JSON.parse(result));
                            } else {
                                resolve(await this.run(request));
                            }
                        } catch (error) {
                            reject(error);
                        }
                    };

                    this.eventEmitter.once(`finished:${cacheKey}`, onFinished);
                });
            }

            // Verificamos caché nuevamente (otra solicitud podría haber completado el cálculo)
            const updatedCache = await this.cacheRepository.get(cacheKey);
            if (updatedCache) {
                console.log('Solicitud obtenida desde caché después de adquirir mutex', cacheKey);
                return JSON.parse(updatedCache);
            }

            // Marcar esta solicitud como activa
            this.activeRequests.set(cacheKey, true);
            console.log('🔄 Iniciando procesamiento para solicitud:', cacheKey);

            try {
                console.log('Obteniendo datos históricos para la solicitud de predicciones');
                const historicalData = await this.fetchHistoricalData(request);
                console.log('Datos históricos obtenidos correctamente');

                console.log('Calculando predicciones');
                const trend = this.predictionMath.calculateTrend(historicalData);
                const predictions = this.predictionMath.generatePredictions(
                    historicalData,
                    trend,
                    request.typePredictions
                );

                console.log('Predicciones calculadas correctamente');
                const response: PredictionsResponse = {
                    sensortype: request.typeSensor,
                    startDate: request.startDate,
                    endDate: request.endDate,
                    historicalData,
                    predictions
                };

                console.log("Almacenando la respuesta en caché...");
                await this.cacheRepository.set(
                    cacheKey,
                    JSON.stringify(response),
                    this.CACHE_TTL
                );
                console.log("Respuesta almacenada en caché.");

                return response;
            } catch (error) {
                console.error('Error al generar las predicciones:', error);
                throw new Error('Error al generar las predicciones');
            } finally {
                // Marcar la solicitud como completada
                this.activeRequests.delete(cacheKey);
                
                // Emitir evento de finalización para despertar a otros hilos esperando
                this.eventEmitter.emit(`finished:${cacheKey}`);
                console.log('✅ Evento de finalización emitido para:', cacheKey);
                
                // Limpiar los mutexes si hay demasiados
                if (this.mutexes.size > 100) {
                    this.cleanupMutexes();
                }
            }
        });
    }

    /**
     * Limpia mutexes no utilizados para prevenir fugas de memoria
     */
    private cleanupMutexes(): void {
        console.log(`Limpiando mutexes. Cantidad actual: ${this.mutexes.size}`);
        // Mantener solo los últimos 50 mutexes (podría ajustarse según necesidades)
        const keysToRemove = [...this.mutexes.keys()].slice(0, this.mutexes.size - 50);
        keysToRemove.forEach(key => this.mutexes.delete(key));
        console.log(`Mutexes después de limpieza: ${this.mutexes.size}`);
    }

    /**
     * Invalida la caché cuando se actualizan los datos de una planta específica
     */
    async invalidateCache(plantId: string): Promise<void> {
        const pattern = `predictions:${plantId}:*`;
        const keys = await this.cacheRepository.keys(pattern);

        if (keys.length > 0) {
            await this.cacheRepository.del(...keys);
            console.log(`Caché invalidada para ${keys.length} entradas de la planta ${plantId}`);
        }
    }

    /**
     * Cierra la conexión con Redis cuando el servicio se apaga
     */
    async shutdown(): Promise<void> {
        // Limpiar los listeners de eventos
        this.eventEmitter.removeAllListeners();
        this.mutexes.clear();
        await this.cacheRepository.disconnect();
    }
}



