const Redis = require('ioredis');

async function fixRedis() {
  // Connect to localhost:6379 (default)
  const redis = new Redis({
    host: 'localhost',
    port: 6379,
    // Attempt to connect even if it fails initially
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  try {
    console.log('Connecting to Redis...');
    
    // Send REPLICAOF NO ONE to make it a master
    // For older Redis versions, SLAVEOF NO ONE is used, but REPLICAOF is the modern alias.
    // ioredis supports both via .call() or method if available.
    
    console.log('Sending REPLICAOF NO ONE...');
    try {
        await redis.replicaof('NO', 'ONE');
        console.log('Successfully executed REPLICAOF NO ONE');
    } catch (e) {
        console.log('REPLICAOF failed, trying SLAVEOF NO ONE...');
        await redis.slaveof('NO', 'ONE');
        console.log('Successfully executed SLAVEOF NO ONE');
    }

    console.log('Redis is now configured as a MASTER (writable).');

  } catch (error) {
    console.error('Error fixing Redis:', error);
  } finally {
    redis.disconnect();
  }
}

fixRedis();
