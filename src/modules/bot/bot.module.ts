import { Module } from '@nestjs/common';

import { ChatModule } from '../chat/chat.module';
import { FeedbackModule } from '../feedback/feedback.module';
import { ItemModule } from '../item/item.module';
import { PurchaseModule } from '../purchase/purchase.module';
import { ShopModule } from '../shop/shop.module';
import { BotUpdate } from './bot.update';
import { CreateItemGroupScene } from './scenes/create-item-group/create-item-group.scene';
import { FeedbackScene } from './scenes/feedback/feedback.scene';
import { InitScene } from './scenes/init/init.scene';
import { PurchaseScene } from './scenes/purchase/purchase.scene';
import { RequestVerifyScene } from './scenes/request-verify/request-verify.scene';
import { UpdateItemQuantityScene } from './scenes/update-item-quantity/update-item-quantity.scene';
import { MoodleBotService } from './services/moodle-bot.service';

@Module({
  imports: [ChatModule, FeedbackModule, ShopModule, ItemModule, PurchaseModule],
  providers: [
    BotUpdate,
    RequestVerifyScene,
    FeedbackScene,
    InitScene,
    CreateItemGroupScene,
    UpdateItemQuantityScene,
    PurchaseScene,
    MoodleBotService,
  ],
  exports: [MoodleBotService],
})
export class BotModule {}
