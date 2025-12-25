import { redis } from './redis.client';

export abstract class RedisConsumer {
  protected isRunning = true;

  constructor(
    protected readonly streamKey: string,   // e.g. user_events
    protected readonly groupName: string,   // e.g. auth_group
    protected readonly consumerName: string // e.g. auth_1
  ) {}

  async start() {
    // 1️⃣ Create consumer group if not exists
    try {
      await redis.call(
        'XGROUP',
        'CREATE',
        this.streamKey,
        this.groupName,
        '0',
        'MKSTREAM',
      );
    } catch (err: any) {
      if (!err.message.includes('BUSYGROUP')) throw err;
    }

    // 2️⃣ Infinite loop to consume messages
    while (this.isRunning) {
      const result = await redis.call(
        'XREADGROUP',
        'GROUP',
        this.groupName,
        this.consumerName,
        'COUNT',
        '10',
        'BLOCK',
        '5000',
        'STREAMS',
        this.streamKey,
        '>',
      ) as any;

      if (!result) continue;

      for (const [, messages] of result) {
        for (const [id, rawFields] of messages) {
          const data = this.parse(rawFields);

          try {
            await this.handle(data);
            await redis.call('XACK', this.streamKey, this.groupName, id);
          } catch (err) {
            console.error('❌ Failed message', data, err);
          }
        }
      }
    }
  }

  stop() {
    this.isRunning = false;
  }

  private parse(fields: string[]) {
    const obj: any = {};
    for (let i = 0; i < fields.length; i += 2) {
      obj[fields[i]] = JSON.parse(fields[i + 1]);
    }
    return obj;
  }

  abstract handle(data: any): Promise<void>;
}
