import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetProblemsFilterDto {
  @ApiPropertyOptional({ description: 'Filter by difficulty (EASY, MEDIUM, HARD)' })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ description: 'Filter by tag (e.g. Concurrency, Strategy Pattern)' })
  @IsOptional()
  @IsString()
  tag?: string;
}

