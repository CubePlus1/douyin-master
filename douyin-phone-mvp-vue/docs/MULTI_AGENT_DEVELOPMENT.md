# Multi-Agent Development

This project uses a lightweight multi-agent workflow. Each agent has a clear responsibility and communicates through explicit files, command output, and review notes. The Task Dispatcher Agent is the runtime coordinator for assigning and tracking work.

## Agents

| Agent | Responsibility | Outputs |
| --- | --- | --- |
| Task Dispatcher Agent | Break user goals into ordered tasks, assign ready tasks, and track task state. | `docs/agent-workflow/tasks.json`, agent prompts, task status summary. |
| Debug Agent | Reproduce build, type, lint, and runtime issues. | Root cause notes, minimal fixes, regression checks. |
| Video Retrieval Agent | Discover authorized/open-source/user-provided vertical short videos and enforce quality/beauty constraints. | Candidate source manifest or generated import manifest. |
| Video Import Agent | Import authorized/user-provided videos into the local recommendation dataset. | Updated `src/assets/data/posts6.json`, import summary. |
| Video Stack Insert Agent | Randomly insert imported videos into the original recommendation stack. | Stable randomized stack order without duplicates. |
| Beauty Specialist Agent | Keep one foundation-review beauty video in the second feed slot. | A fixed second video item with beauty/foundation metadata. |
| UI Design Agent | Maintain the share-sheet `入口` button and route behavior. | `src/components/Share.vue` and route checks. |
| Share Entry Verification Agent | Verify the screenshot share flow and route behavior. | Verification notes and risks. |
| Review Agent | Independently verify behavior, safety, and data integrity. | Findings, residual risks, final go/no-go. |

## Dispatcher Commands

Use the dispatcher before assigning specialist agents:

```bash
npm run agent:dispatch -- status
npm run agent:dispatch -- plan
npm run agent:dispatch -- ready
npm run agent:dispatch -- dispatch
npm run agent:dispatch -- complete <task-id> --note "summary"
```

The dispatcher reads and updates `docs/agent-workflow/tasks.json`. The detailed protocol is in `docs/agent-workflow/AGENT_PROTOCOL.md`.

## Workflow

1. Task Dispatcher Agent writes or updates the task sequence and acceptance checks.
2. Debug Agent runs health checks before feature work: `npm run build`, `npm run type-check`, and lint when relevant.
3. Video Retrieval Agent prepares a high-quality vertical candidate pool from authorized sources.
4. Video Import Agent validates the generated import manifest.
5. Video Stack Insert Agent inserts ordinary videos into the existing recommendation stack.
6. Beauty Specialist Agent pins the selected foundation-review item at feed index `1`.
7. UI Design Agent updates the share panel entry point and Share Entry Verification Agent checks the screenshot flow.
8. Review Agent checks the final diff, data shape, route behavior, source safety, and build result.

## Chovy Entry Integration

The video share-sheet `入口` button opens the Chovy app behind `D:\Desktop\Chovy`.

```bash
npm run chovy:check
npm run chovy:start
```

The default entry URL is `http://localhost:5000`. Override it with `VITE_CHOVY_ENTRY_URL` when needed.

## Video Retrieval Contract

Use a user-provided or authorized candidate pool:

```bash
npm run agent:discover-videos -- --source scripts/video-source-candidates.example.json --min-total 6 --beauty-ratio 0.33 --dry-run
```

Or use the Pexels open API with your own key:

```bash
$env:PEXELS_API_KEY="your-key"
npm run agent:discover-videos -- --pexels --min-total 20 --beauty-ratio 0.25 --out scripts/generated-video-manifest.json
```

The retrieval agent filters for vertical videos, enforces a beauty-video ratio, and requires one `fixedSecond: true` foundation-review candidate unless `--allow-no-foundation` is passed.

## Video Import Contract

Use `npm run agent:import-videos -- --manifest <file>` with a manifest like `scripts/video-manifest.example.json`.

Rules:

- Only authorized, user-provided, or open-license video URLs/files are accepted.
- Videos should be vertical. Preferred metadata is `width: 1080`, `height: 1920`, and MP4/H.264-compatible URLs.
- Each item needs a stable unique `id`; rerunning the same manifest updates instead of duplicating.
- The item marked `fixedSecond: true` is inserted at `posts6.json[1]`.
- Other imported videos are distributed in a stable random-looking order after the second slot.

## Verification

- Share-sheet first video action is `入口` and routes to `/shop/debate`.
- Recommendation feed item 2 is the selected foundation-review video.
- `npm run build` completes.
- Known pre-existing type-check/lint issues must be listed if they are not part of the current task.
