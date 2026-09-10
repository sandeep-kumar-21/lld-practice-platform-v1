import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAttemptDto {
  @ApiProperty({ description: 'ID of the problem to attempt', example: 'cuid-123' })
  @IsNotEmpty()
  @IsString()
  problemId: string;

  @ApiPropertyOptional({ description: 'Learner User ID', default: 'learner-demo' })
  @IsOptional()
  @IsString()
  userId?: string;
}

