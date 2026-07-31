import { utilities as nestWinstonUtilities, WinstonModuleOptions } from 'nest-winston';
import winston from 'winston';
import 'winston-daily-rotate-file';

/** NestJS Winston 日志配置 */
export const winstonConfig: WinstonModuleOptions = {
  transports: [
    // 控制台 —— 开发环境彩色输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'MM-DD HH:mm:ss.SSS' }),
        winston.format.ms(),
        nestWinstonUtilities.format.nestLike('TodoList', {
          colors: true,
          prettyPrint: true,
          processId: false,
          appName: true,
        }),
      ),
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),

    // 所有日志 —— 按天滚动，保留 30 天
    new winston.transports.DailyRotateFile({
      dirname: 'logs',
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json(),
      ),
      level: 'info',
    }),

    // 错误日志单独输出
    new winston.transports.DailyRotateFile({
      dirname: 'logs',
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json(),
      ),
      level: 'error',
    }),
  ],

  // 可选全局异常日志
  exceptionHandlers: [
    new winston.transports.DailyRotateFile({
      dirname: 'logs',
      filename: 'exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
};
