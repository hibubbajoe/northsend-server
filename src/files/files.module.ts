import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { WasabiService } from '../storage/wasabi.service';

@Module({
  controllers: [FilesController],
  providers: [FilesService, WasabiService],
  exports: [FilesService],
})
export class FilesModule {}
