# Task Dispatcher Agent

The Task Dispatcher Agent is the runtime coordinator for this project's multi-agent workflow. It owns the task state file, decides which tasks are ready, prints the exact prompt for each assigned agent, and records task outcomes.

## Files

| File | Purpose |
| --- | --- |
| `docs/agent-workflow/tasks.json` | Workflow state, task dependency graph, and task acceptance checks. |
| `docs/agent-workflow/AGENT_PROTOCOL.md` | Input/output contract for every agent. |
| `scripts/task-dispatcher-agent.cjs` | CLI dispatcher that reads and updates `tasks.json`. |

## Commands

```bash
npm run agent:dispatch -- status
npm run agent:dispatch -- plan
npm run agent:dispatch -- ready
npm run agent:dispatch -- prompt <task-id>
npm run agent:dispatch -- dispatch
npm run agent:dispatch -- complete <task-id> --note "summary"
npm run agent:dispatch -- block <task-id> --note "blocker"
npm run agent:dispatch -- fail <task-id> --note "failure reason"
npm run agent:dispatch -- reset
```

## Dispatcher Loop

1. Run `npm run agent:dispatch -- status` to inspect the current workflow.
2. Run `npm run agent:dispatch -- ready` to see tasks whose dependencies are completed.
3. Run `npm run agent:dispatch -- dispatch` to mark ready tasks as `in_progress` and print their agent prompts.
4. Give each printed prompt to the matching agent.
5. When an agent returns, record the result with `complete`, `block`, or `fail`.
6. Repeat until only `final-review` is ready.
7. Run Review Agent last, then record `complete final-review`.

## Scheduling Rules

- Debug runs first and records whether failures are historical or newly introduced.
- `Video Retrieval Agent`, `Video Import Agent`, and `UI Design Agent` can start after Debug completes.
- `Video Stack Insert Agent` waits for retrieval and import flow readiness.
- `Beauty Specialist Agent` waits for random insertion and then verifies the second feed slot.
- `Share Entry Verification Agent` waits for the UI entry task.
- `Docs Agent` waits for the feature and data-flow tasks it documents.
- `Review Agent` always runs last.
- A blocked or failed task blocks all downstream tasks until the dispatcher records a fix or reset.

## Safety Rules

- The dispatcher never implements business code itself.
- Child agents only work on their assigned scope.
- Video-related agents must not implement unauthorized scraping or platform bypassing.
- Every completed task needs a note that describes the result and validation.
- Existing user changes must not be reverted unless the user explicitly asks.
