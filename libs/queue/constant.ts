export const CREATED_USER_SERVICE_QUEUE = 'user';
export const CREATED_USER_JOB = 'create_user';
export const UPDATED_USER_JOB = 'update_user';
export const DELETED_USER_JOB = 'delete_user';

export const CREATED_BRAND_QUEUE = 'brand_queue';
export const CREATED_BRAND = 'create_brand';
export const UPDATED_BRAND = 'update_brand';
export const DELETE_BRAND = 'delete_brand';

export const CREATED_AUTH_SERVICE_QUEUE = 'auth';

export const CREATED_ORDER_SERVICE_QUEUE = 'order';
export const SEND_ORDER_NOTIFICATION = 'send_order_notification';
export const SEND_BRAND_STATUS_UPDATE_NOTIFICATION =
  'notify_brand_status_update';

export const CREATED_PRODUCT_SERVICE_QUEUE = 'product';
export const CREATED_PRODUCT = 'create_product';
export const UPDATED_PRODUCT = 'update_product';
export const DELETE_PRODUCT = 'delete_product';

export const CREATED_PAYMENT_SERVICE_QUEUE = 'payment';
export const SEND_PAYMENT_NOTIFICATION = 'send_payment_notification';

export const CREATED_CHAT_SERVICE_QUEUE = 'chat';

export const CREATED_NOTIFICATION_SERVICE_QUEUE = 'notification';

export const SEND_EMAIL = 'send_email';

export const QueueServices: string[] = [
  'user',
  'order',
  'payment',
  'notification',
  'auth',
  "product"
];

export const STREAM_KEYS = {
  USER_EVENTS: 'USER_EVENTS_STREAM',
  BRAND_EVENTS: 'BRAND_EVENTS_STREAM',
};


export const EVENTS = {
  USER_EVENT: "user_event",
  BRAND_EVENT: "brand_event",
  NOTI_EVENT: "noti_event",
  PRODUCT_EVENT: "product.event",
}

export const TYPES = {
  CREATED_USER : 'create_user',
  UPDATED_USER : 'update_user',
  DELETED_USER : 'delete_user',
  CREATED_BRAND : 'create_brand',
  UPDATED_BRAND : 'update_brand',
  DELETED_BRAND : 'delete_brand',
  CREATED_PRODUCT : 'create_product',
  UPDATED_PRODUCT : 'update_product',
  DELETED_PRODUCT : 'delete_product',
  SEND_EMAIL : 'send_email',
  SEND_ORDER_NOTIFICATION: 'send_order_notification',
  SEND_PAYMENT_NOTIFICATION: 'send_payment_notification',
  SEND_BRAND_STATUS_UPDATE_NOTIFICATION: "send_brand_status_update_notification"
}

export const GROUPS = {
  USER_GROUP: "user_event",
  BRAND_EVENT: "brand_event",
  NOTI_EVENT: "noti_event",
  PRODUCT_EVENT: "product.event",
}