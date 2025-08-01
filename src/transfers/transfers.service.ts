import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { WasabiService } from '../storage/wasabi.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { Transfer } from './entities/transfer.entity';

@Injectable()
export class TransfersService {
  constructor(
    private usersService: UsersService,
    private wasabiService: WasabiService,
    private configService: ConfigService,
  ) {}

  async create(
    createTransferDto: CreateTransferDto,
    userId: string,
  ): Promise<{ transferId: string }> {
    if (!userId) {
      throw new UnauthorizedException(
        'Authentication required for creating transfers',
      );
    }

    const user = await this.usersService.getUser(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.usage_current_month >= user.usage_limit) {
      throw new BadRequestException(
        `Monthly transfer limit (${user.usage_limit}) reached`,
      );
    }

    if (
      user.storage_used + BigInt(createTransferDto.totalSize) >
      user.storage_limit
    ) {
      throw new BadRequestException(
        `Total size of transfers exceeds transfer limit of ${user.storage_limit} bytes`,
      );
    }

    // Create transfer record
    const transfer: Transfer = {
      id: createTransferDto.id,
      sender_email: createTransferDto.senderEmail,
      recipient_emails: createTransferDto.recipientEmails,
      title: createTransferDto.title,
      status: 'pending',
      file_count: 0,
      total_size: createTransferDto.totalSize,
      expires_at: new Date(createTransferDto.expiresAt),
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Save transfer
    await this.saveTransfer(transfer);

    return { transferId: transfer.id };
  }

  async getUploadUrl(
    transferId: string,
    fileId: string,
    chunkIndex: number,
    fileSize: number,
    userId: string,
  ): Promise<{ url: string; path: string }> {
    if (!userId) {
      throw new UnauthorizedException(
        'Authentication required for file uploads',
      );
    }

    const user = await this.usersService.getUser(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const transfer = await this.findOne(transferId);
    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    const newTotalSize = transfer.total_size + fileSize;
    if (newTotalSize > Number(user.storage_limit)) {
      throw new BadRequestException(
        `File exceeds transfer limit of ${user.storage_limit} bytes`,
      );
    }

    return this.wasabiService.createPresignedUrl(
      transferId,
      fileId,
      chunkIndex,
    );
  }

  async updateTransferProgress(
    transferId: string,
    additionalFileCount: number,
    additionalSize: number,
    userId: string,
  ): Promise<Transfer> {
    if (!userId) {
      throw new UnauthorizedException(
        'Authentication required for updating transfers',
      );
    }

    const transfer = await this.findOne(transferId);
    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    transfer.file_count += additionalFileCount;
    transfer.total_size += additionalSize;
    transfer.updated_at = new Date();

    await this.saveTransfer(transfer);
    return transfer;
  }

  async completeTransfer(
    transferId: string,
    userId: string,
  ): Promise<Transfer> {
    if (!userId) {
      throw new UnauthorizedException(
        'Authentication required for completing transfers',
      );
    }

    const user = await this.usersService.getUser(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const transfer = await this.findOne(transferId);
    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    // Update transfer status
    transfer.status = 'completed';
    transfer.updated_at = new Date();
    await this.saveTransfer(transfer);

    // Update user usage
    await this.usersService.updateUserUsage(
      userId,
      1, // Increment transfer count
      BigInt(transfer.total_size), // Add total size to storage usage
    );

    return transfer;
  }

  async findOne(id: string): Promise<Transfer | null> {
    // Implementation needed - use your database client
    throw new Error('Not implemented');
  }

  private async saveTransfer(transfer: Transfer): Promise<void> {
    // Implementation needed - use your database client
    throw new Error('Not implemented');
  }
}
