import { Processor ,WorkerHost } from "@nestjs/bullmq";
import { AuthPrismaService } from "apps/prisma/prisma.service";
import { Job } from "bullmq";
import { CREATED_USER_JOB, CREATED_USER_QUEUE, DELETED_USER_JOB, UPDATED_USER_JOB } from "libs/queue/constant";

interface UserDto { 
    userId: number,  
    email: string;
    phone?: string;
    password?: string;
    isDeleted?: boolean
}

class UserService {
    constructor(private readonly prisma: AuthPrismaService) {}

    async createUser(data: UserDto){
        // basic validation
        console.log("user data: ",data)
        if (!data?.email) {
            throw new Error("Missing required fields: email");
        }
        // create user via prisma
        return await this.prisma.user.create({ data });
    }

    async updateUser(userId: number, data: UserDto){
        return await this.prisma.user.update({
            where: {userId},
            data: data
        })
    }

    async deleteUser(userId: number){
        return await this.prisma.user.update({
            where: {userId},
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
                case UPDATED_USER_JOB: {
                    const data = job.data as UserDto;
                    if (!data.userId) {
                        throw new Error("Missing userId for update");
                    }
                    const updatedUser = await userService.updateUser(data.userId, job.data);
                    // remove sensitive fields before returning/logging
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { password, ...safeUser } = updatedUser as any;
                    return safeUser;
                }
                case DELETED_USER_JOB: {
                    const { userId } = job.data as UserDto;
                    if (!userId) {
                        throw new Error("Missing userId for deletion");
                    }
                    const deletedUser = await userService.deleteUser(userId);
                    // remove sensitive fields before returning/logging
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { password, ...safeUser } = deletedUser as any;
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
    