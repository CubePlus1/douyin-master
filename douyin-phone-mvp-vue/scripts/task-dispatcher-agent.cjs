/* eslint-env node */
const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '..')
const defaultTasksFile = path.join(projectRoot, 'docs', 'agent-workflow', 'tasks.json')
const validStatuses = new Set(['pending', 'in_progress', 'blocked', 'completed', 'failed', 'skipped'])
const terminalStatuses = new Set(['completed', 'skipped'])
const priorityWeight = { high: 0, medium: 1, low: 2 }

function parseArgs(argv) {
  const args = { command: argv[0] || 'status', rest: [], tasksFile: defaultTasksFile, note: '', output: '' }

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--tasks') args.tasksFile = path.resolve(projectRoot, argv[++i] || '')
    else if (arg === '--note') args.note = argv[++i] || ''
    else if (arg === '--output') args.output = argv[++i] || ''
    else args.rest.push(arg)
  }

  return args
}

function usage() {
  return [
    'Usage:',
    '  npm run agent:dispatch -- status',
    '  npm run agent:dispatch -- plan',
    '  npm run agent:dispatch -- ready',
    '  npm run agent:dispatch -- prompt <task-id>',
    '  npm run agent:dispatch -- dispatch',
    '  npm run agent:dispatch -- start <task-id> [--note "note"]',
    '  npm run agent:dispatch -- complete <task-id> --note "summary" [--output file]',
    '  npm run agent:dispatch -- block <task-id> --note "blocker"',
    '  npm run agent:dispatch -- fail <task-id> --note "reason"',
    '  npm run agent:dispatch -- skip <task-id> --note "reason"',
    '  npm run agent:dispatch -- reset'
  ].join('\n')
}

function readWorkflow(file) {
  const workflow = JSON.parse(fs.readFileSync(file, 'utf8'))
  validateWorkflow(workflow)
  return workflow
}

function writeWorkflow(file, workflow) {
  workflow.updatedAt = new Date().toISOString()
  fs.writeFileSync(file, `${JSON.stringify(workflow, null, 2)}\n`)
}

function validateWorkflow(workflow) {
  if (!workflow || !Array.isArray(workflow.tasks)) throw new Error('tasks.json must contain a tasks array')

  const ids = new Set()
  for (const task of workflow.tasks) {
    if (!task.id) throw new Error('Every task needs an id')
    if (ids.has(task.id)) throw new Error(`Duplicate task id: ${task.id}`)
    ids.add(task.id)
    if (!task.agent) throw new Error(`Task ${task.id} needs an agent`)
    if (!validStatuses.has(task.status)) throw new Error(`Task ${task.id} has invalid status: ${task.status}`)
    if (!Array.isArray(task.dependsOn)) throw new Error(`Task ${task.id} dependsOn must be an array`)
    if (!Array.isArray(task.acceptance)) throw new Error(`Task ${task.id} acceptance must be an array`)
  }

  for (const task of workflow.tasks) {
    for (const dependency of task.dependsOn) {
      if (!ids.has(dependency)) throw new Error(`Task ${task.id} depends on unknown task ${dependency}`)
    }
  }
}

function findTask(workflow, id) {
  const task = workflow.tasks.find((item) => item.id === id)
  if (!task) throw new Error(`Unknown task id: ${id}`)
  return task
}

function completedTaskIds(workflow) {
  return new Set(workflow.tasks.filter((task) => terminalStatuses.has(task.status)).map((task) => task.id))
}

function isReady(task, completedIds) {
  return task.status === 'pending' && task.dependsOn.every((dependency) => completedIds.has(dependency))
}

function readyTasks(workflow) {
  const completedIds = completedTaskIds(workflow)
  return workflow.tasks
    .filter((task) => isReady(task, completedIds))
    .sort((a, b) => (priorityWeight[a.priority] ?? 9) - (priorityWeight[b.priority] ?? 9) || a.id.localeCompare(b.id))
}

function taskLine(task) {
  const deps = task.dependsOn.length ? task.dependsOn.join(', ') : '-'
  return `${task.id} | ${task.agent} | ${task.priority} | ${task.status} | deps: ${deps}`
}

function printStatus(workflow) {
  console.log(`Workflow: ${workflow.workflow}`)
  console.log(`Updated: ${workflow.updatedAt}`)
  console.log('')
  for (const task of workflow.tasks) console.log(taskLine(task))
  printReady(workflow)
}

function printReady(workflow) {
  const ready = readyTasks(workflow)
  console.log('')
  console.log('Ready tasks:')
  if (!ready.length) {
    console.log('- none')
    return
  }
  for (const task of ready) console.log(`- ${task.id} -> ${task.agent}`)
}

function printPlan(workflow) {
  const done = new Set()
  const remaining = new Set(workflow.tasks.map((task) => task.id))
  let phase = 1

  while (remaining.size) {
    const current = workflow.tasks
      .filter((task) => remaining.has(task.id) && task.dependsOn.every((dependency) => done.has(dependency)))
      .sort((a, b) => (priorityWeight[a.priority] ?? 9) - (priorityWeight[b.priority] ?? 9) || a.id.localeCompare(b.id))

    if (!current.length) throw new Error('Dependency cycle detected in tasks.json')

    console.log(`Phase ${phase}:`)
    for (const task of current) {
      console.log(`- ${task.id} -> ${task.agent} (${task.priority})`)
      done.add(task.id)
      remaining.delete(task.id)
    }
    console.log('')
    phase++
  }
}

function renderPrompt(workflow, task) {
  const agent = workflow.agents?.[task.agent]
  const role = agent ? agent.role : 'Specialist agent for this task.'
  const mode = agent ? agent.mode : 'unspecified'
  const scope = (task.scope || []).map((item) => `- ${item}`).join('\n') || '- Project files relevant to the task.'
  const acceptance = task.acceptance.map((item) => `- ${item}`).join('\n')
  const dependsOn = task.dependsOn.length ? task.dependsOn.join(', ') : 'none'

  return [
    `You are ${task.agent} for the douyin-phone-mvp-vue project.`,
    '',
    `Task ID: ${task.id}`,
    `Mode: ${mode}`,
    `Role: ${role}`,
    `Project root: ${workflow.projectRoot || projectRoot}`,
    `Depends on: ${dependsOn}`,
    '',
    'Goal:',
    task.goal,
    '',
    'Allowed scope:',
    scope,
    '',
    'Acceptance checks:',
    acceptance,
    '',
    'Constraints:',
    '- Make the smallest correct change.',
    '- Do not revert or overwrite unrelated user changes.',
    '- Do not implement unauthorized scraping or platform bypassing.',
    '- Report existing unrelated issues as risks instead of fixing them.',
    '- If you modify files, run focused validation for the changed scope.',
    '',
    'Return format:',
    'Task ID:',
    'Status: completed | blocked | failed',
    'Files changed:',
    'Validation:',
    'Findings:',
    'Risks:',
    'Next action:'
  ].join('\n')
}

function addNote(task, status, note, output) {
  if (!Array.isArray(task.notes)) task.notes = []
  task.notes.push({
    at: new Date().toISOString(),
    status,
    note: note || '',
    output: output || ''
  })
}

function setStatus(workflow, id, status, note, output) {
  if (!validStatuses.has(status)) throw new Error(`Invalid status: ${status}`)
  const task = findTask(workflow, id)
  task.status = status
  addNote(task, status, note, output)
  return task
}

function resetWorkflow(workflow) {
  for (const task of workflow.tasks) {
    task.status = 'pending'
    task.notes = []
  }
}

function dispatchReady(workflow) {
  const ready = readyTasks(workflow)
  if (!ready.length) {
    console.log('No ready tasks to dispatch.')
    return false
  }

  for (const task of ready) {
    task.status = 'in_progress'
    addNote(task, 'in_progress', 'Dispatched by Task Dispatcher Agent.', '')
    console.log(`===== ${task.id} -> ${task.agent} =====`)
    console.log(renderPrompt(workflow, task))
    console.log('')
  }
  return true
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const workflow = readWorkflow(args.tasksFile)
  const command = args.command
  let changed = false

  if (command === 'status') printStatus(workflow)
  else if (command === 'plan') printPlan(workflow)
  else if (command === 'ready') printReady(workflow)
  else if (command === 'prompt') {
    const task = findTask(workflow, args.rest[0])
    console.log(renderPrompt(workflow, task))
  } else if (command === 'dispatch') {
    changed = dispatchReady(workflow)
  } else if (command === 'start') {
    const task = setStatus(workflow, args.rest[0], 'in_progress', args.note || 'Started manually.', args.output)
    console.log(taskLine(task))
    changed = true
  } else if (command === 'complete') {
    const task = setStatus(workflow, args.rest[0], 'completed', args.note, args.output)
    console.log(taskLine(task))
    changed = true
  } else if (command === 'block') {
    const task = setStatus(workflow, args.rest[0], 'blocked', args.note, args.output)
    console.log(taskLine(task))
    changed = true
  } else if (command === 'fail') {
    const task = setStatus(workflow, args.rest[0], 'failed', args.note, args.output)
    console.log(taskLine(task))
    changed = true
  } else if (command === 'skip') {
    const task = setStatus(workflow, args.rest[0], 'skipped', args.note, args.output)
    console.log(taskLine(task))
    changed = true
  } else if (command === 'reset') {
    resetWorkflow(workflow)
    console.log('Workflow reset to pending.')
    changed = true
  } else if (command === 'help' || command === '--help') {
    console.log(usage())
  } else {
    throw new Error(`Unknown command: ${command}\n\n${usage()}`)
  }

  if (changed) writeWorkflow(args.tasksFile, workflow)
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
