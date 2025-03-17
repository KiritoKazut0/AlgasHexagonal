export default interface GetAvarageResponse {
    plantId: string;
    period: string;
    averages: {
      hydrogen: number;
      oxygen: number;
      ph: number;
      temperature: number;
    };
    measurementsCount: number;
    reportType: 'days';
  }