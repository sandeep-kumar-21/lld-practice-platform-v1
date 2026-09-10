import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { Redis } from 'ioredis';

@ApiTags('Health')
@Controller('health')
export class HealthController implements OnModuleDestroy {
  private readonly redisClient: Redis;

  constructor(private readonly prisma: PrismaService) {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT) || 6379;
    const password = process.env.REDIS_PASSWORD || undefined;

    this.redisClient = new Redis({
      host,
      port,
      password,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health & readiness probe',
    description: 'Verifies live connectivity to local MySQL and Redis services.',
  })
  @ApiResponse({
    status: 200,
    description: 'Both MySQL and Redis are online and responsive.',
  })
  @ApiResponse({
    status: 503,
    description: 'One or more backing services (MySQL/Redis) is unreachable.',
  })
  public async checkHealth() {
    let mysqlStatus = 'unknown';
    let redisStatus = 'unknown';
    let isHealthy = true;

    // 1. Check MySQL
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      mysqlStatus = 'healthy';
    } catch (err: any) {
      mysqlStatus = `unhealthy: ${err.message}`;
      isHealthy = false;
    }

    // 2. Check Redis
    try {
      const pong = await Promise.race([
        this.redisClient.ping(),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('Redis ping timed out after 2000ms')), 2000),
        ),
      ]);
      redisStatus = pong === 'PONG' ? 'healthy' : `unexpected: ${pong}`;
    } catch (err: any) {
      redisStatus = `unhealthy: ${err.message}`;
      isHealthy = false;
    }

    const payload = {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        mysql: mysqlStatus,
        redis: redisStatus,
      },
    };

    if (!isHealthy) {
      throw new ServiceUnavailableException(payload);
    }

    return payload;
  }

  async onModuleDestroy() {
    await this.redisClient.quit().catch(() => {});
  }
}

