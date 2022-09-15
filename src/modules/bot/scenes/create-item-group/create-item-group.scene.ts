import { UseFilters } from '@nestjs/common';
import { I18n, I18nService } from 'nestjs-i18n';
import { Action, Ctx, Message, Next, Wizard, WizardStep } from 'nestjs-telegraf';
import type { Scenes } from 'telegraf';

import { TelegrafExceptionFilter } from '@/common/filters/telegram-exception.filter';
import type { CreateItemDto } from '@/modules/item/interfaces/item.interface';
import { ItemGroupService } from '@/modules/item/services/item-group.service';
import { ItemService } from '@/modules/item/services/item.service';
import type { Shop } from '@/modules/shop/shop.interface';

import { MOODLE_BOT_SCENES, TELEGRAM_EMOJIES } from '../../bot.constants';
import { CtxShop } from '../../decorators/shop.decorator';
import { ValidationException } from '../../exceptions/validation.exception';
import { BaseScene } from '../base/base.scene';
import { CREATE_ITEM_GROUP_SCENE_ACTIONS, CREATE_ITEM_GROUP_SCENE_STEPS } from './create-item-group.constants';

@Wizard(MOODLE_BOT_SCENES.CREATE_ITEM_GROUP)
@UseFilters(TelegrafExceptionFilter)
export class CreateItemGroupScene extends BaseScene {
  private ITEM_GROUP_TITLE_KEY: string = 'item-group-title';

  constructor(@I18n() i18n: I18nService, private itemGroupService: ItemGroupService, private itemService: ItemService) {
    super(i18n);
  }

  @WizardStep(CREATE_ITEM_GROUP_SCENE_STEPS.TITLE_ENTER)
  public async itemGroupTitleEnterStep(@Ctx() ctx: Scenes.WizardContext): Promise<void> {
    const message = this.getMessage('create-item-group.enter-title');
    await ctx.reply(message);
    this.nextStep(ctx);
  }

  @WizardStep(CREATE_ITEM_GROUP_SCENE_STEPS.TITLE_CONFIRM)
  public async itemGroupTitleConfirmStep(
    @Ctx() ctx: Scenes.WizardContext,
      @Next() next: () => Promise<void>,
      @Message('text') itemGroupTitle: string,
  ): Promise<void> {
    if (!itemGroupTitle) {
      const message = this.getMessage('create-item-group.invalid-title');
      await ctx.reply(message);
      // set password step
      await this.runStep(ctx, next, CREATE_ITEM_GROUP_SCENE_STEPS.TITLE_ENTER);
    } else {
      this.setItemGroupTitle(ctx, itemGroupTitle);

      const message = this.getMessage('create-item-group.confirm', { itemGroupTitle });

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          remove_keyboard: true,
          one_time_keyboard: true,
          inline_keyboard: [
            [{ text: this.commonMessages['yes'], callback_data: CREATE_ITEM_GROUP_SCENE_ACTIONS.CREATE_ITEM_GROUP_CONFIRM }],
            [{ text: this.commonMessages['edit'], callback_data: CREATE_ITEM_GROUP_SCENE_ACTIONS.CREATE_ITEM_GROUP_CHANGE }],
            [{ text: this.commonMessages['cancel'], callback_data: CREATE_ITEM_GROUP_SCENE_ACTIONS.CREATE_ITEM_GROUP_CANCEL }],
          ],
        },
      });
    }
  }

  @WizardStep(CREATE_ITEM_GROUP_SCENE_STEPS.ITEMS_ADD)
  public async itemsAddStep(@Ctx() ctx: Scenes.WizardContext, @Message('text') items: string): Promise<void> {
    if (!items) {
      const message = this.getMessage('create-item-group.invalid-items');
      await ctx.reply(message);
    } else {
      const itemGroup = await this.itemGroupService.findItemGroupByTitle(this.getItemGroupTitle(ctx));
      if (!itemGroup) throw new Error('Группы товаров не сущесвует');

      const itemLines = items.match(/[^\r\n]+/g);
      if (!itemLines) throw new ValidationException('Не правильный формат данных');

      const itemsDto: CreateItemDto[] = itemLines.map((itemLine: string) => {
        const [title, dataString] = itemLine.split('-').map((data: string) => data.trim());
        const data = dataString.split(/\s+/g);

        if (!data) throw new ValidationException('Не правильный формат данных');

        const [unitPrice, price, quantity] = data;

        return {
          title: title.trim(),
          unitPrice: Number(unitPrice.trim()),
          price: Number(price.trim()),
          imageId: null,
          itemGroupId: itemGroup.id,
          quantity: parseInt(quantity.trim(), 10),
        };
      });

      await this.itemService.createItems(itemsDto);

      const message = this.getMessage('create-item-group.items-added', {
        itemGroupTitle: itemGroup.title,
        itemsTitle: itemsDto.map((item: CreateItemDto) => item.title).join(', '),
      });
      await ctx.reply(message, { parse_mode: 'Markdown' });

      await ctx.scene.leave();
    }
  }

  @Action(new RegExp(`${CREATE_ITEM_GROUP_SCENE_ACTIONS.CREATE_ITEM_GROUP_CHANGE}`))
  public async initChangeAction(@Ctx() ctx: Scenes.WizardContext, @Next() next: () => Promise<void>) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.PENCIL}`, { parse_mode: 'Markdown' });

    await this.runStep(ctx, next, CREATE_ITEM_GROUP_SCENE_STEPS.TITLE_ENTER);
  }

  @Action(new RegExp(`${CREATE_ITEM_GROUP_SCENE_ACTIONS.CREATE_ITEM_GROUP_CONFIRM}`))
  public async initConfirmAction(@Ctx() ctx: Scenes.WizardContext, @CtxShop() shop: Shop) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.CHECK_MARK}`, { parse_mode: 'Markdown' });

    await this.itemGroupService.createItemGroup({ shopId: shop.id, title: this.getItemGroupTitle(ctx) });

    const message = this.getMessage('create-item-group.saved', { itemGroupTitle: this.getItemGroupTitle(ctx) });
    await ctx.reply(message, { parse_mode: 'Markdown' });

    const itemsAddExampleMsg = this.getMessage('create-item-group.items-add-example');
    await ctx.reply(itemsAddExampleMsg, { parse_mode: 'Markdown' });

    this.nextStep(ctx);
  }

  @Action(new RegExp(`${CREATE_ITEM_GROUP_SCENE_ACTIONS.CREATE_ITEM_GROUP_CANCEL}`))
  public async initCancelAction(@Ctx() ctx: Scenes.WizardContext) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.CROSS_MARK}`, { parse_mode: 'Markdown' });

    await this.leaveScene(ctx);
  }

  private getItemGroupTitle(ctx: Scenes.WizardContext) {
    return <string> this.getState(ctx)[this.ITEM_GROUP_TITLE_KEY];
  }

  private setItemGroupTitle(ctx: Scenes.WizardContext, feedback: string) {
    return this.setState(ctx, this.ITEM_GROUP_TITLE_KEY, feedback);
  }
}
