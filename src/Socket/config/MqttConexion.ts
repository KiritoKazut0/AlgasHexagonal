import 'dotenv/config'
import mqtt from "mqtt"

const brokerUrl:string = `mqtt://${process.env['IP_STANCIA']} ` || 'mqtt://3.230.42.111'
const username: string = process.env['USERNAME_MQTT'] || 'armando'
const password: string = process.env['PASSWORD_MQTT'] || 'armandorv'

const client = mqtt.connect(`${brokerUrl}:1883`, {
    username,
    password
});

export default client;