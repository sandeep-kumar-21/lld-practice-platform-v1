import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err: any) {
      if (err.code === 'P1003' || err.message?.includes('does not exist')) {
        this.logger.warn(
          'Database does not exist (P1003). Auto-provisioning MySQL schema via prisma db push...',
        );
        try {
          execSync('npx prisma db push --skip-generate', { stdio: 'pipe' });
          execSync('npx tsx prisma/seed.ts', { stdio: 'pipe' });
          await this.$connect();
          this.logger.log('Database successfully auto-provisioned, seeded, and connected!');
          return;
        } catch (pushErr: any) {
          this.logger.error(`Failed to auto-provision database: ${pushErr.message}`);
          throw err;
        }
      }
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

