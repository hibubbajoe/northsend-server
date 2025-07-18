import { Injectable } from '@nestjs/common';
import { WasabiService } from '../storage/wasabi.service';

@Injectable()
export class FilesService {
  constructor(private wasabiService: WasabiService) {}

  async getUploadUrl(
    transferId: string,
    fileId: string,
    chunkIndex: number,
  ): Promise<{ url: string; path: string }> {
    const path = `transfers/${transferId}/${fileId}/chunk-${chunkIndex}`;
    const signedUrl = await this.wasabiService.getSignedUploadUrl(path);

    return {
      url: signedUrl,
      path: path,
    };
  }

  async getChunkUrl(
    transferId: string,
    fileId: string,
    chunkIndex: number,
  ): Promise<string> {
    const path = `transfers/${transferId}/${fileId}/chunk-${chunkIndex}`;
    return this.wasabiService.getSignedUploadUrl(path);
  }
}
