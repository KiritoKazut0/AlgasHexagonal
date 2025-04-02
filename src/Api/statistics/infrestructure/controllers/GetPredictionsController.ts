import { Request, Response } from "express";
import GetPredictionsUseCase from "../../aplication/GetPredictionsUseCase";
import PrediccionsRequest from "../../domain/DTOS/PrediccionsRequest";

export default class GetPredictionsControllers {
    constructor(readonly getPredictionsUseCase: GetPredictionsUseCase) { }

    async run(req: Request, res: Response) {
        try {

            const { endDate, idPlant, startDate, typePredictions, typeSensor }: PrediccionsRequest = req.body;
            
            if (!endDate || !idPlant || !startDate || !typePredictions || !typeSensor) {
                return res.status(400).json({
                    msg: 'Faltan campos obligatorios. Asegúrate de incluir todos los parámetros',
                    data: null
                });
            }

            const validPredictionTypes = ['week', 'hours', 'days'];
            if (!validPredictionTypes.includes(typePredictions)) {
                return res.status(400).json({
                    msg: 'Tipo de predicción inválido',
                    data: null
                });
            }

            const predictionsData = await this.getPredictionsUseCase.run({
                endDate, idPlant, startDate, typePredictions, typeSensor
            });

            const response = predictionsData
                ? { status: 200, msg: 'Predicciones generadas correctamente.', data: predictionsData }
                : { status: 404, msg: 'No se encontraron datos suficientes para generar las predicciones.', data: null };

            return res.status(response.status).json({
                data: response.data,
                msg: response.msg
            });


        } catch (error) {
            console.error("Error al procesar la solicitud de predicciones:", error);
            return res.status(500).json({
                msg: 'Error interno del servidor. Por favor, inténtelo más tarde.',
                data: null
            });
        }
    }
}
