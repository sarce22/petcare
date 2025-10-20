import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './app.js';
import * as logger from './utils/logger.js';

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

function sanitizeMongoUri(uri) {
  if (typeof uri !== 'string') {
    return 'unknown';
  }

  return uri.replace(/\/\/([^:@]+):([^@]+)@/, '//***:***@');
}

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

    logger.info('Starting PetCare API...', { port: PORT });
    logger.info('Connecting to MongoDB...', {
      uri: sanitizeMongoUri(MONGODB_URI),
      auth: connectionOptions.auth ? 'using credentials' : 'without credentials'
    });

    mongoose.connection.on('connected', () => {
      logger.success('MongoDB connection established.', {
        host: mongoose.connection.host,
        db: mongoose.connection.name
      });
    });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error.', { message: error.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection lost.');
    });

    await mongoose.connect(MONGODB_URI, connectionOptions);

    app.listen(PORT, '0.0.0.0', () => {
      logger.banner(`PetCare API ready on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to initialize application.', { message: error.message, stack: error.stack });
    process.exitCode = 1;
  }
}

bootstrap();

async function gracefulShutdown(signal) {
  logger.warn(`Received ${signal}. Closing MongoDB connection...`);
  await mongoose.connection.close();
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
