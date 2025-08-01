import {
  IsEmail,
  IsString,
  IsDateString,
  IsArray,
  ArrayMinSize,
  IsNumber,
  IsUUID,
} from 'class-validator';

export class CreateTransferDto {
  @IsUUID()
  id: string;

  @IsEmail()
  senderEmail: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  recipientEmails: string[];

  @IsString()
  title: string;

  @IsDateString()
  expiresAt: string;

  @IsNumber()
  totalSize: number;
}
