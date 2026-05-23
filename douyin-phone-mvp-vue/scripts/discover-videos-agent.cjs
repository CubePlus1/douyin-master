/* eslint-env node */
const fs = require('fs')
const https = require('https')
const path = require('path')

const projectRoot = path.join(__dirname, '..')
const defaultOut = path.join(projectRoot, 'scripts', 'generated-video-manifest.json')
const beautyPattern = /beauty|makeup|cosmetic|foundation|skincare|美妆|粉底液|底妆|妆|护肤/i
const foundationPattern = /foundation|粉底液|底妆|持妆|遮瑕/i

function parseArgs(argv) {
  const args = {
    source: '',
    out: defaultOut,
    dryRun: false,
    minTotal: 20,
    beautyRatio: 0.25,
    maxDurationMs: 90000,
    minHeight: 1280,
    requireFoundation: true,
    pexels: false,
    perPage: 40,
    pages: 1,
    queries: ['vertical lifestyle', 'travel vertical', 'food vertical', 'makeup beauty', 'foundation makeup']
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--source') args.source = path.resolve(projectRoot, argv[++i] || '')
    else if (arg === '--out') args.out = path.resolve(projectRoot, argv[++i] || '')
    else if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--min-total') args.minTotal = Number(argv[++i])
    else if (arg === '--beauty-ratio') args.beautyRatio = Number(argv[++i])
    else if (arg === '--max-duration-ms') args.maxDurationMs = Number(argv[++i])
    else if (arg === '--min-height') args.minHeight = Number(argv[++i])
    else if (arg === '--allow-no-foundation') args.requireFoundation = false
    else if (arg === '--pexels') args.pexels = true
    else if (arg === '--per-page') args.perPage = Number(argv[++i])
    else if (arg === '--pages') args.pages = Number(argv[++i])
    else if (arg === '--queries') args.queries = String(argv[++i] || '').split(',').map((value) => value.trim()).filter(Boolean)
    else if (arg === '--help') args.help = true
  }

  return args
}

function usage() {
  return [
    'Usage:',
    '  node scripts/discover-videos-agent.cjs --source scripts/video-source-candidates.example.json --out scripts/generated-video-manifest.json',
    '  node scripts/discover-videos-agent.cjs --pexels --out scripts/generated-video-manifest.json',
    '',
    'Options:',
    '  --dry-run                 Print summary without writing output',
    '  --min-total <n>           Minimum selected videos, default 20',
    '  --beauty-ratio <0..1>     Required beauty share, default 0.25',
    '  --allow-no-foundation     Do not fail when no fixedSecond/foundation candidate exists',
    '  --queries a,b,c           Pexels search queries, comma-separated',
    '',
    'Safety:',
    '  Sources must be authorized, user-provided, open-license, or fetched from an allowed API key.'
  ].join('\n')
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function hash(input) {
  let h = 2166136261
  const text = String(input)
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function toVideoList(input) {
  if (Array.isArray(input)) return input
  if (Array.isArray(input.videos)) return input.videos
  throw new Error('Source must be an array or an object with a videos array')
}

function textOf(video) {
  return `${video.category || ''} ${video.description || ''} ${(video.tags || []).join(' ')} ${video.author?.signature || ''}`
}

function isBeauty(video) {
  return beautyPattern.test(textOf(video))
}

function isFoundation(video) {
  return Boolean(video.fixedSecond) || foundationPattern.test(textOf(video))
}

function isVertical(video) {
  const width = Number(video.width || 0)
  const height = Number(video.height || 0)
  return width > 0 && height > 0 && height > width
}

function isHighQuality(video, args) {
  const height = Number(video.height || 0)
  const durationMs = Number(video.durationMs || 0)
  return height >= args.minHeight && durationMs > 0 && durationMs <= args.maxDurationMs
}

function dedupe(videos) {
  const seen = new Set()
  const result = []
  for (const video of videos) {
    const id = String(video.id || video.videoUrl || '')
    if (!id || seen.has(id)) continue
    seen.add(id)
    result.push(video)
  }
  return result
}

function stableSort(videos, seed) {
  return [...videos].sort((a, b) => hash(`${seed}:${a.id}`) - hash(`${seed}:${b.id}`))
}

function normalizeCandidate(video) {
  const tags = [...new Set((video.tags || []).filter(Boolean))]
  return {
    id: String(video.id),
    fixedSecond: Boolean(video.fixedSecond),
    description: video.description || '',
    videoUrl: video.videoUrl,
    coverUrl: video.coverUrl,
    width: Number(video.width),
    height: Number(video.height),
    durationMs: Number(video.durationMs),
    author: video.author || { uid: `creator-${hash(video.id)}`, nickname: '授权视频作者' },
    musicTitle: video.musicTitle || `${video.author?.nickname || '授权视频作者'}的原声`,
    tags,
    searchWords: video.searchWords || (isBeauty(video) ? ['美妆视频', '底妆技巧'] : [])
  }
}

function validateCandidate(video) {
  if (!video.id) throw new Error('Candidate missing id')
  if (!video.videoUrl) throw new Error(`Candidate ${video.id} missing videoUrl`)
  if (!video.coverUrl) throw new Error(`Candidate ${video.id} missing coverUrl`)
  if (!Number(video.width) || !Number(video.height)) throw new Error(`Candidate ${video.id} missing width/height`)
  if (!Number(video.durationMs)) throw new Error(`Candidate ${video.id} missing durationMs`)
}

function selectCandidates(candidates, args) {
  const valid = dedupe(candidates.map(normalizeCandidate))
  for (const video of valid) validateCandidate(video)

  const compatible = valid.filter((video) => isVertical(video) && isHighQuality(video, args))
  const foundation = compatible.find((video) => video.fixedSecond) || compatible.find(isFoundation)
  if (args.requireFoundation && !foundation) {
    throw new Error('No foundation-review candidate found. Add one item with fixedSecond: true or 粉底液/foundation metadata.')
  }

  const selected = []
  if (foundation) selected.push({ ...foundation, fixedSecond: true })

  const selectedIds = new Set(selected.map((video) => video.id))
  const targetBeautyCount = Math.ceil(args.minTotal * args.beautyRatio)
  const beauty = stableSort(compatible.filter((video) => isBeauty(video) && !selectedIds.has(video.id)), 'beauty')
  const general = stableSort(compatible.filter((video) => !selectedIds.has(video.id)), 'general')

  for (const video of beauty) {
    if (selected.filter(isBeauty).length >= targetBeautyCount) break
    selected.push(video)
    selectedIds.add(video.id)
  }

  for (const video of general) {
    if (selected.length >= args.minTotal) break
    if (selectedIds.has(video.id)) continue
    selected.push(video)
    selectedIds.add(video.id)
  }

  if (selected.length < args.minTotal) {
    throw new Error(`Not enough compatible candidates: selected ${selected.length}, need ${args.minTotal}`)
  }

  if (selected.filter(isBeauty).length < targetBeautyCount) {
    throw new Error(`Not enough beauty candidates: selected ${selected.filter(isBeauty).length}, need ${targetBeautyCount}`)
  }

  const fixedId = selected.find((video) => video.fixedSecond)?.id
  return selected.map((video) => ({ ...video, fixedSecond: Boolean(fixedId && video.id === fixedId) }))
}

function requestJson(url, headers) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, (response) => {
        let body = ''
        response.on('data', (chunk) => {
          body += chunk
        })
        response.on('end', () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`HTTP ${response.statusCode}: ${body.slice(0, 200)}`))
            return
          }
          try {
            resolve(JSON.parse(body))
          } catch (error) {
            reject(error)
          }
        })
      })
      .on('error', reject)
  })
}

async function requestJsonWithRetry(url, headers) {
  let lastError
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await requestJson(url, headers)
    } catch (error) {
      lastError = error
      await sleep(1000 * Math.pow(2, attempt))
    }
  }
  throw lastError
}

function bestPexelsFile(files) {
  return [...(files || [])]
    .filter((file) => file.file_type === 'video/mp4' && file.height > file.width)
    .sort((a, b) => b.height - a.height)[0]
}

async function fetchPexelsCandidates(args) {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) throw new Error('PEXELS_API_KEY is required when using --pexels')

  const results = []
  for (const query of args.queries) {
    for (let page = 1; page <= args.pages; page++) {
      const url = new URL('https://api.pexels.com/videos/search')
      url.searchParams.set('query', query)
      url.searchParams.set('orientation', 'portrait')
      url.searchParams.set('per_page', String(args.perPage))
      url.searchParams.set('page', String(page))
      const data = await requestJsonWithRetry(url, { Authorization: apiKey })
      for (const item of data.videos || []) {
        const file = bestPexelsFile(item.video_files)
        if (!file) continue
        const tags = beautyPattern.test(query) ? ['美妆', '授权素材'] : ['授权素材']
        if (foundationPattern.test(query)) tags.unshift('粉底液')
        results.push({
          id: `pexels-${item.id}-${hash(file.link)}`,
          fixedSecond: foundationPattern.test(query),
          category: beautyPattern.test(query) ? 'beauty' : 'stock',
          description: beautyPattern.test(query)
            ? `授权美妆竖屏素材：${query} #美妆 #授权素材`
            : `授权竖屏短视频素材：${query} #生活记录 #授权素材`,
          videoUrl: file.link,
          coverUrl: item.image,
          width: file.width,
          height: file.height,
          durationMs: Number(item.duration || 0) * 1000,
          author: {
            uid: `pexels-${item.user?.id || hash(item.url)}`,
            nickname: item.user?.name || 'Pexels Creator',
            signature: 'Open API authorized stock video source'
          },
          tags,
          searchWords: beautyPattern.test(query) ? ['美妆素材', '底妆视频'] : ['竖屏短视频']
        })
      }
      await sleep(1100)
    }
  }
  return results
}

async function loadCandidates(args) {
  if (args.source) return toVideoList(readJson(args.source))
  if (args.pexels) return fetchPexelsCandidates(args)
  throw new Error('Provide --source <file> or --pexels')
}

function summary(candidates, selected) {
  return {
    candidates: candidates.length,
    selected: selected.length,
    beautySelected: selected.filter(isBeauty).length,
    fixedSecondId: selected.find((video) => video.fixedSecond)?.id || null,
    verticalSelected: selected.filter(isVertical).length
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    console.log(usage())
    return
  }

  const candidates = await loadCandidates(args)
  const selected = selectCandidates(candidates, args)
  const manifest = { videos: selected }
  console.log(JSON.stringify(summary(candidates, selected), null, 2))
  if (!args.dryRun) writeJson(args.out, manifest)
}

main().catch((error) => {
  console.error(error.message)
  console.error('')
  console.error(usage())
  process.exitCode = 1
})
