import 'dotenv/config'
import nodemailer from "nodemailer";


const EMAIL_USER = process.env['EMAIL_SERVER'] || ''; 
const EMAIL_PASS = process.env['EMAIL_PASS'] || '';



// Crear el transportador de Nodemailera
const Mailertransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});



async function testConnection() {
  try {
      console.log('Verificando conexión...');
      await Mailertransporter.verify();
      console.log('Servidor listo para enviar emails');
  } catch (error) {
      console.error('Error al verificar la conexión:', error);
  }
}


testConnection();

export default Mailertransporter;
