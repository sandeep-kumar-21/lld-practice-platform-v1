# Low-Level Design Practice Platform - AI Usage Report

This document records **5 meaningful AI-assisted decisions**, detailing what the AI suggested, what was accepted, modified, or rejected, and the technical rationale guiding each decision.
*This report documents the thoughtful, honest reflection on AI-assisted development required by the assignment specification, detailing what AI got right, where it struggled, human interventions, effective workflows, and 5 meaningful architectural decisions.*

- **Author**: Sandeep Kumar
- **Contact Email**: sandeepkumarnitrr@gmail.com
- **Assignment**: CipherSchools Low-Level Design Practice Platform

---

## 1. Executive Reflection on AI-Assisted Development

### A. What the AI Got Right
- **Rapid Scaffolding & Mechanical Boilerplate**: Rapid generation of initial NestJS module skeletons, Swagger DTO validation decorators, Vitest setup configs, and Tailwind CSS component layouts.
- **Pattern Recognition in Regular Expressions**: Generating accurate regular expressions used by adapters for detecting interfaces, classes, methods, and GoF design pattern keywords.
- **Type Signature Completeness**: Ensuring TypeScript types were strictly typed across API boundaries, preventing runtime `any` leaks.

### B. What the AI Got Wrong or Struggled With
- **Architectural Scope & The "All-in-One LLM" Fallacy**: The AI initially suggested sending the learner's entire submission directly into a monolithic LLM prompt to perform structure checks, syntax checks, and architectural grading in a single pass. This was rejected because LLMs are non-deterministic, expensive, slow, and struggle to grade structural rules consistently.
- **Violation of Open-Closed Principle (OCP)**: When prompted on handling different submission formats, the AI initially proposed a `switch (submission.format)` block inside evaluators. This violated OCP and would have failed **Change Test A**.
- **Fragile Cloud Dependency**: The AI defaulted to external OpenAI/Claude API calls. In practice, free-tier cloud models suffered from severe rate limits (`429 Too Many Requests`), network timeouts, and lack of offline reproducibility.
- **Missing Invariant Guards**: The AI initially generated basic CRUD methods that directly mutated `submission.status = 'COMPLETED'` without verifying if the transition from the previous state was legal.
- **Inaccurate UML Relationships**: In the initial class diagram, the AI used solid association arrows (`-->`) for static service calls and omitted interface realization arrows (`..|>`).

### C. Where Human Intervention & Refinement Was Required
- **Autonomous Rule-Based Static Analysis Engine**: Human design was required to architect an offline, AST-like rule-based evaluator ([`RuleBasedEvaluator`](./server/src/domain/evaluators/rule-based.evaluator.ts)) that inspects domain entities, SRP boundaries, God Objects, interface contracts, and GoF patterns in $<20$ms without API costs.
- **Guarded State Machine**: Enforcing the explicit transition lookup table ([`SubmissionStateMachine`](./server/src/domain/state-machine/submission-state-machine.ts)) to make illegal lifecycle jumps structurally impossible.
- **Adapter + Registry Architecture**: Separating format normalization into [`ContentAdapterRegistry`](./server/src/domain/adapters/content-adapter.registry.ts), directly satisfying **Change Test A**.
- **Strict UML Correction**: Overhauling the class diagram to use strict standard UML notations (Composition `*--`, Aggregation `o--`, Dependency `..>`, and Realization `..|>`).
- **Language-Specific Starter Templates**: Providing idiomatic templates for TypeScript, Java, Python, and C++ with smart non-destructive switching in the Monaco editor.

### D. Effective Prompts & Workflows
- **Contract-First Modeling**: Defining pure TypeScript domain interfaces before generating any NestJS controller or Prisma schema.
- **Adversarial Invariant Questioning**: Prompting with resilience scenarios: *"What happens if the background worker crashes immediately after MySQL saves the submission?"* (Led to storage-first ingestion).
- **Test-Driven Extensibility Verification**: Writing `change-tests.spec.ts` first to verify that adding diagrams or rule-based evaluators required zero changes to existing core domain logic.

---

## 2. Five Meaningful AI-Assisted Decisions

### Decision 1: Autonomous Rule-Based Static Analysis Engine vs. Sole Cloud LLM Dependency
- **What Was Evaluated**: Relying solely on remote third-party cloud LLM APIs (e.g. OpenAI / Gemini / OpenRouter) for all evaluation logic vs. engineering an autonomous, self-contained Rule-Based Static Analysis Engine.
- **What Was Decided**: **Engineered an autonomous, AST-like Rule-Based Architectural Evaluator ([`RuleBasedEvaluator`](file:///e:/Assignment_Projects/lld-practice-platform-v1/server/src/domain/evaluators/rule-based.evaluator.ts)) implementing the `IEvaluator` Strategy interface as the primary engine, while retaining pluggable cloud LLM and Mock adapters.**
- **What Was Decided**: **Engineered an autonomous, AST-like Rule-Based Architectural Evaluator ([`RuleBasedEvaluator`](./server/src/domain/evaluators/rule-based.evaluator.ts)) implementing the `IEvaluator` Strategy interface as the primary engine, while retaining pluggable cloud LLM and Mock adapters.**
- **Engineering Rationale**:
  - Cloud LLMs on free tiers suffer from strict rate limits (`429 Too Many Requests`), token quotas, regional outages, and 15–30 second network latencies.
  - Relying exclusively on an external cloud API creates a fragile single point of failure that breaks offline developer evaluation and local CI/CD testing.
  - By implementing a self-contained lexical and structural static analyzer that inspects domain entities, SRP boundaries, God Objects, interface contracts, GoF patterns (Strategy, State, Factory, Observer), concurrency primitives, and trade-off rationales, evaluations run in **$< 20$ milliseconds with 100% determinism and \$0 API cost**.
  - This decision directly demonstrates **Change Test B (Evaluator Strategy Extensibility)** from the assignment specification.

---

### Decision 2: Two-Phase Evaluation Pipeline vs. Monolithic Prompt
- **What the AI Suggested**: Send the raw submission payload, structural validation, completeness checks, and grading rubric directly to an evaluation prompt in a single monolithic pass.
- **What Was Decided**: **Rejected; engineered a strict two-phase evaluation pipeline separating deterministic pre-flight checks from architectural judgment via [`EvaluationPipeline`](file:///e:/Assignment_Projects/lld-practice-platform-v1/server/src/domain/evaluators/evaluation-pipeline.ts).**
- **What Was Decided**: **Rejected; engineered a strict two-phase evaluation pipeline separating deterministic pre-flight checks from architectural judgment via [`EvaluationPipeline`](./server/src/domain/evaluators/evaluation-pipeline.ts).**
- **Engineering Rationale**:
  - Deterministic tasks (verifying section presence, checking minimum word counts, enforcing mandatory design rationale, syntax validation, and state machine guards) should execute with zero token cost and 100% reproducible certainty.
  - Asking a judgment engine or LLM to determine whether a required section is empty wastes compute, introduces non-deterministic grading variance, and slows down the practice feedback loop.
  - Fail-fast pre-flight checks reject incomplete work instantaneously, reserving architectural judgment for nuanced object-oriented trade-offs (Single Responsibility, coupling vs. cohesion, extensibility, and concurrency safety).

---

### Decision 3: Pluggable Adapter Registry vs. Switch-Case Format Branching
- **What the AI Suggested**: Use a `switch (submission.format)` block inside evaluators to branch parsing logic between text submissions and code implementations.
- **What Was Decided**: **Rejected the switch block; engineered the Adapter + Registry pattern ([`ISubmissionContentAdapter`](file:///e:/Assignment_Projects/lld-practice-platform-v1/server/src/domain/adapters/adapter.interface.ts) & [`ContentAdapterRegistry`](file:///e:/Assignment_Projects/lld-practice-platform-v1/server/src/domain/adapters/content-adapter.registry.ts)).**
- **What Was Decided**: **Rejected the switch block; engineered the Adapter + Registry pattern ([`ISubmissionContentAdapter`](./server/src/domain/adapters/adapter.interface.ts) & [`ContentAdapterRegistry`](./server/src/domain/adapters/content-adapter.registry.ts)).**
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
- **What Was Decided**: **Rejected stringly-typed status mutations; engineered an explicit domain state machine ([`SubmissionStateMachine`](./server/src/domain/state-machine/submission-state-machine.ts)) and SHA-256 content fingerprinter.**
- **Engineering Rationale**:
  - Ad-hoc string assignment allows illegal transitions (e.g. `PENDING` $\to$ `COMPLETED` skipping `EVALUATING`, or mutating a terminal `COMPLETED` submission). The explicit state machine table strictly enforces valid lifecycle transitions and throws domain exceptions on illegal attempts.
  - Content hashing (`SHA-256(attemptId + format + JSON(content) + rationale)`) prevents duplicate processing from accidental double-clicks, returning the existing active submission if submitted within 10 seconds.
