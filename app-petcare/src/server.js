import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petcare';
const {
  MONGODB_USER,
  MONGODB_PASS,
  MONGODB_DB_NAME,
  MONGODB_AUTH_SOURCE,
  MONGODB_REPLICA_SET,
  MONGODB_TLS
} = process.env;

mongoose.set('strictQuery', true);

async function bootstrap() {
  try {
    const connectionOptions = {
      serverSelectionTimeoutMS: 5000
    };

    if (MONGODB_USER && MONGODB_PASS) {
      connectionOptions.auth = {
        username: MONGODB_USER,
        password: MONGODB_PASS
      };
    }

    if (MONGODB_DB_NAME) {
      connectionOptions.dbName = MONGODB_DB_NAME;
    }

    if (MONGODB_AUTH_SOURCE) {
      connectionOptions.authSource = MONGODB_AUTH_SOURCE;
    }

    if (MONGODB_REPLICA_SET) {
      connectionOptions.replicaSet = MONGODB_REPLICA_SET;
    }

    if (MONGODB_TLS === 'true' || MONGODB_TLS === '1') {
      connectionOptions.tls = true;
    }

    await mongoose.connect(MONGODB_URI, connectionOptions);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`PetCare API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize application', error);
    process.exitCode = 1;
  }
}

bootstrap();

async function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Closing MongoDB connection...`);
  await mongoose.connection.close();
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
