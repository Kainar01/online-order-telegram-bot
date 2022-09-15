export const UPDATE_ITEM_QUANTITY_SCENE_STEPS = {
  PICK_ITEM_GROUP: 1,
  PICK_ITEM: 2,
  ENTER_QUANTITY: 3,
  CONFIRM_QUANTITY: 4,
};

export const UPDATE_ITEM_QUANTITY_SCENE_ACTIONS = {
  ITEM_GROUP_PICK: 'item-group:pick:',
  ITEM_PICK: 'item:pick:',
  QUANTITY_CONFIRM: 'update-item-quantity:confirm',
  QUANTITY_CHANGE: 'update-item-quantity:change',
  FINISH: 'update-item-quantity:finish',
  ANOTHER: 'update-item-quantity:another',
};
