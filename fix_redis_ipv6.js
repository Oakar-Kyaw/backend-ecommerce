const Redis = require('ioredis');

async function fixRedis() {
  // Connect to ::1 (IPv6 localhost)
  const redis = new Redis({
    host: '::1',
    port: 6379,
    family: 6, // Force IPv6
    // Attempt to connect even if it fails initially
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  try {
    console.log('Connecting to Redis at ::1...');
    
    // Send REPLICAOF NO ONE to make it a master
    
    console.log('Sending REPLICAOF NO ONE...');
    try {
        await redis.replicaof('NO', 'ONE');
        console.log('Successfully executed REPLICAOF NO ONE');
    } catch (e) {
        console.log('REPLICAOF failed, trying SLAVEOF NO ONE...');
        try {
            await redis.slaveof('NO', 'ONE');
            console.log('Successfully executed SLAVEOF NO ONE');
        } catch (e2) {
             console.error('Failed to execute SLAVEOF NO ONE', e2);
        }
    }

    // Check role
    const info = await redis.info('replication');
    console.log('Replication Info:', info);

  } catch (error) {
    console.error('Error fixing Redis:', error);
  } finally {
    redis.disconnect();
  }
}

fixRedis();
