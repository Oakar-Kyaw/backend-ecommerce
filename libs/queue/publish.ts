import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, JobsOptions } from 'bullmq';
import {
  CREATED_AUTH_SERVICE_QUEUE,
  CREATED_CHAT_SERVICE_QUEUE,
  CREATED_NOTIFICATION_SERVICE_QUEUE,
  CREATED_ORDER_SERVICE_QUEUE,
  CREATED_PAYMENT_SERVICE_QUEUE,
  CREATED_PRODUCT_SERVICE_QUEUE,
  CREATED_USER_SERVICE_QUEUE,
} from './constant';

@Injectable()
export class PublishMessage {
  private queues: Map<string, Queue> = new Map();

  constructor(
    @InjectQueue(CREATED_USER_SERVICE_QUEUE) private readonly userQueue: Queue,
    @InjectQueue(CREATED_NOTIFICATION_SERVICE_QUEUE)
    private readonly notificationQueue: Queue,
    @InjectQueue(CREATED_AUTH_SERVICE_QUEUE) private readonly authQueue: Queue,
    @InjectQueue(CREATED_ORDER_SERVICE_QUEUE)
    private readonly orderQueue: Queue,
    @InjectQueue(CREATED_PRODUCT_SERVICE_QUEUE)
    private readonly productQueue: Queue,
    @InjectQueue(CREATED_PAYMENT_SERVICE_QUEUE)
    private readonly paymentQueue: Queue,
    @InjectQueue(CREATED_CHAT_SERVICE_QUEUE) private readonly chatQueue: Queue,
  ) {
    // Register queues
    this.queues.set(CREATED_USER_SERVICE_QUEUE, this.userQueue);
    this.queues.set(CREATED_NOTIFICATION_SERVICE_QUEUE, this.notificationQueue);
    this.queues.set(CREATED_AUTH_SERVICE_QUEUE, this.authQueue);
    this.queues.set(CREATED_ORDER_SERVICE_QUEUE, this.orderQueue);
    this.queues.set(CREATED_PRODUCT_SERVICE_QUEUE, this.productQueue);
    this.queues.set(CREATED_PAYMENT_SERVICE_QUEUE, this.paymentQueue);
    this.queues.set(CREATED_CHAT_SERVICE_QUEUE, this.chatQueue);
  }

  /**
   * Publish a job to a specific queue
   * @param queueName - Name of the queue
   * @param jobName - Name of the job
   * @param data - Payload of the job
   * @param opts - Optional job options (retries, backoff, etc.)
   */
  async publish<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    opts: JobsOptions = {
      priority: 1,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: true,
    },
  ): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.add(jobName, data, opts);
  }
}
