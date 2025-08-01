// database.service.ts
import { neon } from '@neondatabase/serverless';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Transfer {
  id: string;
  sender_email: string;
  recipient_emails: string[];
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'expired';
  file_count: number;
  total_size: number;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class MetadataService {
  private readonly sql: ReturnType<typeof neon>;

  constructor(private configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined');
    }
    this.sql = neon(databaseUrl);
  }

  async createTransfer(transfer: Transfer): Promise<Transfer> {
    const result = (await this.sql`
      INSERT INTO transfers (
        id, sender_email, recipient_emails, title,
        status, file_count, total_size,
        expires_at, created_at, updated_at
      ) VALUES (
        ${transfer.id},
        ${transfer.sender_email},
        ${transfer.recipient_emails},
        ${transfer.title},
        ${transfer.status},
        ${transfer.file_count},
        ${transfer.total_size},
        ${transfer.expires_at},
        ${transfer.created_at},
        ${transfer.updated_at}
      )
      RETURNING *
    `) as Transfer[];

    return result[0];
  }

  async getTransfer(id: string): Promise<Transfer | null> {
    const result = (await this.sql`
      SELECT * FROM transfers WHERE id = ${id}
    `) as Transfer[];
    return result[0] || null;
  }

  async updateTransferProgress(
    id: string,
    additionalFileCount: number,
    additionalSize: number,
  ): Promise<Transfer> {
    const result = (await this.sql`
      UPDATE transfers
      SET 
        file_count = file_count + ${additionalFileCount},
        total_size = total_size + ${additionalSize},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `) as Transfer[];

    if (!result[0]) {
      throw new InternalServerErrorException('Transfer not found');
    }

    return result[0];
  }

  async updateTransferStatus(
    id: string,
    status: Transfer['status'],
  ): Promise<Transfer> {
    const result = (await this.sql`
      UPDATE transfers
      SET 
        status = ${status},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `) as Transfer[];

    if (!result[0]) {
      throw new InternalServerErrorException('Transfer not found');
    }

    return result[0];
  }
}
