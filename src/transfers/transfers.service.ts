import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { Transfer } from './entities/transfer.entity';
import { SupabaseService } from '../storage/supabase.service';
import { randomUUID } from 'crypto';

@Injectable()
export class TransfersService {
  constructor(
    private supabaseService: SupabaseService,
    private configService: ConfigService,
  ) {}

  async create(
    createTransferDto: CreateTransferDto,
  ): Promise<{ transferId: string }> {
    const transferId = randomUUID();
    const now = new Date();

    const transfer: Transfer = {
      id: transferId,
      sender_email: createTransferDto.senderEmail,
      recipient_emails: createTransferDto.recipientEmails,
      title: createTransferDto.title,
      expires_at: new Date(createTransferDto.expiresAt),
      created_at: now,
      updated_at: now,
    };

    await this.supabaseService.saveTransfer(transfer);

    return { transferId };
  }

  async findOne(id: string): Promise<Transfer | null> {
    return this.supabaseService.getTransfer(id);
  }
}
