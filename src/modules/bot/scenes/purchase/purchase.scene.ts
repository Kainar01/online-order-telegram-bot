import { UseFilters } from '@nestjs/common';
import _ from 'lodash';
import { I18n, I18nService } from 'nestjs-i18n';
import { Action, Ctx, Next, Wizard, WizardStep } from 'nestjs-telegraf';
import type { Scenes } from 'telegraf';
import type { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

import { TelegrafExceptionFilter } from '@/common/filters/telegram-exception.filter';
import { normalizeNumber } from '@/common/utils/number';
import type { ItemGroup } from '@/modules/item/interfaces/item-group.interface,';
import type { Item } from '@/modules/item/interfaces/item.interface';
import { ItemGroupService } from '@/modules/item/services/item-group.service';
import { ItemService } from '@/modules/item/services/item.service';
import { PurchaseService } from '@/modules/purchase/services/purchase.service';
import type { Shop } from '@/modules/shop/shop.interface';

import { MOODLE_BOT_SCENES, TELEGRAM_EMOJIES } from '../../bot.constants';
import { CtxShop } from '../../decorators/shop.decorator';
import { BaseScene } from '../base/base.scene';
import { PURCHASE_SCENE_ACTIONS, PURCHASE_SCENE_STEPS } from './purchase.constants';

@Wizard(MOODLE_BOT_SCENES.PURCHASE)
@UseFilters(TelegrafExceptionFilter)
export class PurchaseScene extends BaseScene {
  private ITEM_GROUP_ID_KEY: string = 'item-group-id';
  private PURCHASE_ITEMS_KEYS: string = 'purchase-items';

  constructor(
  @I18n() i18n: I18nService,
    private itemGroupService: ItemGroupService,
    private itemService: ItemService,
    private purchaseService: PurchaseService,
  ) {
    super(i18n);
  }

  private get commonKeyboardOptions() {
    return {
      back: {
        text: `${TELEGRAM_EMOJIES.BACK_ARROW} ${this.commonMessages['back']}`,
        callback_data: PURCHASE_SCENE_ACTIONS.ITEM_GROUP_PICK_RETURN,
      },
      cancel: {
        text: `${this.commonMessages['cancel']} ${TELEGRAM_EMOJIES.CROSS_MARK}`,
        callback_data: PURCHASE_SCENE_ACTIONS.PURCHASE_CANCEL,
      },
      edit: {
        text: `${this.commonMessages['edit']} ${TELEGRAM_EMOJIES.EDIT}`,
        callback_data: PURCHASE_SCENE_ACTIONS.PURCHASE_EDIT,
      },
      ask_confirm: {
        text: `${this.commonMessages['finish']} ${TELEGRAM_EMOJIES.CHECK_MARK}`,
        callback_data: PURCHASE_SCENE_ACTIONS.PURCHASE_ASK_CONFIRM,
      },
      confirm: {
        text: `${this.commonMessages['confirm']} ${TELEGRAM_EMOJIES.CHECK_MARK}`,
        callback_data: PURCHASE_SCENE_ACTIONS.PURCHASE_CONFIRM,
      },
    };
  }

  @WizardStep(PURCHASE_SCENE_STEPS.PICK_ITEM_GROUP)
  public async pickItemGroupStep(@Ctx() ctx: Scenes.WizardContext, @CtxShop() shop: Shop): Promise<void> {
    const message = this.getMessage('purchase.pick-items');

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: await this.getPickItemMenu(ctx, shop),
      },
    });
  }

  @Action(new RegExp(`${PURCHASE_SCENE_ACTIONS.ITEM_GROUP_PICK}\\d`))
  public async onPickItemGroupAction(@Ctx() ctx: Scenes.WizardContext, @CtxShop() shop: Shop): Promise<void> {
    const itemGroupId = Number(this.getCallbackPayload(ctx, PURCHASE_SCENE_ACTIONS.ITEM_GROUP_PICK));

    this.setItemGroupId(ctx, itemGroupId);

    await ctx.editMessageReplyMarkup({ inline_keyboard: await this.getPickItemMenu(ctx, shop) });
    await ctx.answerCbQuery();
  }

  @Action(new RegExp(`${PURCHASE_SCENE_ACTIONS.ITEM_PICK}\\d`))
  public async onPickItemAction(@Ctx() ctx: Scenes.WizardContext, @CtxShop() shop: Shop): Promise<void> {
    const itemId = Number(this.getCallbackPayload(ctx, PURCHASE_SCENE_ACTIONS.ITEM_PICK));

    const item = await this.itemService.findItemById(itemId);

    if (!item) throw new Error('Товар не существует');

    this.togglePurchaseItem(ctx, item.itemGroupId, item.id);

    await ctx.editMessageReplyMarkup({ inline_keyboard: await this.getPickItemMenu(ctx, shop) });
    await ctx.answerCbQuery();
  }

  @Action(new RegExp(`${PURCHASE_SCENE_ACTIONS.ITEM_GROUP_PICK_RETURN}`))
  public async itemGroupPickReturnAction(@Ctx() ctx: Scenes.WizardContext, @CtxShop() shop: Shop) {
    this.setItemGroupId(ctx, undefined);

    await ctx.editMessageReplyMarkup({ inline_keyboard: await this.getPickItemMenu(ctx, shop) });
    await ctx.answerCbQuery();
  }

  @Action(new RegExp(`${PURCHASE_SCENE_ACTIONS.PURCHASE_EDIT}`))
  public async purchaseEditAction(@Ctx() ctx: Scenes.WizardContext, @Next() next: () => Promise<void>) {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await this.runStep(ctx, next, PURCHASE_SCENE_STEPS.PICK_ITEM_GROUP);
  }

  @Action(new RegExp(`${PURCHASE_SCENE_ACTIONS.PURCHASE_ASK_CONFIRM}`))
  public async purchaseAskConfirmAction(@Ctx() ctx: Scenes.WizardContext) {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    const itemIds = _.flatten(_.values(this.getPurchaseItems(ctx)));
    const items = await this.itemService.findItemsByIds(itemIds);

    const total = items.reduce((totalPrice: number, item: Item) => totalPrice + normalizeNumber(item.price), 0);

    const itemsMessage = items.map((item: Item) => this.formatItemMessage(item)).join('\n');
    const confirmMsg = this.getMessage('purchase.ask-confirm', { items: itemsMessage, total });

    await ctx.reply(confirmMsg, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [_.values(_.pick(this.commonKeyboardOptions, 'confirm', 'edit', 'cancel'))],
      },
    });
  }

  @Action(new RegExp(`${PURCHASE_SCENE_ACTIONS.PURCHASE_CONFIRM}`))
  public async purchaseConfirmAction(@Ctx() ctx: Scenes.WizardContext, @CtxShop() shop: Shop) {
    const itemIds = _.flatten(_.values(this.getPurchaseItems(ctx)));
    const items = await this.itemService.findItemsByIds(itemIds);

    const total = items.reduce((totalPrice: number, item: Item) => totalPrice + normalizeNumber(item.price), 0);

    await this.purchaseService.makePurchase(shop.id, {
      items: itemIds.map((id: number) => ({ id, quantity: 1 })),
      total,
      discountId: null,
    });

    const confirmMsg = this.getMessage('purchase.confirm');
    await ctx.reply(confirmMsg, {
      parse_mode: 'Markdown',
    });
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  }

  @Action(new RegExp(`${PURCHASE_SCENE_ACTIONS.PURCHASE_CANCEL}`))
  public async purchaseCancelAction(@Ctx() ctx: Scenes.WizardContext) {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    await this.leaveScene(ctx);
  }

  private formatItemMessage(item: Item) {
    return `*${item.title}* - ${item.price}тг`;
  }

  private async getPickItemMenu(ctx: Scenes.WizardContext, shop: Shop): Promise<InlineKeyboardButton[][]> {
    const itemGroupId = this.getItemGroupId(ctx);

    if (!itemGroupId) {
      const itemGroups = await this.itemGroupService.getItemGroups(shop.id);
      const itemGroupsKeyboard = itemGroups.map((itemGroup: ItemGroup) => ({
        text: this.getItemGroupOptionText(ctx, itemGroup),
        callback_data: `${PURCHASE_SCENE_ACTIONS.ITEM_GROUP_PICK}${itemGroup.id}`,
      }));
      const options = [this.commonKeyboardOptions.cancel, this.commonKeyboardOptions.ask_confirm];

      return [..._.chunk(itemGroupsKeyboard, 2), options];
    }
    const items = await this.itemService.findItemsByItemGroupId(itemGroupId);

    const itemsKeyboard = items.map((item: Item) => ({
      text: this.getItemOptionText(ctx, item),
      callback_data: `${PURCHASE_SCENE_ACTIONS.ITEM_PICK}${item.id}`,
    }));

    const options = [this.commonKeyboardOptions.back, this.commonKeyboardOptions.ask_confirm];
    return [..._.chunk(itemsKeyboard, 2), options];
  }

  private getItemOptionText(ctx: Scenes.WizardContext, item: Item) {
    const isPicked = this.checkItemPicked(ctx, item.itemGroupId, item.id);
    const messageEmoji = isPicked ? TELEGRAM_EMOJIES.BLUE_SQUARE : '';
    return `${item.title}-${item.price}тг ${messageEmoji}`;
  }

  private getItemGroupOptionText(ctx: Scenes.WizardContext, itemGroup: ItemGroup) {
    const purchaseItems = this.getPurchaseItems(ctx)[itemGroup.id];
    if (_.isEmpty(purchaseItems)) return itemGroup.title;

    return `${itemGroup.title} - ${purchaseItems.length}`;
  }

  private getItemGroupId(ctx: Scenes.WizardContext) {
    return <number> this.getState(ctx)[this.ITEM_GROUP_ID_KEY];
  }

  private setItemGroupId(ctx: Scenes.WizardContext, itemGroupId: number | undefined) {
    return this.setState(ctx, this.ITEM_GROUP_ID_KEY, itemGroupId);
  }

  private getPurchaseItems(ctx: Scenes.WizardContext): Record<number, number[]> {
    return <Record<number, number[]>>(this.getState(ctx)[this.PURCHASE_ITEMS_KEYS] || {});
  }

  private setPurchaseItems(ctx: Scenes.WizardContext, items: Record<number, number[]>) {
    return this.setState(ctx, this.PURCHASE_ITEMS_KEYS, items);
  }

  private togglePurchaseItem(ctx: Scenes.WizardContext, itemGroupId: number, itemId: number) {
    const purchaseItems = this.getPurchaseItems(ctx);
    const itemGroupItems = purchaseItems[itemGroupId] || [];

    let newItemGroupItems;

    if (itemGroupItems.includes(itemId)) {
      newItemGroupItems = itemGroupItems.filter((item: number) => item !== itemId);
    } else {
      newItemGroupItems = [...itemGroupItems, itemId];
    }

    return this.setPurchaseItems(ctx, { ...purchaseItems, [itemGroupId]: newItemGroupItems });
  }

  private checkItemPicked(ctx: Scenes.WizardContext, itemGroupId: number, itemId: number) {
    const purchaseItems = this.getPurchaseItems(ctx);
    const itemGroupItems = purchaseItems[itemGroupId] || [];
    return itemGroupItems.includes(itemId);
  }
}
