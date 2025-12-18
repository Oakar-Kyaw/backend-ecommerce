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

export const CREATED_PRODUCT_SERVICE_QUEUE = 'product';
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
];
