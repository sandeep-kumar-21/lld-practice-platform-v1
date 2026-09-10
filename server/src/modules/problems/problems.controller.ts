import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProblemsService } from './problems.service.js';
import { GetProblemsFilterDto } from './dto/get-problems-filter.dto.js';

@ApiTags('Problems')
@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Get()
  @ApiOperation({ summary: 'List practice problems with optional filters' })
  @ApiResponse({ status: 200, description: 'Array of problem definitions.' })
  public async getProblems(@Query() filter: GetProblemsFilterDto) {
    return this.problemsService.getProblems(filter);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get problem detail by slug' })
  @ApiResponse({ status: 200, description: 'Detailed problem specification.' })
  @ApiResponse({ status: 404, description: 'Problem not found.' })
  public async getProblemBySlug(@Param('slug') slug: string) {
    return this.problemsService.getProblemBySlug(slug);
  }
}

