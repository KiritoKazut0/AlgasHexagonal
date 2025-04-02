import ClientFuncion from "../config/MqttConexion";
import { Server } from "socket.io";
import SensorsDataRequest from "../interfaces/DTOS/Sensors/DataRequest";
import addReadings from "../controllers/AddReadings";



export const setUpMqtt = async (io: Server) => {
    const client = ClientFuncion();
    const topic = 'BioReact/Sensors';
    const tenMinutes = 10 * 60 * 1000;
    let isProcessing = false;

    let latestMessage: SensorsDataRequest = {
        hidrogen: 0, oxygen: 0, ph: 0, temperature: 0, id_plant: ''
    };

    client.on('connect', () => {
        console.log('Conectado al broker MQTT');

        client.subscribe(topic, (error) => {
            if (!error) {
                console.log(`Suscrito al tema: ${topic}`);
            } else {
                console.error('Error al suscribirse:', error);
            }
        });
    });

    client.on('message', (topic: string, message: Buffer) => {
        try {
            latestMessage = JSON.parse(message.toString()) as SensorsDataRequest;
            
            io.emit('graphics', latestMessage);

        } catch (error) {
            console.error('Error al procesar el mensaje:', error);
        }
    });




    setInterval(async () => {
        if (isProcessing) {
            console.log('Esperando a que se complete la operación anterior...');
            return;
        }

        isProcessing = true; 

       

        try {
            if (latestMessage && latestMessage.id_plant){
                console.log('Enviando datos cada diez minutos');
                 await addReadings({
                     hydrogen: latestMessage.hidrogen,
                     id_plant: latestMessage.id_plant,
                     oxigen: latestMessage.oxygen,
                     ph: latestMessage.ph,
                     temperature: latestMessage.temperature
                 }, io);

                 io.emit('statistics', latestMessage); 
            }
            
        } catch (error) {
            console.error('Error al intentar guardar los datos:', error);
        } finally {
            isProcessing = false; 
        }
    }, tenMinutes);


    client.on('error', (err) => {
        console.error('Error en el cliente MQTT:', err);
    });

    client.on('close', () => {
        console.log('Conexión cerrada');
    });

};
