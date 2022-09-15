/* eslint-disable */
import { plainToInstance } from 'class-transformer';
import { IsBooleanString, IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, validateSync } from 'class-validator';
import { AppEnv, AppEnvVars } from './config.interface';

class EnvironmentVariables implements AppEnvVars {
  @IsEnum(AppEnv)
  NODE_ENV!: AppEnv;

  @IsNumberString()
  PORT: string = '3000';

  @IsString()
  @IsNotEmpty()
  DB_HOST!: string;

  @IsNumberString()
  DB_PORT!: string;

  @IsString()
  @IsNotEmpty()
  DB_USER!: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME!: string;

  @IsString()
  @IsOptional()
  MONGO_DB_URL?: string;

  @IsString()
  @IsNotEmpty()
  REDIS_URL!: string;

  @IsString()
  @IsNotEmpty()
  TELEGRAM_BOT_TOKEN!: string;

  @IsBooleanString()
  @IsNotEmpty()
  TELEGRAM_BOT_VERIFICATION_DISABLED!: string;

  @IsString()
  @IsNotEmpty()
  TZ!: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    // red font color for error message 
    // https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
    console.error('\x1b[31m%s\x1b[0m', errors.toString())
    throw new Error('Env vars missing');
  }

  return validatedConfig;
}
