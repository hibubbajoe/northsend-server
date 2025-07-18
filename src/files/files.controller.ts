import {
  Controller,
  Post,
  Body,
  Get,
  BadRequestException,
} from '@nestjs/common';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('generate-test-url')
  async generateTestUrl(): Promise<{ url: string; instructions: string }> {
    console.log('🧪 Generating test URL for direct Wasabi upload...');

    const result = await this.filesService.getUploadUrl(
      'test-transfer-id',
      'test-file-id',
      0,
    );

    console.log('✅ Test URL generated:', result.url);

    return {
      url: result.url,
      instructions: `Test with: curl -X PUT -T ./your-test-file.bin -H "Content-Type: application/octet-stream" "${result.url}"`,
    };
  }

  @Post('get-upload-url')
  async getUploadUrl(
    @Body() body: { transferId: string; fileId: string; chunkIndex: number },
  ): Promise<{ url: string; path: string }> {
    const { transferId, fileId, chunkIndex } = body;

    console.log(
      `🔗 Getting upload URL for chunk ${chunkIndex} of file ${fileId}`,
    );

    if (!transferId || !fileId || chunkIndex === undefined) {
      throw new BadRequestException(
        'Missing required fields: transferId, fileId, chunkIndex',
      );
    }

    const result = await this.filesService.getUploadUrl(
      transferId,
      fileId,
      chunkIndex,
    );
    console.log(
      `✅ Returning signed URL for chunk ${chunkIndex}: ${result.url}`,
    );

    return result;
  }
}
