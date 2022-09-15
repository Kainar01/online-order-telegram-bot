import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';

import { ValidationException } from '../exceptions/validation.exception';
import type { BotContext } from '../interfaces/bot.interface';

@Injectable()
export class BotShopGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const ctx = TelegrafExecutionContext.create(context);
    const botContext = ctx.getContext<BotContext>();

    if (!botContext.shop) {
      throw new ValidationException('У вас должен быть свой шоп');
    }

    return true;
  }
}
