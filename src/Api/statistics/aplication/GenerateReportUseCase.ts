import StatisticsRepository from "../domain/StatisticsRepository";
import ReportDataRequest from "../domain/DTOS/ReportDataRequest";
import ReportDataResponse from "../domain/DTOS/ReportDataResponse";
import { ICacheRepository } from "../domain/ICacheRepository";
import { CACHE_TTL } from "../../config/RedisConection";

export default class ReportUseCase {
    constructor(
        readonly statisticsRepository: StatisticsRepository,
        readonly cacheRepository: ICacheRepository
    ) { }

    private async getFromCache(key: string): Promise<ReportDataResponse[] | null> {
        const cachedData = await this.cacheRepository.get(key);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        return null;
    }

    private async storeInCache(key: string, data: ReportDataResponse[]): Promise<void> {
        await this.cacheRepository.set(key, JSON.stringify(data), CACHE_TTL);
    }

    async run(request: ReportDataRequest): Promise<ReportDataResponse[] | null> {
        let result: ReportDataResponse[] | null = null;
        const cacheKey = `report:${request.reportType}:${request.startDate}:${request.endDate}`;

        result = await this.getFromCache(cacheKey);
        if (result) {
            return result;
        }

        switch (request.reportType) {
            case 'week': 
                result = await this.statisticsRepository.getWeeklyStats(request);
                break;
            case 'month':  
                result = await this.statisticsRepository.getMonthlyStats(request);
                break;
            case 'days': 
                result = await this.statisticsRepository.getDayliStats(request);
                break;
            default:
                throw new Error(`Invalid report type: ${request.reportType}`);
        }

        if (result) {
            await this.storeInCache(cacheKey, result);
        }

        return result;
    }
}
