# Agent Protocol

All agents communicate through explicit task prompts, command output, files, and task notes. There is no hidden shared state.

## Task Input

Each task prompt contains:

| Field | Meaning |
| --- | --- |
| `Task ID` | Stable identifier used by the dispatcher. |
| `Agent` | The specialist responsible for the task. |
| `Goal` | What must be accomplished. |
| `Scope` | Files or behaviors the agent may inspect or change. |
| `Acceptance` | Conditions that must be true before completion. |
| `Constraints` | Safety and project rules. |
| `Return Format` | Required response shape for the dispatcher. |

## Task Output

Every agent returns:

```text
Task ID:
Status: completed | blocked | failed
Files changed:
Validation:
Findings:
Risks:
Next action:
```

## Status Semantics

| Status | Meaning |
| --- | --- |
| `pending` | Dependencies are not complete or task has not been dispatched. |
| `in_progress` | Dispatcher has assigned the task. |
| `blocked` | Agent cannot proceed without input or an upstream fix. |
| `completed` | Acceptance checks are satisfied. |
| `failed` | Agent attempted the task and hit an unrecovered failure. |
| `skipped` | Dispatcher intentionally omitted the task. |

## Agent Boundaries

| Agent | Allowed Scope |
| --- | --- |
| Debug Agent | Commands, diagnostics, minimal fixes for build/type/lint/runtime blockers. |
| Video Retrieval Agent | Authorized/open-source/user-provided video discovery and Douyin-format filtering. |
| Video Import Agent | Manifest contract, video import script, video data shape, idempotency. |
| Video Stack Insert Agent | Stable random insertion into the recommendation display stack. |
| Beauty Specialist Agent | Foundation-review second-slot rules and beauty metadata. |
| UI Design Agent | Share entry UI, route checks, visual fit, and entry navigation behavior. |
| Share Entry Verification Agent | Read-mostly verification of the screenshot share flow. |
| Docs Agent | Workflow docs, command docs, manifest examples, acceptance docs. |
| Review Agent | Read-only final review unless the dispatcher creates a follow-up fix task. |

## Completion Rules

- A task is not complete until its acceptance checks are verified or explicitly waived by the dispatcher.
- If an agent discovers unrelated existing problems, it reports them as risks instead of fixing them.
- If an agent needs a new downstream task, it reports the proposed task in `Next action`.
- Review Agent findings create follow-up tasks before final delivery.
