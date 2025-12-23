// import { Processor, WorkerHost } from '@nestjs/bullmq';
// import { Job } from 'bullmq';
// import { InjectModel } from '@nestjs/mongoose';
// import { User, UserDocument } from './schemas/user.schema';
// import { Model } from 'mongoose';
// import {
//   CREATED_BRAND,
//   CREATED_ORDER_SERVICE_QUEUE,
//   CREATED_PRODUCT,
//   CREATED_USER_JOB,
//   DELETE_BRAND,
//   DELETE_PRODUCT,
//   DELETED_USER_JOB,
//   UPDATED_BRAND,
//   UPDATED_PRODUCT,
//   UPDATED_USER_JOB,
// } from 'libs/queue/constant';
// import { BrandDocument, BrandMeta } from './schemas/brand.shema';
// import { ProductDocument, ProductMeta } from './schemas/product.schema';

// // ✅ Correct handler type
// type JobHandler = (job: Job) => Promise<void>;

// type UserType = {
//   id: string;
//   email: string;
//   phone: string;
//   role: string;
// };

// type BrandType = {
//    brandId: string;
//    name: string;
//    imageUrl: string;
//    email: string;
//    isDeleted: string;
// };

// type ProductType = {
//   productId: string;
//   productName: string;
//   productMainImage: string;
//   isDeleted: string;
//   brandId: string;
// }

// @Processor(CREATED_ORDER_SERVICE_QUEUE)
// export class OrderWorker extends WorkerHost {
//   private readonly handlers: Record<string, JobHandler>;

//   constructor(
//     @InjectModel(User.name) private userModel: Model<UserDocument>,
//     @InjectModel(BrandMeta.name) private brandModel: Model<BrandDocument>,
//     @InjectModel(ProductMeta.name) private productModel: Model<ProductDocument>,
//   ) {
//     super();

//     // ✅ Register job handlers
//     this.handlers = {
//       [CREATED_USER_JOB]: this.saveUser.bind(this),
//       [UPDATED_USER_JOB]: this.updateUser.bind(this),
//       [DELETED_USER_JOB]: this.deleteUser.bind(this),
//       [CREATED_PRODUCT]: this.saveProduct.bind(this),
//       [UPDATED_PRODUCT]: this.updateProduct.bind(this),
//       [DELETE_PRODUCT]: this.deleteProduct.bind(this),
//       [CREATED_BRAND]: this.saveBrand.bind(this),
//       [UPDATED_BRAND]: this.updateBrand.bind(this),
//       [DELETE_BRAND]: this.deleteBrand.bind(this),
//     };
//   }

//   async process(job: Job): Promise<void> {
//     const handler = this.handlers[job.name];

//     if (!handler) {
//       throw new Error(`No handler registered for job: ${job.name}`);
//     }

//     console.log('Processing job:', job.name, job.data);

//     try {
//       await handler(job);
//     } catch (err) {
//       console.error(`Order Worker failed on job ${job.id} (${job.name}):`, err);
//       throw err;
//     }
//   }

//   private async saveUser(job: Job): Promise<void> {
//     const data: UserType = job.data as UserType;
//     console.log('save user data from order is: ', data);

//     await this.userModel.findOneAndUpdate(
//       { userId: data.id },      // search condition
//       {
//         userId: data.id,
//         email: data.email,
//         phone: data.phone,
//         role: data.role,
//       },
//       {
//         upsert: true,               // create if not exists
//         new: true,
//         setDefaultsOnInsert: true,
//       }
//     );
//   }

//   private async updateUser(job: Job): Promise<void> {
//     const data: UserType = job.data as UserType;
//     console.log('data is: ', data);
//     const updateData = {
//       userId: data.id,
//       email: data.email,
//       phone: data.phone,
//       role: data.role,
//     };
//     await this.userModel.findOneAndUpdate({ userId: data.id }, updateData);
//   }

//   private async deleteUser(job: Job): Promise<void> {
//     const data: UserType = job.data as UserType;
//     console.log('data is: ', data);
//     await this.userModel.findOneAndDelete(
//       { userId: data.id },
//     );
//   }

//   private async saveBrand(job: Job): Promise<void> {
//     const data: BrandType = job.data as BrandType;
//     console.log('brand is: ', data);

//     await this.brandModel.findOneAndUpdate(
//       { brandId: data.brandId },     // unique key
//       {
//         brandId: data.brandId,
//         name: data.name,
//         email: data.email,
//         imageUrl: data.imageUrl,
//         isDeleted: false,
//       },
//       {
//         upsert: true,                // create if not exists
//         new: true,
//         setDefaultsOnInsert: true,
//       }
//     );
//   }

//   private async updateBrand(job: Job): Promise<void> {
//     const data: BrandType = job.data as BrandType;
//     console.log('data is: ', data);
//     const updateData = {
//       ...data
//     };
//     await this.brandModel.findOneAndUpdate({ brandId: data.brandId }, updateData);
//   }

//   private async deleteBrand(job: Job): Promise<void> {
//     const data: BrandType = job.data as BrandType;
//     console.log('delete Data is: ', data);
//     await this.brandModel.findOneAndDelete(
//       { brandId: data.brandId }
//     );
//   }

//   private async saveProduct(job: Job): Promise<void> {
//     const data: ProductType = job.data as ProductType;
//     console.log('data is: ', data);
//     const brand = await this.brandModel.findOne({brandId: data.brandId})
//     const create = new this.productModel({
//         productId: data.productId,
//         productName: data.productName,
//         productMainImage: data.productMainImage,
//         isDeleted: data.isDeleted,
//         brandId: brand?._id
//     });
//     await create.save();
//   }

//   private async updateProduct(job: Job): Promise<void> {
//     const data: ProductType = job.data as ProductType;
//     console.log('data is: ', data);
//     const brand = await this.brandModel.findOne({brandId: data.brandId})
//     const updateData = {
//       productId: data.productId,
//       productName: data.productName,
//       productMainImage: data.productMainImage,
//       isDeleted: data.isDeleted,
//       brandId: brand?._id
//     };
//     await this.productModel.findOneAndUpdate({ productId: data.productId }, updateData);
//   }

//   private async deleteProduct(job: Job): Promise<void> {
//     const data: ProductType = job.data as ProductType;
//     console.log('data is: ', data);
//     await this.productModel.findOneAndUpdate(
//       { productId: data.productId },
//       { isDeleted: true },
//     );
//   }

// }
