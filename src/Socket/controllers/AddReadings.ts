import { ReadinsModel } from "../Models/Readings";
import addRequest from "../interfaces/DTOS/AddRequest";

const addReadings = async (request: addRequest): Promise<void> => {
    try {
        const { hydrogen, id_plant, oxigen, ph, temperature } = request
        await ReadinsModel.create({
            id_plant,
            hydrogen,
            oxigen,
            ph,
            temperature
        });

    } catch (error) {
        console.error(error);
        throw new Error('Se produjo un error al intentar guardar la lectura de los sensores');
    }
}

export default addReadings;