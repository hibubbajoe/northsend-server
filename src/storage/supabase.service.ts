import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Transfer } from '../transfers/entities/transfer.entity';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error(
        'Missing required Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  }

  async saveTransfer(transfer: Transfer): Promise<Transfer> {
    const response = await this.supabase
      .from('transfers')
      .insert([transfer])
      .select()
      .single();

    if (response.error) {
      console.error('Supabase error:', response.error);
      throw new Error(
        `Failed to save transfer: ${response.error.message || JSON.stringify(response.error)}`,
      );
    }

    return response.data as Transfer;
  }

  async getTransfer(id: string): Promise<Transfer | null> {
    const response = await this.supabase
      .from('transfers')
      .select('*')
      .eq('id', id)
      .single();

    if (response.error) {
      if (response.error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get transfer: ${response.error.message}`);
    }

    return response.data as Transfer;
  }

  async uploadChunk(
    transferId: string,
    fileId: string,
    chunkIndex: number,
    chunkData: Buffer,
    contentType: string = 'application/octet-stream',
  ): Promise<string> {
    const fileName = `transfers/${transferId}/${fileId}/chunk-${chunkIndex}`;

    const { data, error } = await this.supabase.storage
      .from('file-chunks')
      .upload(fileName, chunkData, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload chunk: ${error.message}`);
    }

    return data.path;
  }

  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from('file-chunks')
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  async getSignedUploadUrl(path: string): Promise<string> {
    console.log(`🔐 Generating signed upload URL for path: ${path}`);

    const { data, error } = await this.supabase.storage
      .from('file-chunks')
      .createSignedUploadUrl(path);

    if (error) {
      console.error('❌ Failed to create signed upload URL:', error);
      throw new Error(`Failed to create signed upload URL: ${error.message}`);
    }

    console.log(`✅ Generated signed URL: ${data.signedUrl}`);
    console.log(`   Token: ${data.token}`);

    return data.signedUrl;
  }
}
