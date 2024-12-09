import PredictionMathInterface from "../../aplication/utils/PredictionMath";
import { dataPoint } from "../../domain/DTOS/PrediccionsResponse";

export default class PredictionMath implements PredictionMathInterface {
    
    calculateTrend(data: dataPoint[]): { slope: number; intercept: number; } {
        if (data.length < 2) {
            throw new Error("Se necesitan al menos dos puntos de datos para calcular la tendencia");
        }

        const n = data.length;
        
        const xValues = data.map(d => this.getTimeValue(d.time));
        const yValues = data.map(d => d.value);

        const sumX = xValues.reduce((a, b) => a + b, 0);
        const sumY = yValues.reduce((a, b) => a + b, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
        const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

        const denominator = (n * sumXX - sumX * sumX);
        
        if (denominator === 0) {
            throw new Error("No se puede calcular la tendencia: división por cero");
        }

        const slope = (n * sumXY - sumX * sumY) / denominator;
        const intercept = (sumY - slope * sumX) / n;
        console.log({slope, intercept});
        
        return { slope, intercept };
    }

    generatePredictions(
        historicalData: dataPoint[],
        trend: { slope: number; intercept: number; },
        type: "week" | "month" | "hours" | "days",
        endDate?: string
    ): dataPoint[] {
        
        if (historicalData.length === 0) {
            throw new Error("Se requieren datos históricos para generar predicciones");
        }


        let weekTrend = trend;
        if (type === 'week') {
            const n = historicalData.length;
            const xValues = historicalData.map((d, index) => index);
            const yValues = historicalData.map(d => d.value);

            const sumX = xValues.reduce((a, b) => a + b, 0);
            const sumY = yValues.reduce((a, b) => a + b, 0);
            const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
            const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

            const denominator = (n * sumXX - sumX * sumX);
            weekTrend = {
                slope: (n * sumXY - sumX * sumY) / denominator,
                intercept: (sumY - ((n * sumXY - sumX * sumY) / denominator) * sumX) / n
            };
        }

        const predictions: dataPoint[] = [];
        const lastDataPoint = historicalData[historicalData.length - 1];
        const futurePoints = 4;
        
        const limitDate = endDate ? new Date(endDate) : null;

        for (let i = 1; i <= futurePoints; i++) {
            let predictedValue: number;
            let nextTime: string;
            const lastTimeValue = this.getTimeValue(lastDataPoint.time);

            switch (type) {
                case 'week': {
                    const [year, weekStr] = lastDataPoint.time.split('-W');
                    let currentYear = parseInt(year);
                    let nextWeek = parseInt(weekStr) + i;
                    
                    if (nextWeek > 52) {
                        currentYear += 1;
                        nextWeek = nextWeek - 52;
                    }
                    
                    nextTime = `${currentYear}-W${nextWeek.toString().padStart(2, '0')}`;
                    // Usamos la tendencia recalculada para semanas
                    predictedValue = weekTrend.slope * (historicalData.length + i - 1) + weekTrend.intercept;
                    break;
                }

                case 'hours': {
                    const [date, hour] = lastDataPoint.time.split(' ');
                    const currentHour = parseInt(hour);
                    let nextHour = currentHour + i;
                    let nextDate = new Date(date);
                    
                    if (nextHour >= 24) {
                        nextDate.setDate(nextDate.getDate() + 1);
                        nextHour = nextHour % 24;
                    }
                    
                    if (limitDate && nextDate > limitDate) {
                        continue;
                    }
                    
                    nextTime = `${nextDate.toISOString().split('T')[0]} ${nextHour.toString().padStart(2, '0')}:00`;
                    predictedValue = trend.slope * (currentHour + i) + trend.intercept;
                    break;
                }

                case 'days': {
                    const currentDate = new Date(lastDataPoint.time);
                    const nextDate = new Date(currentDate);
                    nextDate.setDate(currentDate.getDate() + i);
                    
                    if (limitDate && nextDate > limitDate) {
                        continue;
                    }
                    
                    nextTime = nextDate.toISOString().split('T')[0];
                    const nextDay = parseInt(nextTime.split('-')[2]);
                    predictedValue = trend.slope * nextDay + trend.intercept;
                    break;
                }

                default:
                    throw new Error(`Tipo de predicción no soportado: ${type}`);
            }

            predictions.push({
                time: nextTime,
                value: Number(predictedValue.toFixed(1))
            });
        }

        return predictions;
    }

    private getTimeValue(timeStr: string): number {
        if (timeStr.includes('W')) {
            return parseInt(timeStr.split('W')[1]);
        }
        
        if (timeStr.includes(':')) {
            return parseInt(timeStr.split(' ')[1]);
        }
        
        if (timeStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return parseInt(timeStr.split('-')[2]);
        }
        
        if (timeStr.match(/^\d{4}-\d{2}$/)) {
            return parseInt(timeStr.split('-')[1]);
        }
        
        throw new Error(`Formato de tiempo no reconocido: ${timeStr}`);
    }
}