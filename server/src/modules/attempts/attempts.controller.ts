import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AttemptsService } from './attempts.service.js';
import { CreateAttemptDto } from './dto/create-attempt.dto.js';

@ApiTags('Attempts')
@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post()
  @ApiOperation({
    summary: 'Start an attempt on a problem',
    description:
      'Creates a new practice attempt. Returns 409 Conflict if an attempt is already IN_PROGRESS for this problem.',
  })
  @ApiResponse({ status: 201, description: 'Attempt created successfully.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - An attempt is already IN_PROGRESS for this problem.',
  })
  public async startAttempt(@Body() dto: CreateAttemptDto) {
    return this.attemptsService.startAttempt(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attempt details including all submission versions' })
  @ApiResponse({ status: 200, description: 'Attempt detail with submissions history.' })
  @ApiResponse({ status: 404, description: 'Attempt not found.' })
  public async getAttemptById(@Param('id') id: string) {
    return this.attemptsService.getAttemptById(id);
  }
}

