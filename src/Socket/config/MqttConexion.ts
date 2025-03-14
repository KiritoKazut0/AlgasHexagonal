
import mqtt from "mqtt"

 const ClientFuncion =  () => {
    const brokerUrl:string = `mqtt://${process.env['IP_STANCIA']}:1883`
    const username: string = process.env['USERNAME_MQTT'] || 'guest'
    const password: string = process.env['PASSWORD_MQTT'] || 'guest'


    const connection = mqtt.connect(`${brokerUrl}`, {
        username: username,
        password: password
    });

    return connection
 }

export default ClientFuncion;