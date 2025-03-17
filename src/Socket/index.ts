import 'dotenv/config';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { setUpMqtt } from './mqtt/mqtt';
import connectToDatabase from './config/ConexionDatabase';
import getAvarageAlgae from './controllers/getAvarage';

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  },
});

const PORT = parseInt(process.env['PORT'] || '3002');

app.get('/', (_req, res) => {
  res.send('Hola mundo');
});

io.on('connection', (socket) => {
  console.log('✅ Un usuario se ha conectado');

  // Evento para obtener los datos de la gráfica de barra
  socket.on('graphic_barra', async ({ id_plant }: { id_plant: string }) => {
    console.log(`📊 Solicitando datos de gráfica para planta: ${id_plant}`);

    try {
      const data = await getAvarageAlgae({ id_plant });
      socket.emit('graphic_barra_response', { success: true, data });
    } catch (error) {
      console.error(`❌ Error al obtener datos para ${id_plant}:`, error);
      socket.emit('graphic_barra_response', { success: false, error: 'Error obteniendo datos' });
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Usuario desconectado');
  });
});

async function startWebSocketServer() {
  try {
    await setUpMqtt(io);
    await connectToDatabase();
    server.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
}

startWebSocketServer();
