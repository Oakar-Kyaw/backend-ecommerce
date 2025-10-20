import { InjectQueue }  from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CREATED_USER_QUEUE } from './constant';

export class PublishMessage {
    private queues: Map<string, Queue> = new Map();

    constructor(@InjectQueue(CREATED_USER_QUEUE) private readonly queue: Queue){
        // Register your queues
        this.queues.set(CREATED_USER_QUEUE, queue);
    }
    publish(
     queueName: string,
     jobName: string,
     data, 
     opt = {
       attempts: 10,
       backoff: { type: 'exponential', delay: 2000 },
       removeOnComplete: true,
    }
 ){ 
        const queue = this.queues.get(queueName); 
        if (!queue) throw new Error(`Queue ${queueName} not found`);
        
        return queue.add(jobName, { ...data }, opt);
    }
}