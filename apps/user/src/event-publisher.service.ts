import { Injectable } from "@nestjs/common";
import { CREATED_USER_JOB, CREATED_USER_QUEUE, UPDATED_USER_JOB } from "libs/queue/constant";
import { PublishMessage } from "libs/queue/publish";

@Injectable()
export class EventPublisherService {
  constructor(private readonly publishMessage: PublishMessage) {}

  userCreated(user) {
    this.publishMessage.publish(CREATED_USER_QUEUE, CREATED_USER_JOB, {
      userId: user.id,
      email: user.email,
      phone: user.phone ?? null,
      password: user.password ?? null,
    });
  }

  userUpdated(user) {
    this.publishMessage.publish(CREATED_USER_QUEUE, UPDATED_USER_JOB, {
      userId: user.id,
      email: user.email,
      phone: user.phone ?? null,
      password: user.password ?? null,
    });
  }
}
