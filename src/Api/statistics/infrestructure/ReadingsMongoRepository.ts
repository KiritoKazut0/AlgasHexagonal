import { ReadinsModel } from "./models/ReadingsModel";
import StatisticsRepository from "../domain/StatisticsRepository";
import PrediccionsRequest from "../domain/DTOS/PrediccionsRequest";
import { dataPoint } from "../domain/DTOS/PrediccionsResponse";
import { Types } from 'mongoose';
import ReportDataRequest from "../domain/DTOS/ReportDataRequest";
import ReportDataResponse from "../domain/DTOS/ReportDataResponse";

export default class ReadingsMongoRepository implements StatisticsRepository {
    constructor(readonly model: typeof ReadinsModel) { }

    async getPredictionsByHour(request: PrediccionsRequest): Promise<dataPoint[] | null> {

        const result = await this.model.aggregate([
            {
                $match: {
                    id_plant: new Types.ObjectId(request.idPlant),
                    register_date: {
                        $gte: new Date(request.startDate),
                        $lte: new Date(request.endDate)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d %H:00",
                            date: "$register_date"
                        }
                    },
                    average: {
                        $avg: `$${request.typeSensor.toLowerCase()}`
                    },
                    count: { $sum: 1 } // Ver cuántos documentos hay en cada grupo
                }
            },
            {
                $sort: {
                    "_id": 1
                }
            },
            {
                $project: {
                    _id: 0,
                    time: "$_id",
                    value: { $round: ["$average", 2] },
                    count: 1 // Incluir conteo para verificar agrupación
                }
            }
        ]);


        return result;
    }

    async getPredictionsByWeek(request: PrediccionsRequest): Promise<dataPoint[] | null> {
     
        const result = await this.model.aggregate([
            {
                $match: {
                    id_plant: new Types.ObjectId(request.idPlant),
                    register_date: {
                        $gte: new Date(request.startDate),
                        $lte: new Date(request.endDate)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d %H:00",
                            date: "$register_date"
                        }
                    },
                    count: { $sum: 1 }, // Contamos la cantidad de lecturas por hora
                    value: {
                        $avg: `$${request.typeSensor.toLowerCase()}` // calcula promedio del sensor
                    }
                }
            },
            {
                $sort: {
                    "_id": 1 // se ordena por hora
                }
            },
            {
                $project: {
                    _id: 0,
                    time: "$_id",
                    count: 1, 
                    value: { $round: ["$value", 1] } // Redondeo aun decimal
                }
            }
        ]);
        
       
        


        return result;
    }

    async getPredictionsByDays(request: PrediccionsRequest): Promise<dataPoint[] | null> {
        const result = await this.model.aggregate([
            {
                $match: {
                    id_plant: new Types.ObjectId(request.idPlant),
                    register_date: {
                        $gte: new Date(request.startDate),
                        $lte: new Date(request.endDate)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$register_date"
                        }
                    },
                    value: {
                        $avg: `$${request.typeSensor.toLowerCase()}`
                    }
                }
            },
            {
                $sort: {
                    "_id": 1
                }
            },
            {
                $project: {
                    _id: 0,
                    time: "$_id",
                    value: {
                        $round: ["$value", 1]
                    }
                }
            }
        ]);


        return result;

    }

    async getWeeklyStats(request: ReportDataRequest): Promise<ReportDataResponse[] | null> {
        const result = await this.model.aggregate([
            {
                $match: {
                    id_plant: new Types.ObjectId(request.plantId),
                    register_date: {
                        $gte: new Date(request.startDate),
                        $lte: new Date(request.endDate)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-W%V",
                            date: "$register_date"
                        }
                    },
                    avgHydrogen: { $avg: "$hydrogen" },
                    avgOxigen: { $avg: "$oxigen" },
                    avgPh: { $avg: "$ph" },
                    avgTemperature: { $avg: "$temperature" },
                    count: { $sum: 1 },
                    minDate: { $min: "$register_date" },
                    maxDate: { $max: "$register_date" }
                }
            },
            {
                $project: {
                    _id: 0,
                    weekNumber: "$_id",
                    avgHydrogen: { $round: ["$avgHydrogen", 2] },
                    avgOxigen: { $round: ["$avgOxigen", 2] },
                    avgPh: { $round: ["$avgPh", 2] },
                    avgTemperature: { $round: ["$avgTemperature", 2] },
                    count: 1,
                    minDate: 1,
                    maxDate: 1
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);


        const response: ReportDataResponse[] = result.map(item => ({
            plantId: request.plantId,
            period: item.weekNumber,
            averages: {
                hydrogen: item.avgHydrogen,
                oxygen: item.avgOxigen,
                ph: item.avgPh,
                temperature: item.avgTemperature
            },
            measurementsCount: item.count,
            reportType: request.reportType
        }));


        return response;
    }


    async getMonthlyStats(request: ReportDataRequest): Promise<ReportDataResponse[] | null> {
        const result = await this.model.aggregate([
            {
                $match: {
                    id_plant: new Types.ObjectId(request.plantId),
                    register_date: {
                        $gte: new Date(request.startDate),
                        $lte: new Date(request.endDate)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m",
                            date: "$register_date"
                        }
                    },
                    avgHydrogen: { $avg: "$hydrogen" },
                    avgOxigen: { $avg: "$oxigen" },
                    avgPh: { $avg: "$ph" },
                    avgTemperature: { $avg: "$temperature" },
                    count: { $sum: 1 },
                    minDate: { $min: "$register_date" },
                    maxDate: { $max: "$register_date" }
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);

        const response: ReportDataResponse[] = result.map(item => ({
            plantId: request.plantId,
            period: item._id,
            averages: {
                hydrogen: parseFloat(item.avgHydrogen.toFixed(2)),
                oxygen: parseFloat(item.avgOxigen.toFixed(2)),
                ph: parseFloat(item.avgPh.toFixed(2)),
                temperature: parseFloat(item.avgTemperature.toFixed(2))
            },
            measurementsCount: item.count,
            reportType: request.reportType
        }));

        return response;
    }

    async getDayliStats(request: ReportDataRequest): Promise<ReportDataResponse[] | null> {
        const result = await this.model.aggregate([
            {
                $match: {
                    id_plant: new Types.ObjectId(request.plantId),
                    register_date: {
                        $gte: new Date(request.startDate),
                        $lte: new Date(request.endDate)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$register_date"
                        }
                    },
                    avgHydrogen: { $avg: "$hydrogen" },
                    avgOxigen: { $avg: "$oxigen" },
                    avgPh: { $avg: "$ph" },
                    avgTemperature: { $avg: "$temperature" },
                    count: { $sum: 1 },
                    minDate: { $min: "$register_date" },
                    maxDate: { $max: "$register_date" }
                }
            },
            {
                $project: {
                    _id: 0,
                    dayDate: "$_id",
                    avgHydrogen: { $round: ["$avgHydrogen", 2] },
                    avgOxigen: { $round: ["$avgOxigen", 2] },
                    avgPh: { $round: ["$avgPh", 2] },
                    avgTemperature: { $round: ["$avgTemperature", 2] },
                    count: 1,
                    minDate: 1,
                    maxDate: 1
                }
            },
            {
                $sort: { "dayDate": 1 }
            }
        ]);

        const response: ReportDataResponse[] = result.map(item => ({
            plantId: request.plantId,
            period: item.dayDate,
            averages: {
                hydrogen: item.avgHydrogen,
                oxygen: item.avgOxigen,
                ph: item.avgPh,
                temperature: item.avgTemperature
            },
            measurementsCount: item.count,
            reportType: request.reportType
        }));

        return response;
    }


}