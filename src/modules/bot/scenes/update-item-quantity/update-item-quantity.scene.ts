import { UseFilters } from '@nestjs/common';
import _ from 'lodash';
import { I18n, I18nService } from 'nestjs-i18n';
import { Action, Ctx, Message, Next, Wizard, WizardStep } from 'nestjs-telegraf';
import type { Scenes } from 'telegraf';

import { TelegrafExceptionFilter } from '@/common/filters/telegram-exception.filter';
import type { ItemGroup } from '@/modules/item/interfaces/item-group.interface,';
import type { Item } from '@/modules/item/interfaces/item.interface';
import { ItemGroupService } from '@/modules/item/services/item-group.service';
import { ItemService } from '@/modules/item/services/item.service';
import type { Shop } from '@/modules/shop/shop.interface';

import { MOODLE_BOT_SCENES, TELEGRAM_EMOJIES } from '../../bot.constants';
import { CtxShop } from '../../decorators/shop.decorator';
import { BaseScene } from '../base/base.scene';
import { UPDATE_ITEM_QUANTITY_SCENE_ACTIONS, UPDATE_ITEM_QUANTITY_SCENE_STEPS } from './update-item-quantity.constants';

@Wizard(MOODLE_BOT_SCENES.UPDATE_ITEM_QUANTITY)
@UseFilters(TelegrafExceptionFilter)
export class UpdateItemQuantityScene extends BaseScene {
  private ITEM_GROUP_ID_KEY: string = 'item-group-id';
  private ITEM_ID_KEY: string = 'item-id';
  private QUANTITY_KEY: string = 'item-quantity';

  constructor(@I18n() i18n: I18nService, private itemGroupService: ItemGroupService, private itemService: ItemService) {
    super(i18n);
  }

  @WizardStep(UPDATE_ITEM_QUANTITY_SCENE_STEPS.PICK_ITEM_GROUP)
  public async pickItemGroupStep(@Ctx() ctx: Scenes.WizardContext, @CtxShop() shop: Shop): Promise<void> {
    const itemGroups = await this.itemGroupService.getItemGroups(shop.id);

    const message = this.getMessage('update-item-quantity.pick-item-group');

    const itemGroupKeyboard = itemGroups.map((itemGroup: ItemGroup) => ({
      text: itemGroup.title,
      callback_data: `${UPDATE_ITEM_QUANTITY_SCENE_ACTIONS.ITEM_GROUP_PICK}${itemGroup.id}`,
    }));

    const chunkedInlineKeyboard = _.chunk(itemGroupKeyboard, 2);
    chunkedInlineKeyboard.push([{ text: this.commonMessages['finish'], callback_data: UPDATE_ITEM_QUANTITY_SCENE_ACTIONS.FINISH }]);

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        remove_keyboard: true,
        one_time_keyboard: true,
        inline_keyboard: chunkedInlineKeyboard,
      },
    });
  }

  @WizardStep(UPDATE_ITEM_QUANTITY_SCENE_STEPS.PICK_ITEM)
  public async pickItemStep(@Ctx() ctx: Scenes.WizardContext): Promise<void> {
    const itemGroups = await this.itemService.findItemsByItemGroupId(this.getItemGroupId(ctx));

    const message = this.getMessage('update-item-quantity.pick-item');

    const itemsKeyboard = itemGroups.map((item: Item) => ({
      text: item.title,
      callback_data: `${UPDATE_ITEM_QUANTITY_SCENE_ACTIONS.ITEM_PICK}${item.id}`,
    }));

    const chunkedInlineKeyboard = _.chunk(itemsKeyboard, 2);

    chunkedInlineKeyboard.push([{ text: this.commonMessages['finish'], callback_data: UPDATE_ITEM_QUANTITY_SCENE_ACTIONS.FINISH }]);
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        remove_keyboard: true,
        one_time_keyboard: true,
        inline_keyboard: chunkedInlineKeyboard,
      },
    });
  }

  @WizardStep(UPDATE_ITEM_QUANTITY_SCENE_STEPS.ENTER_QUANTITY)
  public async enterQuantityStep(@Ctx() ctx: Scenes.WizardContext): Promise<void> {
    const message = this.getMessage('update-item-quantity.enter-quantity');
    await ctx.reply(message, { parse_mode: 'Markdown' });
    this.nextStep(ctx);
  }

  @WizardStep(UPDATE_ITEM_QUANTITY_SCENE_STEPS.CONFIRM_QUANTITY)
  public async confirmQuantityStep(@Ctx() ctx: Scenes.WizardContext, @Message('text') quantityStr: string): Promise<void> {
    const addQuantity = parseInt(quantityStr, 10);
    if (_.isNaN(addQuantity)) {
      const message = this.getMessage('update-item-quantity.invalid-quantity');
      await ctx.reply(message, { parse_mode: 'Markdown' });
    } else {
      const item = await this.itemService.findItemById(this.getItemId(ctx));
      if (!item) throw new Error('Товар не существует');

      this.setItemQuantity(ctx, addQuantity);

      const itemQuantity = Number(item.quantity);

      const message = this.getMessage('update-item-quantity.confirm-quantity', {
        oldQuantity: itemQuantity,
        addQuantity,
        total: itemQuantity + addQuantity,
      });
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          remove_keyboard: true,
          one_time_keyboard: true,
          inline_keyboard: [
            [{ text: this.commonMessages['yes'], callback_data: UPDATE_ITEM_QUANTITY_SCENE_ACTIONS.QUANTITY_CONFIRM }],
            [{ text: this.commonMessages['edit'], callback_data: UPDATE_ITEM_QUANTITY_SCENE_ACTIONS.QUANTITY_CHANGE }],
            [{ text: this.commonMessages['cancel'], callback_data: UPDATE_ITEM_QUANTITY_SCENE_ACTIONS.FINISH }],
          ],
        },
      });
    }
  }

  @Action(new RegExp(`${UPDATE_ITEM_QUANTITY_SCENE_ACTIONS.ITEM_GROUP_PICK}\\d`))
  public async onPickItemGroupAction(@Ctx() ctx: Scenes.WizardContext, @Next() next: () => Promise<void>): Promise<void> {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const itemGroupId = Number(this.getCallbackPayload(ctx, UPDATE_ITEM_QUANTITY_SCENE_ACTIONS.ITEM_GROUP_PICK));

    this.setItemGroupId(ctx, itemGroupId);

    await this.runStep(ctx, next, UPDATE_ITEM_QUANTITY_SCENE_STEPS.PICK_ITEM);
  }

  @Action(new RegExp(`${UPDATE_ITEM_QUANTITY_SCENE_ACTIONS.ITEM_PICK}\\d`))
  public async onPickItemAction(@Ctx() ctx: Scenes.WizardContext, @Next() next: () => Promise<void>): Promise<void> {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const itemId = Number(this.getCallbackPayload(ctx, UPDATE_ITEM_QUANTITY_SCENE_ACTIONS.ITEM_PICK));

    this.setItemId(ctx, itemId);

    await this.runStep(ctx, next, UPDATE_ITEM_QUANTITY_SCENE_STEPS.ENTER_QUANTITY);
  }

  @Action(new RegExp(`${UPDATE_ITEM_QUANTITY_SCENE_ACTIONS.QUANTITY_CHANGE}`))
  public async quantityChangeAction(@Ctx() ctx: Scenes.WizardContext, @Next() next: () => Promise<void>) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.PENCIL}`, { parse_mode: 'Markdown' });

    await this.runStep(ctx, next, UPDATE_ITEM_QUANTITY_SCENE_STEPS.ENTER_QUANTITY);
  }

  @Action(new RegExp(`${UPDATE_ITEM_QUANTITY_SCENE_ACTIONS.QUANTITY_CONFIRM}`))
  public async initConfirmAction(@Ctx() ctx: Scenes.WizardContext) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.CHECK_MARK}`, { parse_mode: 'Markdown' });

    await this.itemService.addItemQuantity(this.getItemId(ctx), this.getItemQuantity(ctx));

    const message = this.getMessage('update-item-quantity.updated-quantity', { addQuantity: this.getItemQuantity(ctx) });
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        remove_keyboard: true,
        one_time_keyboard: true,
        inline_keyboard: [
          [{ text: this.commonMessages['yes'], callback_data: UPDATE_ITEM_QUANTITY_SCENE_ACTIONS.ANOTHER }],
          [{ text: this.commonMessages['finish'], callback_data: UPDATE_ITEM_QUANTITY_SCENE_ACTIONS.FINISH }],
        ],
      },
    });
  }

  @Action(new RegExp(`${UPDATE_ITEM_QUANTITY_SCENE_ACTIONS.ANOTHER}`))
  public async anotherItemAction(@Ctx() ctx: Scenes.WizardContext, @Next() next: () => Promise<void>) {
    await this.runStep(ctx, next, UPDATE_ITEM_QUANTITY_SCENE_STEPS.PICK_ITEM_GROUP);
  }

  @Action(new RegExp(`${UPDATE_ITEM_QUANTITY_SCENE_ACTIONS.FINISH}`))
  public async initFinishAction(@Ctx() ctx: Scenes.WizardContext) {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    await this.leaveScene(ctx);
  }

  private getItemGroupId(ctx: Scenes.WizardContext) {
    return <number> this.getState(ctx)[this.ITEM_GROUP_ID_KEY];
  }

  private setItemGroupId(ctx: Scenes.WizardContext, itemGroupId: number) {
    return this.setState(ctx, this.ITEM_GROUP_ID_KEY, itemGroupId);
  }

  private getItemId(ctx: Scenes.WizardContext) {
    return <number> this.getState(ctx)[this.ITEM_ID_KEY];
  }

  private setItemId(ctx: Scenes.WizardContext, itemId: number) {
    return this.setState(ctx, this.ITEM_ID_KEY, itemId);
  }

  private getItemQuantity(ctx: Scenes.WizardContext) {
    return <number> this.getState(ctx)[this.QUANTITY_KEY];
  }

  private setItemQuantity(ctx: Scenes.WizardContext, itemId: number) {
    return this.setState(ctx, this.QUANTITY_KEY, itemId);
  }
}
