# ADR-001: Submission Format Choice — Structured Text and Code over Free-Form Diagrams

## Status
Accepted

## Context
In Low-Level Design (LLD) practice and assessments, learners must convey class responsibilities, design patterns, encapsulation, and trade-offs. While graphical UML tools exist, free-form drag-and-drop canvas diagrams introduce heavy drawing friction, lack semantic AST precision, and require complex, error-prone vision LLM processing.

## Decision
We adopted **Structured Text + Code Implementation** as the primary MVP submission formats, supported by an extensible **Adapter Pattern** (`ISubmissionContentAdapter`):
1. **Structured Text**: Standardized into 4 core architectural sections:
   - Requirements & Assumptions
   - Classes & Responsibilities
   - Key Relationships & Design Patterns
   - Trade-offs & Extensibility
2. **Code Implementation**: Polyglot code editor (TypeScript, Java, Python, C++) capturing actual class definitions, interfaces, and inheritance.
3. **Mandatory Design Rationale**: A required 2–5 sentence justification field providing direct evidence for rubric scoring.

## Alternatives Considered
- *Free-form canvas / drag-and-drop UML*: High UI engineering cost, slow user input, noisy vision model evaluations.
- *Unstructured free-form text box*: Inconsistent submissions, missing architectural sections, poor automated deterministic validation.

## Consequences
- Fast learner authoring with zero canvas overhead.
- Deterministic checks can strictly validate section completeness, syntax, and word counts before invoking secondary evaluators.
- Extensible: **Change Test A** proved that adding Mermaid/PlantUML class diagrams requires only implementing `DiagramSubmissionAdapter` without touching evaluators.

