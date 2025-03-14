import mongoose from "mongoose";
import 'dotenv/config';

const MONGODB_HOST = process.env['MONGODB_HOST'] || 'localhost';
const PORT_DATABASE = process.env['PORT_DATABASE'] || '';
const MONGODB_DATABASE = process.env['NAME_DATABASE'] || '';

const MongoUrl = `mongodb://${MONGODB_HOST}:${PORT_DATABASE}/${MONGODB_DATABASE}`;


export default async function connectToDatabase() {
    try {
        await mongoose.connect(MongoUrl, {
            connectTimeoutMS: 10000  
        });
        console.log('Database connected successfully');
       
    } catch (error) {
        handleDatabaseError(error);
    }
}

function handleDatabaseError(error: unknown): void {
    if (error instanceof mongoose.Error) {
        switch (error.name) {
            case 'MongoNetworkError':
                console.error('Network error: unable to reach MongoDB server. Check your connection.');
                break;
            case 'MongooseServerSelectionError':
                console.error('Server selection error: unable to connect to the specified MongoDB server.');
                break;
            default:
                console.error(`Mongoose error: ${error.message}`);
                break;
        }
    } else {
        console.error('An unknown error occurred while connecting to the database.');
    }
}



