import { Module } from '@nestjs/common';
import { WasabiService } from './wasabi.service';

@Module({
  providers: [WasabiService],
  exports: [WasabiService],
})
export class StorageModule {}
