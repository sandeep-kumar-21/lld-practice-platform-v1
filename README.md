# Low-Level Design (LLD) Practice Platform

An engineering platform that enables learners to practice Low-Level Object-Oriented Design (LLD), submit solutions across multiple formats, and receive explainable, rubric-grounded architectural feedback with version-to-version improvement tracking.

Built for the **CipherSchools 2-Day Engineering Assignment**.

---

## 1. Assignment Deliverables Index

In accordance with Section 7 and Section 11 of the assignment specification, all core deliverables are provided in the repository:

| Deliverable | Location | Description |
| :--- | :--- | :--- |
| **Research Note** | [`RESEARCH_NOTE.md`](./RESEARCH_NOTE.md) & [`docs/research-note.md`](./docs/research-note.md) | In-depth analysis of the learner problem, comparative analysis of existing tools (LeetCode, Educative, GitHub repos, unconstrained LLMs), 4 critical industry gaps, and product direction. |
| **Design Note** | [`DESIGN_NOTE.md`](./DESIGN_NOTE.md) & [`docs/design-note.md`](./docs/design-note.md) | MVP scope, user flow, class responsibilities, Change Test A & B proof, two-phase deterministic vs. architectural evaluation, exact weighted scoring formula, and answers to the 5 core assignment questions. |
| **ADR Records** | [`docs/adr/`](./docs/adr/) | 4 Architecture Decision Records (`ADR-001` Format Choice, `ADR-002` Polling vs. WebSockets, `ADR-003` Single-Process Worker for Prototype, `ADR-004` Rubric Versioning). |
| **AI Usage Report** | [`AI_USAGE.md`](./AI_USAGE.md) | 5 concrete, meaningful AI-assisted decisions: what was suggested, what was accepted/rejected, and the engineering rationale. |
| **Working Prototype** | [`server/`](./server) & [`client/`](./client) | Fully functional NestJS API (Port 4000) and Next.js developer workspace (Port 3000) with BullMQ Redis background worker. |
| **Automated Tests** | [`server/test/`](./server/test) | 29 unit, domain, change test, and integration test cases covering edge cases, state machine transitions, and idempotency. |

---

## 2. Architecture & Applied LLD Design Patterns

```
Frontend (Next.js 16 - Port 3000)
    │
    ▼  REST / Asynchronous Polling (1.5s interval)
Backend (NestJS - Port 4000)
    ├── Domain Aggregates (Problem, Attempt, Submission, Evaluation, Rubric)
    ├── State Machine Guard (SubmissionStateMachine)
    ├── Content Adapter Registry (Text, Code, Diagram / Mermaid) ◄── [Change Test A]
    ├── Evaluation Pipeline (Deterministic Pre-Flight + EvaluatorStrategy) ◄── [Change Test B]
    │       ├── Primary: Autonomous Rule-Based Static Analyzer (<20ms, $0 cost, offline)
    │       ├── Cloud: OpenRouter / Cloud LLM Adapter (reasoning models)
    │       └── Test: Mock Evaluator (deterministic test suite)
    ├── Idempotency Guard (SHA-256 Content Fingerprint)
    └── Queue Worker (BullMQ + Redis with Exponential Backoff Retries)
```

### Applied Design Patterns:
- **Strategy Pattern (`IEvaluator`)**: Decouples evaluation techniques (Deterministic heuristics, Rule-Based static analysis, Cloud LLM reasoning, Mock doubles).
- **Adapter Pattern (`ISubmissionContentAdapter`)**: Ingests diverse submission formats (Text, Code, Class Diagrams) and normalizes them polymorphically.
- **Registry Pattern (`ContentAdapterRegistry` & `EvaluatorRegistry`)**: Fulfills **Change Test A** and **Change Test B** by enabling runtime registration without modifying core domain classes.
- **Pipeline Pattern (`EvaluationPipeline`)**: Coordinates fail-fast pre-flight validation, secondary linters, and AI evaluation with automated graceful degradation.
- **Repository Pattern (`ISubmissionRepository`, `IAttemptRepository`, etc.)**: Fully decouples domain entities from Prisma / MySQL storage.
- **Guarded State Machine (`SubmissionStateMachine`)**: Enforces legal lifecycle transitions (`PENDING` $\to$ `EVALUATING` $\to$ `COMPLETED` / `COMPLETED_PARTIAL` / `FAILED`), throwing domain exceptions on illegal jumps.

---

## 3. The Two Core Change Tests

### Change Test A: Extensible Submission Formats (Diagram Support)
- **Scenario**: Today the learner submits text or code. Later the platform supports a class diagram (Mermaid / PlantUML syntax). How much of your domain model changes?
- **Result**: **0 changes to core evaluators, domain logic, or submission workflows.**
- **Proof**: Registered `DiagramSubmissionAdapter` in `ContentAdapterRegistry`. Verified by [`change-tests.spec.ts`](./server/test/domain/change-tests.spec.ts).

### Change Test B: Pluggable Evaluator Pipeline (Rule-Based & Custom Evaluators)
- **Scenario**: Today feedback comes from one evaluator. Later you add a rule-based evaluator or human review. Can you add it without rewriting the practice flow?
- **Result**: **0 changes to queue processors, state machines, or controllers.**
- **Proof**: Registered `RuleBasedEvaluator` in `EvaluationPipeline`. Verified by [`change-tests.spec.ts`](./server/test/domain/change-tests.spec.ts).

---

## 4. Evaluation Engine Configuration

The platform supports pluggable evaluation strategies via `LLM_PROVIDER` in `server/.env`:

1. **`LLM_PROVIDER="rule_based"` (Recommended Default)**:
   - **100% Free & Autonomous**: Requires no external API keys, credit cards, or cloud billing accounts.
   - **Sub-20ms Execution**: Evaluates AST-like structural tokens, class responsibilities, coupling/cohesion, GoF patterns (Strategy, State, Factory, Observer), encapsulation, and concurrency primitives instantly.
   - **Zero Rate Limits**: Immune to `429 Too Many Requests` or quota exhaustion.
   - **Complete Offline Capability**: Runs seamlessly in air-gapped environments and CI/CD pipelines.
2. **`LLM_PROVIDER="openrouter"` (Optional Cloud LLM)**:
   - Connects to OpenRouter's reasoning models (e.g. `poolside/laguna-s-2.1:free`, `nvidia/nemotron-3-super-120b-a12b:free`, etc.).
   - Requires `OPENROUTER_API_KEY`.
3. **`LLM_PROVIDER="mock"`**:
   - Fast, deterministic mock evaluator for unit and integration testing.

---

## 5. Local Setup Instructions (Native MySQL + Redis, No Docker)

Per Section 0.1 of the specification, no Docker is required. MySQL and Redis run natively on your machine.

### Prerequisites:
- **Node.js**: v20.x or higher
- **MySQL**: Running locally on port `3306`
- **Redis**: Running locally on port `6379`

### Step 1: Provision Local MySQL Database
Open your MySQL client (MySQL Workbench, TablePlus, or CLI) and run:
```sql
CREATE DATABASE IF NOT EXISTS lld_practice_platform;
```

### Step 2: Verify Redis is Running
In a terminal, verify your local Redis instance:
```bash
redis-cli ping
# Should return: PONG
```

### Step 3: Backend Setup (`server`)
```bash
cd server

# 1. Install dependencies
npm install

# 2. Setup environment (uses rule_based engine by default)
# Ensure DATABASE_URL in .env matches your local MySQL credentials
# Default: mysql://root:password@localhost:3306/lld_practice_platform

# 3. Synchronize database schema and seed problems + 8-criterion rubric
npx prisma db push
npx prisma db seed

# 4. Start the NestJS backend (Port 4000)
npm run start:dev
```
- API Endpoint: `http://localhost:4000`
- Swagger Interactive API Docs: `http://localhost:4000/api/docs`
- Health Readiness Probe: `http://localhost:4000/health`

### Step 4: Frontend Setup (`client`)
In a second terminal window:
```bash
cd client

# 1. Install dependencies
npm install

# 2. Start the Next.js development server (Port 3000)
npm run dev
```
- Web Application: [http://localhost:3000](http://localhost:3000)

---

## 6. Running Automated Tests

The test suite covers domain invariants, state machines, evaluator contracts, Change Tests A & B, and edge cases.

In the `server` directory:
```bash
cd server
npm test
```

### Test Coverage Breakdown (29 Tests across 8 Test Suites):
- **`change-tests.spec.ts` (3 tests)**: Verifies **Change Test A** (Diagram normalization & evaluation) and **Change Test B** (Rule-based evaluator pipeline pluggability).
- **`idempotency-and-invariants.spec.ts` (4 tests)**: Verifies entity invariant protection, illegal state transition rejection, and SHA-256 idempotency deduplication.
- **`submission-state-machine.spec.ts` (6 tests)**: Verifies legal vs. illegal state transitions (`PENDING` $\to$ `EVALUATING` $\to$ `COMPLETED`).
- **`llm-evaluator.spec.ts` (6 tests)**: Verifies prompt formatting, JSON contract validation, and malformed response exception handling.
- **`weighted-score-calculator.spec.ts` (5 tests)**: Verifies normalized weighted score formula and version-to-version delta calculation.
- **`evaluator-registry.spec.ts` (3 tests)**: Verifies registry lookup and format support queries.
- **`attempts-and-submissions.spec.ts` (2 tests)**: Integration tests verifying attempt creation, duplicate in-progress 409 guard, and submission lifecycle.

---

## 7. Key Trade-Offs & Future Scaling Path

1. **Modular Monolith over Microservices**:
   The assignment explicitly warns against premature distributed systems complexity. A clean modular monolith provides sub-millisecond in-process boundary checks while preserving clean domain segregation.
2. **Short-Interval HTTP Polling (1.5s) over WebSockets**:
   Stateless HTTP polling eliminates sticky connection overhead, heartbeat ping-pong, and proxy reconnection bugs, while keeping prototype infrastructure simple and resilient.
3. **Storage-First Ingestion**:
   Submissions are persisted to MySQL with status `PENDING` *before* enqueuing into BullMQ/Redis. If workers restart, no learner submission is lost.
4. **Future Scaling Path**:
   Because `EvaluationProcessor` and `EvaluationQueueService` communicate exclusively over Redis BullMQ without shared in-memory state, when scaling beyond a single server instance, the BullMQ worker can be extracted into a standalone worker container (`src/worker.ts`) and scaled horizontally independent of the API server.
