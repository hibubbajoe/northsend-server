import {
  IsEmail,
  IsString,
  IsDateString,
  IsArray,
  ArrayMinSize,
} from 'class-validator';

export class CreateTransferDto {
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
}
