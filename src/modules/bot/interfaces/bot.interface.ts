import type { Context, Scenes } from 'telegraf';

import type { Chat } from '@/modules/chat/chat.interface';
import type { Shop } from '@/modules/shop/shop.interface';

export enum BotCommand {
  START = 'start',
  QUIT = 'quit',
  INIT = 'init',
  CREATE_ITEM_GROUP = 'createitemgroup',
  UPDATE_ITEM_QUANTITY = 'updateitemquantity',
  MAKE_PURCHASE = 'makepurchase',
  SCHEDULE = 'schedule',
  ASSIGNMENTS = 'assignments',
  NOTIFY_ASSIGNMENT = 'notifyassignment',
  REQUEST_VERIFY = 'requestverify',
  LEAVE_FEEDBACK = 'feedback',
  REQUEST_ADMIN = 'requestadmin',
  MAKE_ERROR_CHAT = 'makeerrorchat',
}

export enum BotAction {
  REGISTER = 'register',
}

export interface BotContext extends Context, Scenes.SceneContext {
  botChat: Chat;
  shop: Shop | null;
}

export interface BotContextWithShop extends BotContext {
  shop: Shop;
}
