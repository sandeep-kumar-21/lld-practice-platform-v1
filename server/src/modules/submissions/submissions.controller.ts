import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SubmissionsService } from './submissions.service.js';
import { CreateSubmissionDto } from './dto/create-submission.dto.js';

@ApiTags('Submissions')
@Controller()
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post('attempts/:attemptId/submissions')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Submit a solution revision on an attempt',
    description:
      'Creates a new submission version in PENDING state and enqueues async evaluation via BullMQ. Returns 202 Accepted immediately without blocking on AI latency.',
  })
  @ApiResponse({
    status: 202,
    description: 'Submission accepted for asynchronous grading.',
  })
  public async createSubmission(
    @Param('attemptId') attemptId: string,
    @Body() dto: CreateSubmissionDto,
  ) {
    return this.submissionsService.createSubmission(attemptId, dto);
  }

  @Get('submissions/:id')
  @ApiOperation({
    summary: 'Get submission details, live evaluation status, and version deltas',
  })
  @ApiResponse({
    status: 200,
    description: 'Submission and evaluation report (if complete).',
  })
  @ApiResponse({ status: 404, description: 'Submission not found.' })
  public async getSubmissionById(@Param('id') id: string) {
    return this.submissionsService.getSubmissionById(id);
  }

  @Post('submissions/:id/retry-evaluation')
  @ApiOperation({
    summary: 'Retry an evaluation after failure or graceful degradation',
  })
  @ApiResponse({
    status: 200,
    description: 'Evaluation job re-enqueued successfully.',
  })
  @ApiResponse({ status: 400, description: 'Submission is already COMPLETED.' })
  public async retryEvaluation(@Param('id') id: string) {
    return this.submissionsService.retryEvaluation(id);
  }
}

