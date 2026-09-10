import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsObject, IsString, MinLength } from 'class-validator';
import type { SubmissionFormat } from '../../../domain/entities/submission.entity.js';

export class CreateSubmissionDto {
  @ApiProperty({
    description: 'Submission format: TEXT or CODE',
    enum: ['TEXT', 'CODE'],
    example: 'TEXT',
  })
  @IsNotEmpty()
  @IsIn(['TEXT', 'CODE', 'DIAGRAM'])
  format: SubmissionFormat;

  @ApiProperty({
    description:
      'Polymorphic content object. For TEXT: { requirementsAndAssumptions, classesAndResponsibilities, relationshipsAndPatterns, tradeoffsAndExtensibility }. For CODE: { language, code }',
    example: {
      requirementsAndAssumptions: 'Multi-floor parking lot with gates.',
      classesAndResponsibilities: 'ParkingLot, Slot, Vehicle, Ticket, Gate.',
      relationshipsAndPatterns: 'Strategy pattern for fee calculation.',
      tradeoffsAndExtensibility: 'Atomic locks used for thread safety.',
    },
  })
  @IsNotEmpty()
  @IsObject()
  content: Record<string, any>;

  @ApiProperty({
    description:
      'Mandatory 2-5 sentence explanation of key design choices and trade-offs.',
    example:
      'Applied the Strategy pattern to decouple dynamic pricing algorithms from ticket settlement. Used explicit slot states to ensure thread-safe concurrency.',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(20, {
    message:
      'Design rationale must be at least 20 characters explaining your key design decisions and trade-offs.',
  })
  designRationale: string;
}
