import { ReadinsModel } from "../Models/Readings";
import { Types } from "mongoose";
import redisClient from "../config/redisClient";
import addRequest from "../interfaces/DTOS/AddRequest";
import { Server } from "socket.io";

const addReadings = async (request: addRequest, socket: Server): Promise<void> => {
    try {
        const { hydrogen, id_plant, oxigen, ph, temperature } = request;

     
        const newReading = await ReadinsModel.create({
            id_plant,
            hydrogen,
            oxigen,
            ph,
            temperature
        });

     
        const registerDate = newReading.register_date;
        const dayOfWeek = registerDate.getDay(); 


        const result = await ReadinsModel.aggregate([
            {
                $match: {
                    id_plant: new Types.ObjectId(id_plant),
                    register_date: {
                        $gte: new Date(registerDate.setHours(0, 0, 0, 0)), 
                        $lte: new Date(registerDate.setHours(23, 59, 59, 999)) 
                    }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$register_date" },
                    hydrogen: { $avg: "$hydrogen" },
                    oxygen: { $avg: "$oxygen" },
                    ph: { $avg: "$ph" },
                    temperature: { $avg: "$temperature" },
                    count: { $sum: 1 }
                }
            }
        ]).option({ maxTimeMS: 30000, allowDiskUse: true });

        if (result.length > 0) {
            const dayData = result[0];


            const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
            const dayName = daysOfWeek[dayOfWeek];

            const dayWithData = {
                plantId: id_plant,
                period: dayName,
                averages: {
                    hydrogen: dayData.hydrogen,
                    oxigen: dayData.oxygen,
                    ph: dayData.ph,
                    temperature: dayData.temperature
                },
                measurementsCount: dayData.count,
                reportType: 'day'
            };


            const expirationTime = new Date(registerDate).getTime() + 24 * 60 * 60 * 1000; 
            const ttlInSeconds = Math.floor((expirationTime - Date.now()) / 1000); 

   
            const cacheKey = `avarage_algae:${id_plant}`;
            await redisClient.set(cacheKey, JSON.stringify([dayWithData]), 'EX', ttlInSeconds);

            console.log(`✅ Promedio del día actualizado en caché para la planta: ${id_plant}`);

         
            socket.emit('graphic_barra_newData', { success: true, data: [dayWithData]});

            console.log(`🔊 Datos emitidos al frontend para la planta: ${id_plant}`);
        }
    } catch (error) {
        console.error(error);
        throw new Error('Se produjo un error al intentar guardar la lectura de los sensores');
    }
}

export default addReadings;
