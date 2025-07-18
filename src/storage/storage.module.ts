import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { WasabiService } from './wasabi.service';

@Module({
  providers: [SupabaseService, WasabiService],
  exports: [SupabaseService, WasabiService],
})
export class StorageModule {}
