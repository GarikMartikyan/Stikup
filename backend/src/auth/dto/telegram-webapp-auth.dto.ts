import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class TelegramWebAppAuthDto {
  @ApiProperty({
    description: 'Raw initData string from Telegram WebApp',
    maxLength: 4096,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  initData!: string;
}
