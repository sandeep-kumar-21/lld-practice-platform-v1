# ADR-002: Client Synchronization — HTTP Polling over WebSockets / SSE

## Status
Accepted

## Context
Asynchronous evaluation via BullMQ processes submissions in the background. The client must reflect live state transitions (`PENDING` $\to$ `EVALUATING` $\to$ `COMPLETED` / `COMPLETED_PARTIAL` / `FAILED`) without blocking the browser or server HTTP connections.

## Decision
We adopted **short-interval HTTP polling (1500ms interval)** via `GET /submissions/:id` on the client until a terminal state is reached, with a maximum timeout guard.

## Alternatives Considered
- *WebSockets*: Requires stateful connection management, heartbeat ping/pong, authentication handshakes, and sticky load balancing if scaled.
- *Server-Sent Events (SSE)*: Simpler than WebSockets, but adds connection management overhead across reverse proxies and serverless environments.

## Consequences
- **Pros**: Completely stateless, resilient to worker restarts, works through any proxy/firewall, zero extra infrastructure, trivial client cleanup on unmount.
- **Cons**: Adds a few lightweight HTTP requests per submission. Given the 2-6 second evaluation window, a 1.5s interval averages 2-4 requests total, which is well within local and production server capacity.

