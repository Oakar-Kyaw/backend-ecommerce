import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  ShippingLocation,
  ShippingLocationDocument,
} from '../schemas/shipping-location.schema';

import { CreateShippingAddressDto } from '../dto/create-shipping-address.dto';

import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class ShippingAddressService {
  constructor(
    @InjectModel(ShippingLocation.name)
    private readonly shippingAddressModel: Model<ShippingLocationDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // 🔹 Create shipping address
  async create(dto: CreateShippingAddressDto) {
    const { userId, ...addressData } = dto;
    let user;

    if(dto.markDefault === true){
         user = await this.userModel.findOne({ userId });
    if (!user) {
      throw new NotFoundException(`User Id ${userId} not found`);
    }

    await this.shippingAddressModel.updateMany(
      { user: user._id },
      { markDefault: false },
    );
    }


    const created = await this.shippingAddressModel.create({
      ...addressData,
      user: user._id,
    });

    return {
      success: true,
      data: created,
      message: 'ADDRESS_CREATED',
    };
  }

  // 🔹 Find all addresses
  async findAll(userId?: number, page?: number, pageSize?: number) {
        let filter: { user?: Types.ObjectId } = {};

        if (userId) {
            const user = await this.userModel.findOne({ userId }).exec();
            if (!user) {
            throw new NotFoundException(`User with userId ${userId} not found`);
            }
            filter.user = user._id;
        }

        const query = this.shippingAddressModel.find(filter).populate('user').sort({createdAt: -1});

        if (page && pageSize) {
            query.skip((page - 1) * pageSize).limit(pageSize);
        }

        const result = await query.exec();

        return {
            success: true,
            data: result,
            message: 'ADDRESS_LIST',
        };
  }


  // 🔹 Find by ID
  async findOne(id: string) {
    const address = await this.shippingAddressModel.findById(id).populate("user");
    if (!address) {
      throw new NotFoundException(`Shipping address #${id} not found`);
    }

    return {
      success: true,
      data: address,
      message: 'ADDRESS_FOUND',
    };
  }

  // 🔹 Find by user
  async findByUser(userId: string) {
    const user = await this.userModel.findOne({ userId });
    if (!user) {
      throw new NotFoundException(`User Id ${userId} not found`);
    }

    const addresses = await this.shippingAddressModel.find({
      user: user._id,
    }).populate("user");

    return {
      success: true,
      data: addresses,
      message: 'ADDRESS_BY_USER',
    };
  }

  // 🔹 Update shipping address
  async update(id: string, dto: CreateShippingAddressDto) {
    const { userId, markDefault } = dto
    if(markDefault === true){
        const user = await this.userModel.findOne({ userId });
    if (!user) {
      throw new NotFoundException(`User Id ${userId} not found`);
    }

    await this.shippingAddressModel.updateMany(
      { user: user._id },
      { markDefault: false },
    );
    }

    const updated = await this.shippingAddressModel.findByIdAndUpdate(
      id,
      dto,
      { new: true },
    ).populate("user");

    if (!updated) {
      throw new NotFoundException(`Shipping address #${id} not found`);
    }

    return {
      success: true,
      data: updated,
      message: 'ADDRESS_UPDATED',
    };
  }

  // 🔹 Set default address
  async setDefault(addressId: string, userId: string) {
    const user = await this.userModel.findOne({ userId });
    if (!user) {
      throw new NotFoundException(`User Id ${userId} not found`);
    }

    await this.shippingAddressModel.updateMany(
      { user: user._id },
      { markDefault: false },
    );

    const updated = await this.shippingAddressModel.findByIdAndUpdate(
      addressId,
      { markDefault: true },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException(`Shipping address #${addressId} not found`);
    }

    return {
      success: true,
      data: updated,
      message: 'ADDRESS_SET_DEFAULT',
    };
  }

  // 🔹 Delete shipping address by ID
async delete(id: string) {
    const deleted = await this.shippingAddressModel.findByIdAndDelete(id);

    if (!deleted) {
        throw new NotFoundException(`Shipping address #${id} not found`);
    }

    return {
        success: true,
        data: deleted,
        message: 'ADDRESS_DELETED',
    };
    }

}
