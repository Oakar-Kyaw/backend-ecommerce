import { Processor ,WorkerHost } from "@nestjs/bullmq";
import { AuthPrismaService } from "apps/prisma/prisma.service";
import { Job } from "bullmq";
import { CREATED_USER_JOB, CREATED_USER_QUEUE } from "libs/queue/constant";

interface UserDto { 
    userId: number,  
    email: string;
    phone: string;
    password: string;
    isDeleted?: boolean
}

class UserService {
    constructor(private readonly prisma: AuthPrismaService) {}

    async createUser(data: UserDto){
        // basic validation
        if (!data?.email || !data?.phone || !data?.password) {
            throw new Error("Missing required fields: email, phone and password");
        }
        // create user via prisma
        return await this.prisma.user.create({ data });
    }

    async updateUser(id: number, data: UserDto){
        return await this.prisma.user.update({
            where: {id},
            data: data
        })
    }

    async deleteUser(id: number){
        return await this.prisma.user.update({
            where: {id},
            data: { isDeleted: true }
        })
    }
}

@Processor(CREATED_USER_QUEUE)
export class AuthWorker extends WorkerHost {
    constructor(private readonly prisma: AuthPrismaService) {
        super();
    }

    async process(job: Job): Promise<any> {
        const userService = new UserService(this.prisma);

        try {
            console.log("Processing job:", job.name, job.data);
            switch (job.name) {    
                case CREATED_USER_JOB: {
                    const payload = job.data as UserDto;
                    const createdUser = await userService.createUser(payload);
                    // remove sensitive fields before returning/logging
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { password, ...safeUser } = createdUser as any;
                    return safeUser;
                }

                default:
                    throw new Error(`Unknown job name: ${job.name}`);
            }
        } catch (err) {
            // bubble up the error so BullMQ can handle retries/failures
            console.error(`AuthWorker failed on job ${job.id} (${job.name}):`, err);
            throw err;
        }
    }
}       
    