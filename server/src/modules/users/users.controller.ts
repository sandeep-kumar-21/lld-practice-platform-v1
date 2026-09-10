import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id/attempts')
  @ApiOperation({
    summary: 'Get learner practice history and recurring-weakness analytics',
    description:
      'Retrieves all previous attempts, best scores, and identifies recurring weaknesses across rubric criteria to guide iterative learning.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Learner attempt history with per-criterion aggregate analytics and recurring weakness insights.',
  })
  public async getUserAttempts(@Param('id') id: string) {
    return this.usersService.getUserAttempts(id);
  }
}

