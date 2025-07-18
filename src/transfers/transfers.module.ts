import { Module } from '@nestjs/common';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';
import { SupabaseService } from '../storage/supabase.service';

@Module({
  controllers: [TransfersController],
  providers: [TransfersService, SupabaseService],
  exports: [TransfersService],
})
export class TransfersModule {}
