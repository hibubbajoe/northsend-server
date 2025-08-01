import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class WasabiService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    // Get Wasabi configuration from environment variables
    const accessKey = this.configService.get<string>('WASABI_ACCESS_KEY');
    const secretKey = this.configService.get<string>('WASABI_SECRET_KEY');
    const region = this.configService.get<string>('WASABI_REGION');
    const endpoint = this.configService.get<string>('WASABI_ENDPOINT');
    this.bucketName = this.configService.get<string>('WASABI_BUCKET');

    // Validate required configuration
    if (!accessKey || !secretKey || !region || !endpoint || !this.bucketName) {
      throw new Error(
        'Missing required Wasabi configuration. Please set WASABI_ACCESS_KEY, WASABI_SECRET_KEY, WASABI_REGION, WASABI_ENDPOINT, and WASABI_BUCKET environment variables.',
      );
    }

    // Initialize S3 client for Wasabi
    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      // Force path-style URLs for compatibility with Wasabi
      forcePathStyle: true,
    });
  }

  async createPresignedUrl(
    transferId: string,
    fileId: string,
    chunkIndex: number,
    expiresIn: number = 3600,
  ): Promise<{ url: string; path: string }> {
    try {
      const path = `transfers/${transferId}/${fileId}/chunk-${chunkIndex}`;

      // Create the PutObject command for the specified path
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: path,
        ContentType: 'application/octet-stream',
      });

      // Generate the pre-signed URL
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return { url, path };
    } catch (error) {
      console.error('❌ Failed to create Wasabi signed upload URL:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to create Wasabi signed upload URL: ${errorMessage}`,
      );
    }
  }
}
