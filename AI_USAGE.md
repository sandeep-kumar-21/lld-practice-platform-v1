# Low-Level Design Practice Platform - AI Usage Report

This document records **5 meaningful AI-assisted decisions**, detailing what the AI suggested, what was accepted, modified, or rejected, and the technical rationale guiding each decision.

---

### Decision 1: Autonomous Rule-Based Static Analysis Engine vs. Sole Cloud LLM Dependency
- **What Was Evaluated**: Relying solely on remote third-party cloud LLM APIs (e.g. OpenAI / Gemini / OpenRouter) for all evaluation logic vs. engineering an autonomous, self-contained Rule-Based Static Analysis Engine.
- **What Was Decided**: **Engineered an autonomous, AST-like Rule-Based Architectural Evaluator ([`RuleBasedEvaluator`](file:///e:/Assignment_Projects/lld-practice-platform-v1/server/src/domain/evaluators/rule-based.evaluator.ts)) implementing the `IEvaluator` Strategy interface as the primary engine, while retaining pluggable cloud LLM and Mock adapters.**
- **Engineering Rationale**:
  - Cloud LLMs on free tiers suffer from strict rate limits (`429 Too Many Requests`), token quotas, regional outages, and 15–30 second network latencies.
  - Relying exclusively on an external cloud API creates a fragile single point of failure that breaks offline developer evaluation and local CI/CD testing.
  - By implementing a self-contained lexical and structural static analyzer that inspects domain entities, SRP boundaries, God Objects, interface contracts, GoF patterns (Strategy, State, Factory, Observer), concurrency primitives, and trade-off rationales, evaluations run in **$< 20$ milliseconds with 100% determinism and \$0 API cost**.
  - This decision directly demonstrates **Change Test B (Evaluator Strategy Extensibility)** from the assignment specification.

---

### Decision 2: Two-Phase Evaluation Pipeline vs. Monolithic Prompt
- **What the AI Suggested**: Send the raw submission payload, structural validation, completeness checks, and grading rubric directly to an evaluation prompt in a single monolithic pass.
- **What Was Decided**: **Rejected; engineered a strict two-phase evaluation pipeline separating deterministic pre-flight checks from architectural judgment via [`EvaluationPipeline`](file:///e:/Assignment_Projects/lld-practice-platform-v1/server/src/domain/evaluators/evaluation-pipeline.ts).**
- **Engineering Rationale**:
  - Deterministic tasks (verifying section presence, checking minimum word counts, enforcing mandatory design rationale, syntax validation, and state machine guards) should execute with zero token cost and 100% reproducible certainty.
  - Asking a judgment engine or LLM to determine whether a required section is empty wastes compute, introduces non-deterministic grading variance, and slows down the practice feedback loop.
  - Fail-fast pre-flight checks reject incomplete work instantaneously, reserving architectural judgment for nuanced object-oriented trade-offs (Single Responsibility, coupling vs. cohesion, extensibility, and concurrency safety).

---

### Decision 3: Pluggable Adapter Registry vs. Switch-Case Format Branching
- **What the AI Suggested**: Use a `switch (submission.format)` block inside evaluators to branch parsing logic between text submissions and code implementations.
- **What Was Decided**: **Rejected the switch block; engineered the Adapter + Registry pattern ([`ISubmissionContentAdapter`](file:///e:/Assignment_Projects/lld-practice-platform-v1/server/src/domain/adapters/adapter.interface.ts) & [`ContentAdapterRegistry`](file:///e:/Assignment_Projects/lld-practice-platform-v1/server/src/domain/adapters/content-adapter.registry.ts)).**
- **Engineering Rationale**:
  - Hardcoding a `switch` statement tightly couples evaluators to current formats and directly violates the Open-Closed Principle (OCP). Adding a new format (e.g. Mermaid/PlantUML diagrams) would require modifying every existing evaluator class.
  - By introducing `ContentAdapterRegistry`, adding class diagrams (**Change Test A**) required only registering a new `DiagramSubmissionAdapter`. The evaluators remain completely untouched, operating polymorphically on normalized domain representations.

---

### Decision 4: Asynchronous Queue with Storage-First Ingestion vs. Synchronous Request-Response
- **What the AI Suggested**: Run the evaluation synchronously inside the `POST /attempts/:id/submissions` controller and return the completed evaluation immediately in the HTTP response.
- **What Was Decided**: **Rejected synchronous blocking; implemented an asynchronous queue using Redis and BullMQ with storage-first ingestion.**
- **Engineering Rationale**:
  - Deep architectural evaluation and external model calls take multiple seconds. Blocking an HTTP request degrades API throughput, exhausts thread pools, and causes client drops on unstable connections.
  - Submissions are persisted to MySQL with status `PENDING` *before* enqueuing into BullMQ. If Redis restarts or workers crash, no learner submission is lost.
  - BullMQ provides built-in exponential backoff retries and natural idempotency via `jobId = submission.id`. If retries exhaust, the system seamlessly triggers **graceful degradation** to `COMPLETED_PARTIAL`.

---

### Decision 5: Guarded State Machine & Idempotency Hash vs. Ad-Hoc Status Mutation
- **What the AI Suggested**: Directly mutate `submission.status` strings in service methods whenever a status change occurs.
- **What Was Decided**: **Rejected stringly-typed status mutations; engineered an explicit domain state machine ([`SubmissionStateMachine`](file:///e:/Assignment_Projects/lld-practice-platform-v1/server/src/domain/state-machine/submission-state-machine.ts)) and SHA-256 content fingerprinter.**
- **Engineering Rationale**:
  - Ad-hoc string assignment allows illegal transitions (e.g. `PENDING` $\to$ `COMPLETED` skipping `EVALUATING`, or mutating a terminal `COMPLETED` submission). The explicit state machine table strictly enforces valid lifecycle transitions and throws domain exceptions on illegal attempts.
  - Content hashing (`SHA-256(attemptId + format + JSON(content) + rationale)`) prevents duplicate processing from accidental double-clicks, returning the existing active submission if submitted within 10 seconds.
