import { Inject, NotFoundException } from "@nestjs/common";
import { PRISMA } from "../prisma/prisma.service";

export class BrandUserService {
    constructor(@Inject(PRISMA) private prisma) {}
  
    async linkUserToBrand(userId: number, brandId: number) {
  
      return this.prisma.brandUserRelationship.upsert({
          where: {
              userId_brandId: {
                  userId: userId,
                  brandId: brandId,
              },
          },
          // The data to insert if the 'where' condition finds no match
          create: {
              userId,
              brandId,
          },
          update: {
              userId,
              brandId,
          },
      });
    }
  }