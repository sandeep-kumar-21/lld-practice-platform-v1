# Low-Level Design Practice Platform - Research Note

## 1. The Learner Problem in Low-Level Design (LLD)

Practicing Data Structures & Algorithms (DSA) has a well-defined feedback loop: a solution passes or fails deterministic unit test cases within explicit CPU/memory constraints. In contrast, **Low-Level Design (LLD) practice suffers from subjective ambiguity and a high barrier to automated evaluation**.

### Core Dilemmas Experienced by Learners:
1. **Uncertainty of Quality Despite Completion**:
   A learner can design a Parking Lot, Elevator System, or Vending Machine that compiles and runs, yet remain uncertain whether:
   - Responsibilities are cleanly distributed or clumped into "God Objects".
   - Abstractions actually decouple business rules or merely introduce boilerplate indirection.
   - Relationships (inheritance vs. composition) are resilient to changing requirements.
   - Trade-offs (e.g., locking granularity vs. throughput, consistency vs. latency) are justified.
2. **False Equivalence with "Reference Solutions"**:
   LLD problems rarely possess a single optimal design. Learners who compare their code against GitHub repositories or tutorial videos often mistakenly conclude that any deviation from the author's chosen design patterns indicates an error, penalizing valid architectural trade-offs.
3. **Absence of an Iterative Practice Loop**:
   Learners rarely iterate on an LLD design because feedback is either binary (pass/fail in interview scenarios) or nonexistent. Without structured version-to-version critique, learners do not develop the reflex to refactor or recognize recurring design anti-patterns.

---

## 2. Survey of Existing Approaches & Industry Tools

To inform our MVP, we analyzed several existing platforms, resources, and evaluation models:

| Platform / Tool | Workflow & Submission Model | Feedback Mechanism | Learning Loop & Key Gaps |
| :--- | :--- | :--- | :--- |
| **LeetCode / HackerRank** | Algorithmic code submission against hidden unit tests. | Binary Pass/Fail, execution time, memory percentile. | **Gap**: Completely ignores OOP, SOLID, interface design, and architectural rationale. A 500-line procedural switch-case statement passes all tests. |
| **Educative / NeetCode / InterviewReady** | Passive reading of curated reference architectures and text breakdowns. | Self-assessment quizzes; static reference solution comparison. | **Gap**: Non-interactive; learners cannot submit their own custom designs or receive critique tailored to their specific abstractions and edge-case choices. |
| **GitHub Reference Repos (e.g. `awesome-low-level-design`)** | Browsing sample implementations in Java/C++/Python. | Code inspection only. | **Gap**: Provides an impression of "one true way", discourages exploring alternative patterns (e.g. State vs. Strategy), and provides zero feedback. |
| **Unconstrained LLMs (ChatGPT / Claude web chats)** | Free-form conversational prompt ("Critique my Parking Lot design"). | Conversational prose, subjective compliments, ungrounded numerical scores (e.g. "8.5/10"). | **Gap**: Inconsistent evaluation rubrics, sycophantic grading, hallucinations, failure to cite concrete evidence from the learner's solution, and lack of version progression tracking. |

---

## 3. Key Architectural & Pedagogical Gaps

From this survey, four essential gaps emerged that define the opportunity for a dedicated LLD practice platform:

1. **Lack of a Grounded, Fixed Rubric**:
   Without explicit, invariant evaluation criteria (e.g. Single Responsibility, Coupling & Cohesion, Extensibility, Edge Cases), feedback varies wildly from run to run.
2. **Missing Evidence Attribution**:
   Feedback is only actionable if it points directly to quotes, method signatures, or class definitions in the learner's own submission. Vague comments like "improve modularity" fail to teach.
3. **Absence of Version-to-Version Delta Tracking**:
   Iterative improvement requires answering: *"Did Revision 2 improve or regress compared to Revision 1?"* Learners need to see criterion-level progress as they refactor.
4. **Failure to Surface Recurring Weaknesses**:
   Single-session scores do not reveal longitudinal habits. A learner who consistently struggles with Open-Closed Extensibility across Parking Lot, Elevator, and Ride-Sharing needs cross-session weakness analytics with targeted refactoring guidance.

---

## 4. Product Direction & MVP Hypothesis

### Core Hypothesis:
If we constrain the practice journey to a **tight, iterative loop** driven by an **evidence-backed 8-criterion rubric** and **longitudinal weakness analytics**, learners will spend less time guessing whether their design is "correct" and more time mastering clean architectural trade-offs.

### The Practice Loop:
$$\text{Select Problem} \longrightarrow \text{Structure Design \& Rationale} \longrightarrow \text{Submit} \longrightarrow \text{Explainable Rubric Feedback} \longrightarrow \text{Review Delta} \longrightarrow \text{Iterate Revision}$$

### The 8 Canonical Rubric Dimensions:
To eliminate subjective grading ambiguity, all submissions are judged against 8 invariant architectural dimensions:

| Criterion Key | Focus Area | Learner Dilemma Resolved |
| :--- | :--- | :--- |
| **`REQUIREMENT_UNDERSTANDING`** | Scoping functional and non-functional requirements | Prevents scope neglect, unstated assumptions, and gold-plating. |
| **`CLASS_RESPONSIBILITIES`** | Single Responsibility Principle (SRP) | Detects "God Objects" and ensures classes have a single reason to change. |
| **`COUPLING_COHESION`** | High cohesion within classes, loose coupling between components | Eliminates circular dependencies and tightly bound internal modules. |
| **`ENCAPSULATION_INTERFACE_DESIGN`** | Information hiding, explicit public contracts | Prevents leaking implementation details or mutable state across boundaries. |
| **`EXTENSIBILITY`** | Open-Closed Principle (OCP) | Evaluates how easily new requirements or variants can be added without modifying existing code. |
| **`ABSTRACTION_AND_PATTERNS`** | GoF design patterns (Strategy, State, Factory, Observer) | Replaces speculative indirection with purposeful patterns that match the problem. |
| **`EDGE_CASES_TESTABILITY`** | Concurrency, race conditions, null safety, mockability | Highlights multi-threading pitfalls, idempotency failures, and un-testable monolithic blocks. |
| **`EXPLANATION_QUALITY`** | Trade-off articulation and design rationale | Forces learners to articulate *why* specific trade-offs were made rather than passively copying solutions. |

### Evidence-Backed Feedback Model:
To prevent vague critique ("improve modularity"), each criterion result in an evaluation must contain three structured attributes:
1. **Evidence**: Concrete quotes or references to class names, method signatures, or rationale statements directly extracted from the learner's submission.
2. **Concern**: An objective explanation of the architectural vulnerability, coupling risk, or SOLID violation.
3. **Suggestion**: An actionable refactoring step that preserves clean boundaries without prescribing a single dogmatic solution.

### Separation of Concerns:
- **Deterministic Engine**: Validates structural completeness, minimum section requirements, SHA-256 idempotency deduplication, and legal state transitions ($<5$ms).
- **Architectural Evaluation Engine**: Assesses semantic design quality, responsibility allocation, SOLID alignment, and edge-case handling against the 8-criterion rubric, citing exact submission evidence.
- **Analytics Engine**: Aggregates criterion scores across attempts to surface recurring architectural blind spots (e.g., persistent low scores in `EXTENSIBILITY` or `EDGE_CASES_TESTABILITY`) with targeted practice recommendations.


