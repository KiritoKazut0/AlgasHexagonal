import 'dotenv/config';
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { setUpMqtt } from './mqtt/mqtt';
import connectToDatabase from './config/ConexionDatabase'; // Conexión a la DB

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
  console.log('a user has connected');

  socket.on('disconnect', () => {
    console.log('user has disconnected');
  });
});

async function startWebSocketServer() {
  try {
    await connectToDatabase();
    setUpMqtt(io);

    server.listen(PORT, () => {
      console.log(`server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al conectar con la base de datos en WebSocket:', error);
    process.exit(1);
  }
}

startWebSocketServer();
