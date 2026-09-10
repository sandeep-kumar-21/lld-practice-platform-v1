# ADR-003: Worker Architecture — Co-located BullMQ Worker Process for Prototype

## Status
Accepted

## Context
Background job execution requires a queue producer and a worker consumer. In enterprise production, workers run on dedicated auto-scaling pools. For local developer convenience and the 2-day prototype scope, managing multiple terminal daemons adds cognitive and operational friction.

## Decision
We implemented the BullMQ worker (`EvaluationProcessor`) inside the same NestJS runtime process during initialization via `OnModuleInit`, using native Redis pub/sub connectivity.

## Alternatives Considered
- *Separate worker CLI / microservice*: Would require running a third background command (`npm run start:worker`), complicating setup without architectural benefit at current scale.
- *Synchronous in-memory execution*: Would block HTTP requests on evaluation latency and lose jobs on server crash.

## Future Scaling Path
Because `EvaluationProcessor` and `EvaluationQueueService` communicate exclusively over Redis BullMQ without shared in-memory state:
- When scaling beyond a single instance, `EvaluationProcessor` can be moved into a standalone worker binary (`src/worker.ts`) and scaled horizontally via container replicas or worker fleets without changing any domain or queue code.

