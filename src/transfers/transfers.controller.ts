import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ValidationPipe,
  UsePipes,
  NotFoundException,
  Patch,
  Req,
} from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { Transfer } from './entities/transfer.entity';
import { getAuth } from '@clerk/express';
import { Request } from 'express';

@Controller('transfers')
@UsePipes(new ValidationPipe({ transform: true }))
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  async create(
    @Body() createTransferDto: CreateTransferDto,
    @Req() req: Request,
  ): Promise<{ transferId: string }> {
    const { userId } = getAuth(req);

    return this.transfersService.create(createTransferDto, userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Transfer> {
    const transfer = await this.transfersService.findOne(id);

    if (!transfer) {
      throw new NotFoundException(`Transfer with ID "${id}" not found`);
    }

    return transfer;
  }

  @Patch(':id/complete')
  async completeTransfer(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<Transfer> {
    const { userId } = getAuth(req);

    return this.transfersService.completeTransfer(id, userId);
  }
}
