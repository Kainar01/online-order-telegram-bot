import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import type { AppConfig } from '../config.interface';

export const config: AppConfig = {
  db: {
    type: 'postgres',
    entities: [`${__dirname}/../../modules/**/*.entity.{js,ts}`],
    synchronize: false,
    subscribers: [`${__dirname}/../../db/subscriber/**/*.{js,ts}`],
    migrations: [`${__dirname}/../../db/migration/**/*.{js,ts}`],
    namingStrategy: new SnakeNamingStrategy(),
  },
  server: {
    port: Number(process.env.PORT) || 3000,
    cors: false,
  },
  bot: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    verificationDisabled: <boolean>JSON.parse(process.env.TELEGRAM_BOT_VERIFICATION_DISABLED),
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  mongodb: {
    url: process.env.MONGO_DB_URL,
  },
};
