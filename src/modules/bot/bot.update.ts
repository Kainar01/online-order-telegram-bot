import { UseFilters, UseGuards } from '@nestjs/common';
import { I18n, I18nService } from 'nestjs-i18n';
import { Update, InjectBot, On, Start, Command, Ctx, Action } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import type { Chat as TelegramCtxChat } from 'telegraf/typings/core/types/typegram';

import { TelegrafExceptionFilter } from '@/common/filters/telegram-exception.filter';
import { Logger } from '@/common/logger/logger';

import { Chat, ChatGroupType, ChatType, type TelegramChat } from '../chat/chat.interface';
import { ChatService } from '../chat/chat.service';
import type { Shop } from '../shop/shop.interface';
import { ShopService } from '../shop/shop.service';
import { MOODLE_BOT_ACTIONS, MOODLE_BOT_NAME, MOODLE_BOT_SCENES, TELEGRAM_EMOJIES } from './bot.constants';
import { CtxChat } from './decorators/chat.decorator';
import { CtxShop } from './decorators/shop.decorator';
import { BotNotAssignedGuard } from './guards/not-assigned.guard';
import { BotNotShopGuard } from './guards/not-shop.guard';
import { BotNotVerifiedGuard } from './guards/not-verified.guard';
import { BotShopGuard } from './guards/shop.guard';
import { BotVerifiedGuard } from './guards/verified.guard';
import { type BotContext, BotCommand } from './interfaces/bot.interface';

@Update()
@UseFilters(TelegrafExceptionFilter)
export class BotUpdate {
  constructor(
    @InjectBot(MOODLE_BOT_NAME)
    private readonly bot: Telegraf<BotContext>,
    private chatService: ChatService,
    private shopService: ShopService,
    @I18n() private i18n: I18nService,
    private logger: Logger,
  ) {
    this.useUserMiddleware();
    this.handleError();
  }

  @UseGuards(BotVerifiedGuard)
  @Start()
  public async onStart(@Ctx() ctx: BotContext, @CtxShop() shop?: Shop) {
    if (!shop) {
      const helloMessage = this.getMessage('bot.hello');
      await ctx.reply(`${helloMessage} ${TELEGRAM_EMOJIES.WINKING}`);

      const setUpCredsMsg = this.getMessage('bot.set-up-shop');
      await ctx.reply(`${setUpCredsMsg} ${TELEGRAM_EMOJIES.PLEASED}`);

      await ctx.scene.enter(MOODLE_BOT_SCENES.INIT);
    } else {
      const message = this.getMessage('bot.wish');
      await ctx.reply(`${message} ${TELEGRAM_EMOJIES.HALO}`);
    }
  }

  @UseGuards(BotVerifiedGuard)
  @UseGuards(BotNotShopGuard)
  @Command(BotCommand.INIT)
  public async onInitCommand(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.scene.enter(MOODLE_BOT_SCENES.INIT);
  }

  @UseGuards(BotVerifiedGuard)
  @UseGuards(BotShopGuard)
  @Command(BotCommand.CREATE_ITEM_GROUP)
  public async onCreateItemGroupCommand(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.scene.enter(MOODLE_BOT_SCENES.CREATE_ITEM_GROUP);
  }

  @UseGuards(BotVerifiedGuard)
  @UseGuards(BotShopGuard)
  @Command(BotCommand.UPDATE_ITEM_QUANTITY)
  public async onUpdateItemQuantityCommand(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.scene.enter(MOODLE_BOT_SCENES.UPDATE_ITEM_QUANTITY);
  }

  @UseGuards(BotVerifiedGuard)
  @UseGuards(BotShopGuard)
  @Command(BotCommand.MAKE_PURCHASE)
  public async onMakePurchaseCommand(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.scene.enter(MOODLE_BOT_SCENES.PURCHASE);
  }

  @UseGuards(BotNotAssignedGuard)
  @Command(BotCommand.REQUEST_ADMIN)
  public async onRequestAdminCommand(@Ctx() ctx: BotContext, @CtxChat() chat: Chat) {
    const superAdminChat = await this.chatService.findSuperAdminChat();

    if (superAdminChat) {
      const { telegramChatId: adminChatId } = superAdminChat;
      const message = this.getMessage('admin.incoming-request', { chatId: adminChatId, name: chat.name });

      await ctx.telegram.sendMessage(superAdminChat.telegramChatId, message, {
        reply_markup: {
          remove_keyboard: true,
          one_time_keyboard: true,
          inline_keyboard: [
            [
              {
                text: `Подтвердить${TELEGRAM_EMOJIES.CHECK_MARK}`,
                callback_data: `${MOODLE_BOT_ACTIONS.ADMIN_REQUEST_CONFIRM}${chat.id}`,
              },
            ],
            [
              {
                text: `Отклонить${TELEGRAM_EMOJIES.CROSS_MARK}`,
                callback_data: `${MOODLE_BOT_ACTIONS.ADMIN_REQUEST_DECLINE}${chat.id}`,
              },
            ],
          ],
        },
        parse_mode: 'Markdown',
      });
      const adminRequestMsg = this.getMessage('admin.requested-admin');

      await ctx.reply(`${adminRequestMsg} ${TELEGRAM_EMOJIES.FOLDED_HANDS}`);
    } else {
      const message = this.getMessage('admin.no-superadmin');
      throw new Error(message);
    }
  }

  @UseGuards(BotNotAssignedGuard)
  @Command(BotCommand.MAKE_ERROR_CHAT)
  public async onMakeErrorChatCommand(@Ctx() ctx: BotContext, @CtxChat() chat: Chat) {
    const superAdminChat = await this.chatService.findSuperAdminChat();

    if (superAdminChat) {
      const { telegramChatId: adminChatId } = superAdminChat;
      const message = this.getMessage('admin.error-chat.incoming-request', { chatId: adminChatId, name: chat.name });

      await ctx.telegram.sendMessage(adminChatId, message, {
        reply_markup: {
          remove_keyboard: true,
          one_time_keyboard: true,
          inline_keyboard: [
            [
              {
                text: `Подтвердить${TELEGRAM_EMOJIES.CHECK_MARK}`,
                callback_data: `${MOODLE_BOT_ACTIONS.ERROR_CHAT_REQUEST_CONFIRM}${chat.id}`,
              },
            ],
            [
              {
                text: `Отклонить${TELEGRAM_EMOJIES.CROSS_MARK}`,
                callback_data: `${MOODLE_BOT_ACTIONS.ERROR_CHAT_REQUEST_DECLINE}${chat.id}`,
              },
            ],
          ],
        },
        parse_mode: 'Markdown',
      });
      const adminRequestMsg = this.getMessage('admin.error-chat.requested');

      await ctx.reply(`${adminRequestMsg} ${TELEGRAM_EMOJIES.FOLDED_HANDS}`);
    } else {
      const message = this.getMessage('admin.no-superadmin');
      throw new Error(message);
    }
  }

  @UseGuards(BotNotVerifiedGuard)
  @Command(BotCommand.REQUEST_VERIFY)
  public async onRequestVerifyCommand(@Ctx() ctx: BotContext): Promise<string | void> {
    await ctx.scene.enter(MOODLE_BOT_SCENES.REQUEST_VERIFY);
  }

  @UseGuards(BotVerifiedGuard)
  @Command(BotCommand.LEAVE_FEEDBACK)
  public async onLeaveFeedbackCommand(@Ctx() ctx: BotContext): Promise<string | void> {
    await ctx.scene.enter(MOODLE_BOT_SCENES.FEEDBACK);
  }

  @Action(new RegExp(`${MOODLE_BOT_ACTIONS.ADMIN_REQUEST_CONFIRM}\\d`))
  public async onAdminRequestConfirmAction(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const actionData = this.getCallbackData(ctx);
    const requestChatId = Number(actionData.replace(MOODLE_BOT_ACTIONS.ADMIN_REQUEST_CONFIRM, ''));

    const requestChat = await this.chatService.findChatById(requestChatId);

    if (!requestChat) {
      throw new Error(`Чат не существует requestChatId=${requestChatId}`);
    }

    const oldAdminChat = await this.chatService.assignChatGroup(requestChat.id, ChatGroupType.ADMIN);

    if (oldAdminChat) {
      await this.alertUnassignOldChat(ctx, oldAdminChat, ChatGroupType.ADMIN);
    }

    const message = this.getMessage('admin.request-confirmed');

    await ctx.telegram.sendMessage(requestChat.telegramChatId, `${message} ${TELEGRAM_EMOJIES.HALO}`);
  }

  @Action(new RegExp(`${MOODLE_BOT_ACTIONS.ADMIN_REQUEST_DECLINE}\\d`))
  public async onAdminRequestDeclineAction(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const actionData = this.getCallbackData(ctx);
    const requestChatId = Number(actionData.replace(MOODLE_BOT_ACTIONS.ADMIN_REQUEST_DECLINE, ''));

    const requestChat = await this.chatService.findChatById(requestChatId);

    if (!requestChat) {
      throw new Error(`Чат не существует requestChatId=${requestChatId}`);
    }

    const message = this.getMessage('admin.request-declined');

    await ctx.telegram.sendMessage(requestChat.telegramChatId, `${message} ${TELEGRAM_EMOJIES.CONFUSED}`);
  }

  @Action(new RegExp(`${MOODLE_BOT_ACTIONS.ERROR_CHAT_REQUEST_CONFIRM}\\d`))
  public async onMakeErrorChatConfirmAction(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const actionData = this.getCallbackData(ctx);
    const requestChatId = Number(actionData.replace(MOODLE_BOT_ACTIONS.ERROR_CHAT_REQUEST_CONFIRM, ''));

    const requestChat = await this.chatService.findChatById(requestChatId);

    if (!requestChat) {
      throw new Error(`Чат не существует requestChatId=${requestChatId}`);
    }

    const oldErrorChat = await this.chatService.assignChatGroup(requestChat.id, ChatGroupType.ERROR);

    if (oldErrorChat) {
      await this.alertUnassignOldChat(ctx, oldErrorChat, ChatGroupType.ERROR);
    }

    await this.chatService.updateChat(requestChat.id, { chatGroupType: ChatGroupType.ERROR });

    const message = this.getMessage('admin.error-chat.request-confirmed');

    await ctx.telegram.sendMessage(requestChat.telegramChatId, `${message} ${TELEGRAM_EMOJIES.HALO}`);
  }

  @Action(new RegExp(`${MOODLE_BOT_ACTIONS.ERROR_CHAT_REQUEST_DECLINE}\\d`))
  public async onMakeErrorChatDeclineAction(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const actionData = this.getCallbackData(ctx);
    const requestChatId = Number(actionData.replace(MOODLE_BOT_ACTIONS.ERROR_CHAT_REQUEST_DECLINE, ''));

    const requestChat = await this.chatService.findChatById(requestChatId);

    if (!requestChat) {
      throw new Error(`Чат не существует requestChatId=${requestChatId}`);
    }

    const message = this.getMessage('admin.error-chat.request-declined');

    await ctx.telegram.sendMessage(requestChat.telegramChatId, `${message} ${TELEGRAM_EMOJIES.CONFUSED}`);
  }

  @Action(new RegExp(`${MOODLE_BOT_ACTIONS.VERIFICATION_REQUEST_CONFIRM}\\d`))
  public async onRequestConfirmAction(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const actionData = this.getCallbackData(ctx);
    const requestChatId = Number(actionData.replace(MOODLE_BOT_ACTIONS.VERIFICATION_REQUEST_CONFIRM, ''));

    const requestChat = await this.chatService.findChatById(requestChatId);

    if (!requestChat) {
      throw new Error(`Чат не существует requestChatId=${requestChatId}`);
    }

    await this.chatService.updateChat(requestChat.id, { verified: true });

    const message = this.getMessage('request-verify.request-accepted');

    await ctx.telegram.sendMessage(requestChat.telegramChatId, `${message} ${TELEGRAM_EMOJIES.HALO}`);
  }

  @Action(new RegExp(`${MOODLE_BOT_ACTIONS.VERIFICATION_REQUEST_DECLINE}\\d`))
  public async onRequestDeclineAction(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const actionData = this.getCallbackData(ctx);
    const requestChatId = Number(actionData.replace(MOODLE_BOT_ACTIONS.VERIFICATION_REQUEST_DECLINE, ''));

    const requestChat = await this.chatService.findChatById(requestChatId);

    if (!requestChat) {
      throw new Error(`Чат не существует requestChatId=${requestChatId}`);
    }

    const message = this.getMessage('request-verify.request-declined');

    await ctx.telegram.sendMessage(requestChat.telegramChatId, `${message} ${TELEGRAM_EMOJIES.CONFUSED}`);
  }

  @On('text')
  public onMessage(): string {
    const message = this.getMessage('bot.wish');
    return `${message} ${TELEGRAM_EMOJIES.HALO}`;
  }

  private async alertUnassignOldChat(
    ctx: BotContext,
    oldAssignedChat: Pick<Chat, 'name' | 'telegramChatId'>,
    assignedChatGroupType: ChatGroupType,
  ) {
    const superAdminChat = await this.chatService.findSuperAdminChat();

    if (!superAdminChat) {
      throw new Error('Нет суперадмина');
    }

    if (oldAssignedChat) {
      const { messageForSuperadmin, messageForOldAssignedChat } = this.getUnnassignedOldChatMessages(
        oldAssignedChat,
        assignedChatGroupType,
      );
      await ctx.telegram.sendMessage(superAdminChat.telegramChatId, `${messageForSuperadmin} ${TELEGRAM_EMOJIES.CROSS_MARK}`, {
        parse_mode: 'Markdown',
      });

      await ctx.telegram.sendMessage(oldAssignedChat.telegramChatId, messageForOldAssignedChat);
    }
  }

  private getUnnassignedOldChatMessages(oldAssignedChat: Pick<Chat, 'name' | 'telegramChatId'>, assignedChatGroupType: ChatGroupType) {
    const messageForSuperadmin = this.getMessage(
      assignedChatGroupType === ChatGroupType.ADMIN ? 'admin.old-admin-removed' : 'admin.error-chat.old-removed',
      { name: oldAssignedChat.name },
    );
    const messageForOldAssignedChat = this.getMessage(
      assignedChatGroupType === ChatGroupType.ADMIN ? 'admin.admin-unassigned' : 'admin.error-chat.unassigned',
    );

    return {
      messageForSuperadmin,
      messageForOldAssignedChat,
    };
  }

  private useUserMiddleware(): void {
    const chatMiddleware = async (ctx: BotContext, next: () => Promise<void>): Promise<void> => {
      try {
        const telegramChat = this.getTelegramChat(ctx);
        if (telegramChat) {
          const { type, id: telegramChatId, name } = telegramChat;

          let chat = await this.chatService.findChatByTelegramId(telegramChatId);

          if (!chat) {
            chat = await this.chatService.createChat({
              type: type === 'private' ? ChatType.PRIVATE : ChatType.GROUP,
              telegramChatId,
              chatGroupType: null,
              name,
            });
          } else {
            const nameChanged = name !== chat.name;
            if (nameChanged) {
              await this.chatService.updateChat(chat.id, { name });
            }
          }

          ctx.botChat = chat;

          ctx.shop = await this.shopService.findShopByChatId(chat.id);
        }
      } catch (err) {
        this.logger.error(err);
      } finally {
        await next();
      }
    };

    // this.bot.use(userMiddleware);
    this.bot.use(chatMiddleware);
  }

  private getTelegramChat(ctx: BotContext): TelegramChat | null {
    if (!ctx.chat) return null;

    const { chat } = ctx;

    const isPrivateChat = chat.type === 'private';

    if (isPrivateChat) {
      const telegramUserChat = <TelegramCtxChat.PrivateChat>ctx.chat;

      return {
        id: telegramUserChat.id,
        name: telegramUserChat.first_name,
        type: ChatType.PRIVATE,
      };
    }
    const telegramGroupChat = <TelegramCtxChat.GroupChat>ctx.chat;

    return {
      id: telegramGroupChat.id,
      name: telegramGroupChat.title,
      type: ChatType.GROUP,
    };
  }

  private handleError(): void {
    this.bot.catch((err: any) => this.logger.error(err));
  }

  private getMessage<T = string>(key: string, args?: Record<string, any>) {
    return this.i18n.translate<T>(key, { args });
  }

  private getCallbackData(ctx: BotContext) {
    return <string>ctx.callbackQuery!.data;
  }
}
