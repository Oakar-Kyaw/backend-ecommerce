import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateAddToCartDto,
  CreateUserFavoriteDto,
} from 'apps/product/dto/user-data.dto';
import { PRISMA, PrismaService } from 'apps/product/prisma/prisma.service';
import { connect } from 'http2';

@Injectable()
export class UserData {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaService) {}

  // =========================
  // FAVORITE
  // =========================

  async createFavorite(favorite: CreateUserFavoriteDto) {
    const { userId, productId } = favorite;
    // 1️⃣ Check user
    const user = await this.prisma.user.findUnique({
      where: { userId: Number(userId) },
    });
    if (!user) throw new NotFoundException('User not found');

    // 2️⃣ Check product
    const product = await this.prisma.product.findUnique({
      where: { id: Number(productId) },
    });
    if (!product) throw new NotFoundException('Product not found');

    // 3️⃣ Prevent duplicate
    const exists = await this.prisma.userFavorite.findFirst({
      where: { userId: Number(user.id), productId: Number(productId) },
    });


    if (exists) {
      await this.prisma.userFavorite.delete({ where: { id: exists.id } });
      return { success: true, message: 'USER_CLEAR_FAVORITE' };
      }

    // 4️⃣ Transaction
    const data = await this.prisma.userFavorite.create(
      {
        data: {
          user: { connect: { id: Number(user.id) } },
          product: { connect: { id: Number(productId) } },
        }
      }
    )
    //increment user count 
    await this.prisma.product.update({where: {id: Number(product.id)}, data: { userCount: {
      increment: 1
    }}})

    return {
      success: true,
      data,
      message: 'USER_FAVORITE_CREATED',
    };
  }

  async getUserFavorite(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        userId: Number(userId)
      }
    })
    if (!user) throw new NotFoundException('User not found');
    const data = await this.prisma.userFavorite.findMany({
      where: { userId: user.id },
      include: { product: true },
      orderBy: { id: 'desc' },
    });

    return {
      success: true,
      data,
      message: 'GET_ALL_USER_FAVORITE',
    };
  }

  async deleteFavorite(id: number) {
    const favorite = await this.prisma.userFavorite.findUnique({where: { id }});

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userFavorite.delete({
        where: { id: favorite.id },
      });

    });

    return {
      success: true,
      message: 'DELETE_USER_FAVORITE',
    };
  }

  // =========================
  // ADD TO CART
  // =========================

  async createAddToCart(addtoCart: CreateAddToCartDto) {
     const { userId, productId } = addtoCart;

      // 1️⃣ Check user
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });
    if (!user) throw new NotFoundException('User not found');

    // Check product
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    // Check existing cart item
    const exists = await this.prisma.addToCart.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });
    if(exists){
      throw new ConflictException(
              `ITEM_ALREADY_EXIST_IN_CART`,
        );
    }else {
      const data = await this.prisma.addToCart.create(
        {
          data: {
            user: { connect: { id: user.id } },
            product: { connect: { id: productId } },
          }
        }
      )
      //increment user count
      await this.prisma.product.update({where: {id: product.id}, data: { userCount: {
        increment: 1
      }}})
      return {
        success: true,
        data,
        message: 'USER_ADD_TO_CART_CREATED',
      };
    }
     
    
  }

  async getAddToCart(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        userId: Number(userId)
      }
    })
    if (!user) throw new NotFoundException('User not found');

    const data = await this.prisma.addToCart.findMany({
      where: { userId: user.id },
      include: { product: true },
      orderBy: { id: 'desc' },
    });

    return {
      success: true,
      data,
      message: 'GET_ALL_ADD_TO_CART',
    };
  }

  async deleteAddToCart(id: number) {
    const cart = await this.prisma.addToCart.findUnique({
      where: {
        id
      },
    });

    if (!cart) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.addToCart.delete({
      where: { id: cart.id },
    });

    return {
      success: true,
      message: 'DELETE_ADD_TO_CART',
    };
  }
}
