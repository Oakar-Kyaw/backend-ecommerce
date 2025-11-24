import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Injectable } from "@nestjs/common";
import { envConfig } from "libs/config/envConfig";
import { Multer } from "multer";
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileUpload {
    private client: S3Client;
    private bucketName = envConfig().aws_s3_bucket_name;

    constructor(){
        this.client = new S3Client({
            region: envConfig().aws_region,
            credentials: {
                accessKeyId: envConfig().aws_access_key,
                secretAccessKey: envConfig().aws_secret_key
            },
            forcePathStyle: true,
        })
    }

    async uploadSingle({file, folderName }: {file: Express.Multer.File, folderName: String}){
      try{
        console.log("this is file")
        const key = `${folderName}/${uuidv4()}`;
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            //ACL: isPublic ? 'public-read' : 'private',
    
            // Metadata: {
            //     originalName: file.originalname,
            // },
        });
        const uploadResult = await this.client.send(command);
        console.log('upload', uploadResult)
        return { url: `https://${this.bucketName}.s3.amazonaws.com/${key}` }
    } catch (error) {
        console.log("error",error)
        throw new Error("Something went wrong")
    }
    }

    uploadMultiple(){

    }

    // ========================
  // 🔥 DELETE FILE FROM S3
  // ========================
  async deleteFile(key: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);

      return {
        success: true,
        message: 'File deleted successfully',
        key,
      };
    } catch (error) {
      console.log("error",error)
      throw new Error("Something went wrong")
    }
  }
}