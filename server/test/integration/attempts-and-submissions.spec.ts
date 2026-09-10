import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AttemptsService } from '../../src/modules/attempts/attempts.service.js';
import { SubmissionsService } from '../../src/modules/submissions/submissions.service.js';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Problem } from '../../src/domain/entities/problem.entity.js';
import { Attempt } from '../../src/domain/entities/attempt.entity.js';
import { Submission } from '../../src/domain/entities/submission.entity.js';

describe('Attempts & Submissions Services (Edge Cases & Guardrails)', () => {
  let attemptsService: AttemptsService;
  let submissionsService: SubmissionsService;

  const mockAttemptRepo: any = {
    findById: vi.fn(),
    findActiveAttempt: vi.fn(),
    create: vi.fn(),
    findAttemptsByUser: vi.fn(),
  };

  const mockProblemRepo: any = {
    findById: vi.fn(),
    findAll: vi.fn(),
    findBySlug: vi.fn(),
  };

  const mockSubmissionRepo: any = {
    create: vi.fn(),
    findById: vi.fn(),
    findPreviousSubmission: vi.fn(),
    updateStatus: vi.fn(),
  };

  const mockQueueService: any = {
    enqueueEvaluation: vi.fn(),
  };

  const mockEventEmitter: any = {
    emit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    attemptsService = new AttemptsService(mockAttemptRepo, mockProblemRepo);
    submissionsService = new SubmissionsService(
      mockSubmissionRepo,
      mockAttemptRepo,
      mockQueueService,
      mockEventEmitter,
    );
  });

  describe('AttemptsService - Duplicate In-Progress Guard', () => {
    it('should create an attempt if no active attempt is in progress', async () => {
      mockProblemRepo.findById.mockResolvedValue(
        new Problem(
          'p1',
          'parking-lot',
          'Parking Lot',
          'Desc',
          'MEDIUM',
          [],
          [],
          [],
          [],
        ),
      );
      mockAttemptRepo.findActiveAttempt.mockResolvedValue(null);
      mockAttemptRepo.create.mockImplementation((a: Attempt) => Promise.resolve(a));

      const attempt = await attemptsService.startAttempt({
        problemId: 'p1',
        userId: 'user-1',
      });

      expect(attempt).toBeDefined();
      expect(attempt.problemId).toBe('p1');
      expect(attempt.status).toBe('IN_PROGRESS');
      expect(mockAttemptRepo.create).toHaveBeenCalledOnce();
    });

    it('should throw 409 ConflictException when user already has an IN_PROGRESS attempt', async () => {
      mockProblemRepo.findById.mockResolvedValue(
        new Problem(
          'p1',
          'parking-lot',
          'Parking Lot',
          'Desc',
          'MEDIUM',
          [],
          [],
          [],
          [],
        ),
      );
      mockAttemptRepo.findActiveAttempt.mockResolvedValue(
        new Attempt('existing-att-123', 'p1', 'user-1', 'IN_PROGRESS'),
      );

      await expect(
        attemptsService.startAttempt({
          problemId: 'p1',
          userId: 'user-1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw 404 NotFoundException if problem does not exist', async () => {
      mockProblemRepo.findById.mockResolvedValue(null);

      await expect(
        attemptsService.startAttempt({
          problemId: 'non-existent',
          userId: 'user-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('SubmissionsService - Submission Flow & Idempotency', () => {
    it('should reject submission if attempt is nonexistent', async () => {
      mockAttemptRepo.findById.mockResolvedValue(null);

      await expect(
        submissionsService.createSubmission('nonexistent-attempt', {
          format: 'TEXT',
          content: { test: 'val' },
          designRationale:
            'A detailed design rationale explaining architecture and trade-offs.',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject submission if attempt is already completed or abandoned', async () => {
      const attempt = new Attempt('att-1', 'p1', 'user-1', 'SUBMITTED');
      mockAttemptRepo.findById.mockResolvedValue(attempt);

      await expect(
        submissionsService.createSubmission('att-1', {
          format: 'TEXT',
          content: { test: 'val' },
          designRationale:
            'A detailed design rationale explaining architecture and trade-offs.',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should persist submission in PENDING state and enqueue BullMQ job with submissionId as jobId', async () => {
      const attempt = new Attempt('att-1', 'p1', 'user-1', 'IN_PROGRESS');
      mockAttemptRepo.findById.mockResolvedValue(attempt);
      mockSubmissionRepo.create.mockImplementation((s: Submission) =>
        Promise.resolve(s),
      );

      const result = await submissionsService.createSubmission('att-1', {
        format: 'TEXT',
        content: { requirementsAndAssumptions: 'Multi-floor lot.' },
        designRationale:
          'Chosen Strategy pattern for pricing to easily swap hourly vs slab rates.',
      });

      expect(result.status).toBe('PENDING');
      expect(result.version).toBe(1);
      expect(mockQueueService.enqueueEvaluation).toHaveBeenCalledWith(
        result.submissionId,
        'att-1',
        'TEXT',
      );
    });

    it('should disallow retry for an already COMPLETED submission', async () => {
      const completedSub = new Submission(
        'sub-1',
        'att-1',
        'TEXT',
        {},
        1,
        'COMPLETED',
        'Rationale',
      );
      mockSubmissionRepo.findById.mockResolvedValue(completedSub);

      await expect(
        submissionsService.retryEvaluation('sub-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

