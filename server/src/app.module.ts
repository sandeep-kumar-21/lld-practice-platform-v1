import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { QueueModule } from './infrastructure/queue/queue.module.js';
import { ProblemsModule } from './modules/problems/problems.module.js';
import { AttemptsModule } from './modules/attempts/attempts.module.js';
import { SubmissionsModule } from './modules/submissions/submissions.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    EventEmitterModule.forRoot(),
    QueueModule,
    ProblemsModule,
    AttemptsModule,
    SubmissionsModule,
    UsersModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

