import { redis } from './redis.client';

export async function publishEvent(
  streamKey: string,
  payload: Record<string, any>,
) {
  const fields: string[] = [];

  for (const [key, value] of Object.entries(payload)) {
    fields.push(key, JSON.stringify(value));
  }

  await redis.call('XADD', streamKey, '*', ...fields);
}
