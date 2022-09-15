import { UseFilters } from '@nestjs/common';
import { I18n, I18nService } from 'nestjs-i18n';
import { Action, Ctx, Message, Next, Wizard, WizardStep } from 'nestjs-telegraf';
import type { Scenes } from 'telegraf';

import { TelegrafExceptionFilter } from '@/common/filters/telegram-exception.filter';
import type { Chat } from '@/modules/chat/chat.interface';
import { ShopService } from '@/modules/shop/shop.service';

import { MOODLE_BOT_SCENES, TELEGRAM_EMOJIES } from '../../bot.constants';
import { CtxChat } from '../../decorators/chat.decorator';
import { BaseScene } from '../base/base.scene';
import { INIT_SCENE_ACTIONS, INIT_SCENE_STEPS } from './init.constants';

@Wizard(MOODLE_BOT_SCENES.INIT)
@UseFilters(TelegrafExceptionFilter)
export class InitScene extends BaseScene {
  private SHOP_TITLE_KEY: string = 'shop-title';

  constructor(@I18n() i18n: I18nService, private shopService: ShopService) {
    super(i18n);
  }

  @WizardStep(INIT_SCENE_STEPS.ENTER_SHOP_TITLE)
  public async shopTitleEnterStep(@Ctx() ctx: Scenes.WizardContext): Promise<void> {
    const message = this.getMessage('init.enter-shop-title');
    await ctx.reply(message);
    this.nextStep(ctx);
  }

  @WizardStep(INIT_SCENE_STEPS.CONFIRM_SHOP_TITLE)
  public async shopTitleConfirmStep(
    @Ctx() ctx: Scenes.WizardContext,
      @Next() next: () => Promise<void>,
      @Message('text') shopTitle: string,
  ): Promise<void> {
    if (!shopTitle) {
      const message = this.getMessage('init.invalid-shop-title');
      await ctx.reply(message);
      // set password step
      await this.runStep(ctx, next, INIT_SCENE_STEPS.ENTER_SHOP_TITLE);
    } else {
      this.setShopTitle(ctx, shopTitle);

      const message = this.getMessage('init.confirm', { shopTitle });

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          remove_keyboard: true,
          one_time_keyboard: true,
          inline_keyboard: [
            [{ text: this.commonMessages['yes'], callback_data: INIT_SCENE_ACTIONS.INIT_CONFIRM }],
            [{ text: this.commonMessages['edit'], callback_data: INIT_SCENE_ACTIONS.INIT_CHANGE }],
            [{ text: this.commonMessages['cancel'], callback_data: INIT_SCENE_ACTIONS.INIT_CANCEL }],
          ],
        },
      });
    }
  }

  @Action(new RegExp(`${INIT_SCENE_ACTIONS.INIT_CHANGE}`))
  public async initChangeAction(@Ctx() ctx: Scenes.WizardContext, @Next() next: () => Promise<void>) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.PENCIL}`, { parse_mode: 'Markdown' });

    await this.runStep(ctx, next, INIT_SCENE_STEPS.ENTER_SHOP_TITLE);
  }

  @Action(new RegExp(`${INIT_SCENE_ACTIONS.INIT_CONFIRM}`))
  public async initConfirmAction(@Ctx() ctx: Scenes.WizardContext, @CtxChat() chat: Chat) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.CHECK_MARK}`, { parse_mode: 'Markdown' });

    await this.shopService.createShop({ ownerChatId: chat.id, title: this.getShopTitle(ctx) });

    const message = this.getMessage('init.saved', { shopTitle: this.getShopTitle(ctx) });
    await ctx.reply(`${message} ${TELEGRAM_EMOJIES.RAISING_HANDS}`, { parse_mode: 'Markdown' });

    await ctx.scene.leave();
  }

  @Action(new RegExp(`${INIT_SCENE_ACTIONS.INIT_CANCEL}`))
  public async initCancelAction(@Ctx() ctx: Scenes.WizardContext) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.CROSS_MARK}`, { parse_mode: 'Markdown' });

    await this.leaveScene(ctx);
  }

  private getShopTitle(ctx: Scenes.WizardContext) {
    return <string> this.getState(ctx)[this.SHOP_TITLE_KEY];
  }

  private setShopTitle(ctx: Scenes.WizardContext, feedback: string) {
    return this.setState(ctx, this.SHOP_TITLE_KEY, feedback);
  }
}
