import * as winston from 'winston';
import * as path from 'path';

const logDirectory = path.join(process.cwd(), 'reports', 'logs');

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) =>
      `${timestamp} [${level.toUpperCase()}] ${message}`
    )
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: path.join(logDirectory, 'test-execution.log'),
    }),
    new winston.transports.File({
      filename: path.join(logDirectory, 'errors.log'),
      level: 'error',
    }),
  ],
});
