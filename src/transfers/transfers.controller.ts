import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ValidationPipe,
  UsePipes,
  NotFoundException,
} from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { Transfer } from './entities/transfer.entity';

@Controller('transfers')
@UsePipes(new ValidationPipe({ transform: true }))
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  async create(
    @Body() createTransferDto: CreateTransferDto,
  ): Promise<{ transferId: string }> {
    return this.transfersService.create(createTransferDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Transfer> {
    const transfer = await this.transfersService.findOne(id);

    if (!transfer) {
      throw new NotFoundException(`Transfer with ID "${id}" not found`);
    }

    return transfer;
  }
}
