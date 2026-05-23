/* eslint-env node */
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const defaultChovyDir = 'D:\\Desktop\\Chovy'

function parseArgs(argv) {
  const args = {
    check: false,
    chovyDir: process.env.CHOVY_DIR || defaultChovyDir,
    python: process.env.CHOVY_PYTHON || 'python'
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--check') args.check = true
    else if (arg === '--chovy-dir') args.chovyDir = path.resolve(argv[++i] || '')
    else if (arg === '--python') args.python = argv[++i] || args.python
    else if (arg === '--help') args.help = true
  }

  return args
}

function usage() {
  return [
    'Usage:',
    '  npm run chovy:check',
    '  npm run chovy:start',
    '',
    'Environment:',
    '  CHOVY_DIR      Override Chovy app directory. Default: D:\\Desktop\\Chovy',
    '  CHOVY_PYTHON   Override Python command. Default: python',
    '',
    'Chovy URL:',
    '  The Vue entry button opens VITE_CHOVY_ENTRY_URL or http://localhost:5000 by default.'
  ].join('\n')
}

function validateChovyDir(chovyDir) {
  const serverFile = path.join(chovyDir, 'server.py')
  const indexFile = path.join(chovyDir, 'index.html')
  const requirementsFile = path.join(chovyDir, 'requirements.txt')

  if (!fs.existsSync(chovyDir)) throw new Error(`Chovy directory not found: ${chovyDir}`)
  if (!fs.existsSync(serverFile)) throw new Error(`Chovy server not found: ${serverFile}`)
  if (!fs.existsSync(indexFile)) throw new Error(`Chovy index not found: ${indexFile}`)
  if (!fs.existsSync(requirementsFile)) throw new Error(`Chovy requirements not found: ${requirementsFile}`)

  return { serverFile, indexFile, requirementsFile }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    console.log(usage())
    return
  }

  const files = validateChovyDir(args.chovyDir)
  console.log(`Chovy directory: ${args.chovyDir}`)
  console.log(`Chovy server: ${files.serverFile}`)
  console.log('Chovy URL: http://localhost:5000')

  if (args.check) return

  const child = spawn(args.python, ['server.py'], {
    cwd: args.chovyDir,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })

  child.on('exit', (code) => {
    process.exitCode = code || 0
  })
}

try {
  main()
} catch (error) {
  console.error(error.message)
  console.error('')
  console.error(usage())
  process.exitCode = 1
}
