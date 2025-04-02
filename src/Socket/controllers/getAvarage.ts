import { Types } from "mongoose";
import { ReadinsModel } from "../Models/Readings";
import getWeekRangeSundayToSaturday from "../utils/getWeekRangeSundayToSaturday";
import GetAvarageResponse from "../interfaces/DTOS/getAvarageResponse";
import { Semaphore } from "async-mutex";
import redisClient from "../config/redisClient";

const semaphores: { [key: string]: Semaphore } = {};
const pendingPromises: { [key: string]: Promise<GetAvarageResponse[]> } = {};

const getAvarageAlgae = async ({ id_plant }: { id_plant: string }): Promise<GetAvarageResponse[]> => {
  console.log({ id_plant });
  if (!Types.ObjectId.isValid(id_plant)) {
    throw new Error("ID de planta no válido");
  }

  const cacheKey = `avarage_algae:${id_plant}`;
  const cachedData = await redisClient.get(cacheKey);
  if (cachedData) {
    console.log(`🔵 Datos obtenidos desde caché para planta: ${id_plant}`);
    return JSON.parse(cachedData);
  }

  if (await pendingPromises[id_plant]) {
    console.log(`🔄 Usando consulta en curso para planta: ${id_plant}`);
    return pendingPromises[id_plant];
  }

  if (!semaphores[id_plant]) {
    semaphores[id_plant] = new Semaphore(1);
  }

  pendingPromises[id_plant] = (async () => {
    return await semaphores[id_plant].acquire().then(async ([, release]) => {
      try {
        console.log(`🔓 Semáforo adquirido para planta: ${id_plant}`);

        const { sunday: startSunday, saturday: endSaturday } = getWeekRangeSundayToSaturday();

        const result = await ReadinsModel.aggregate([
          {
            $match: {
              id_plant: new Types.ObjectId(id_plant),
              register_date: { $gte: startSunday, $lte: endSaturday }
            }
          },
          {
            $group: {
              _id: {
                $dayOfWeek: {
                  date: "$register_date",
                  timezone: "America/Mexico_City"  
                }
              },
              hydrogen: { $avg: "$hydrogen" },
              oxygen: { $avg: "$oxigen" },
              ph: { $avg: "$ph" },
              temperature: { $avg: "$temperature" },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]).option({ maxTimeMS: 30000, allowDiskUse: true });

      

        const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

        const daysWithData: GetAvarageResponse[] = result.map(dayData => ({
          plantId: id_plant,
          period: daysOfWeek[dayData._id - 1],
          averages: {
            hydrogen: dayData.hydrogen,
            oxygen: dayData.oxygen,
            ph: dayData.ph,
            temperature: dayData.temperature
          },
          measurementsCount: dayData.count,
          reportType: 'days'
        }));

         await redisClient.set(cacheKey, JSON.stringify(daysWithData), 'EX', 600);

        console.log(`✅ Datos almacenados en caché para planta: ${id_plant}`);
        return daysWithData;
      } catch (error) {
        console.error(`❌ Error procesando datos para planta ${id_plant}:`, error);
        throw error;
      } finally {
        delete pendingPromises[id_plant];
        console.log(`🔓 Liberando semáforo para planta: ${id_plant}`);
        release();
      }
    });
  })();

  return pendingPromises[id_plant];
};

export default getAvarageAlgae;
