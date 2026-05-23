/* eslint-env node */
const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '..')
const defaultPostsPath = path.join(projectRoot, 'src', 'assets', 'data', 'posts6.json')

function parseArgs(argv) {
  const args = {
    posts: defaultPostsPath,
    manifest: '',
    seed: 'douyin-phone-mvp-vue',
    dryRun: false
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--manifest') args.manifest = path.resolve(projectRoot, argv[++i] || '')
    else if (arg === '--posts') args.posts = path.resolve(projectRoot, argv[++i] || '')
    else if (arg === '--seed') args.seed = argv[++i] || args.seed
    else if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--help') args.help = true
  }

  return args
}

function usage() {
  return [
    'Usage:',
    '  node scripts/import-videos-agent.cjs --manifest <manifest.json> [--dry-run]',
    '',
    'Manifest rules:',
    '  - videos must be authorized/user-provided/open-license sources',
    '  - mark one video with fixedSecond: true to pin it at posts6.json[1]',
    '  - provide vertical width/height metadata, preferably 1080x1920'
  ].join('\n')
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
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

function assertVerticalVideo(video) {
  const width = Number(video.width || 1080)
  const height = Number(video.height || 1920)

  if (!video.id) throw new Error('Each video needs a stable id')
  if (!video.videoUrl) throw new Error(`Video ${video.id} is missing videoUrl`)
  if (!video.coverUrl) throw new Error(`Video ${video.id} is missing coverUrl`)
  if (width > height) throw new Error(`Video ${video.id} must be vertical, got ${width}x${height}`)

  const ratio = width / height
  if (Math.abs(ratio - 9 / 16) > 0.08) {
    console.warn(`Warning: video ${video.id} is vertical but not close to 9:16 (${width}x${height})`)
  }
}

function withTags(description, tags) {
  const cleanTags = [...new Set((tags || []).filter(Boolean))]
  let result = description || ''
  for (const tag of cleanTags) {
    if (!result.includes(`#${tag}`)) result += `${result ? ' ' : ''}#${tag}`
  }
  return result
}

function buildTextExtra(desc, tags, id) {
  return [...new Set((tags || []).filter(Boolean))].map((tag, index) => {
    const needle = `#${tag}`
    const start = Math.max(0, desc.indexOf(needle))
    return {
      start,
      end: start + needle.length,
      type: 1,
      hashtag_name: tag,
      hashtag_id: `${id}-tag-${index}`,
      is_commerce: /粉底液|底妆|美妆|推荐|测评/.test(tag),
      caption_start: 0,
      caption_end: 0
    }
  })
}

function buildSuggestWords(words, id) {
  if (!words || !words.length) return undefined
  return {
    suggest_words: [
      {
        words: words.map((word, index) => ({ word, word_id: `${id}-search-${index}`, info: '{}' })),
        scene: 'feed_bottom_rec',
        icon_url: '',
        hint_text: '相关搜索',
        extra_info: '{"is_ecom_intent":1}'
      }
    ]
  }
}

function createPost(template, input, index) {
  assertVerticalVideo(input)

  const item = clone(template)
  const id = String(input.id)
  const author = input.author || {}
  const width = Number(input.width || 1080)
  const height = Number(input.height || 1920)
  const durationMs = Number(input.durationMs || 25000)
  const desc = withTags(input.description || '', input.tags || [])
  const nickname = author.nickname || '授权视频作者'
  const uid = String(author.uid || `authorized-${hash(id)}`)

  item.aweme_id = id
  item.desc = desc
  item.create_time = Math.floor(Date.now() / 1000) - index * 3600
  item.share_url = input.shareUrl || ''
  item.video.play_addr.uri = input.videoUrl
  item.video.play_addr.url_list = [input.videoUrl]
  item.video.play_addr.width = width
  item.video.play_addr.height = height
  item.video.play_addr.url_key = `${id}_h264_${width}x${height}`
  item.video.cover.uri = input.coverUrl
  item.video.cover.url_list = [input.coverUrl]
  item.video.cover.width = Number(input.coverWidth || 720)
  item.video.cover.height = Number(input.coverHeight || 1280)
  item.video.poster = input.coverUrl
  item.video.width = width
  item.video.height = height
  item.video.ratio = width >= 1080 ? '1080p' : '720p'
  item.video.duration = durationMs
  item.music.title = input.musicTitle || `${nickname}的原声`
  item.music.author = nickname
  item.music.owner_id = uid
  item.music.owner_nickname = nickname

  if (author.avatarUrl) {
    item.author.avatar_168x168.url_list = [author.avatarUrl]
    item.author.avatar_300x300.url_list = [author.avatarUrl]
    item.music.cover_medium.url_list = [author.avatarUrl]
    item.music.cover_thumb.url_list = [author.avatarUrl]
  }

  item.author.uid = uid
  item.author.unique_id = author.uniqueId || uid
  item.author.short_id = author.shortId || String(hash(uid)).slice(0, 8)
  item.author.nickname = nickname
  item.author.signature = author.signature || '授权视频｜竖屏推荐流'
  item.statistics.digg_count = Number(input.digg || 10000 + (hash(id) % 90000))
  item.statistics.comment_count = Number(input.comments || 100 + (hash(`${id}:c`) % 3000))
  item.statistics.collect_count = Number(input.collect || 100 + (hash(`${id}:f`) % 5000))
  item.statistics.share_count = Number(input.share || 100 + (hash(`${id}:s`) % 2000))
  item.share_info.share_url = input.shareUrl || ''
  item.share_info.share_link_desc = `${desc} 复制此链接，打开Dou音搜索，直接观看视频！`
  item.text_extra = buildTextExtra(desc, input.tags || [], id)

  const suggestWords = buildSuggestWords(input.searchWords, id)
  if (suggestWords) item.suggest_words = suggestWords

  return item
}

function asVideoList(manifest) {
  if (Array.isArray(manifest)) return manifest
  if (Array.isArray(manifest.videos)) return manifest.videos
  throw new Error('Manifest must be an array or an object with a videos array')
}

function stableRandomInsert(base, items, seed) {
  const result = [...base]
  const ordered = [...items].sort((a, b) => hash(`${seed}:${a.aweme_id}`) - hash(`${seed}:${b.aweme_id}`))
  for (const item of ordered) {
    const minIndex = Math.min(2, result.length)
    const span = Math.max(1, result.length - minIndex + 1)
    const index = minIndex + (hash(`${seed}:slot:${item.aweme_id}`) % span)
    result.splice(index, 0, item)
  }
  return result
}

function isFoundationItem(item) {
  const text = `${item.desc || ''} ${item.author?.signature || ''}`
  return /粉底液|底妆|美妆测评/.test(text)
}

function importVideos(args) {
  if (!args.manifest) throw new Error('Missing --manifest')

  const posts = readJson(args.posts)
  const manifest = readJson(args.manifest)
  const videos = asVideoList(manifest)
  if (!posts.length) throw new Error('posts data is empty')

  const template = posts[0]
  const imported = videos.map((video, index) => createPost(template, video, index))
  const importedIds = new Set(imported.map((item) => String(item.aweme_id)))
  const fixed = imported.find((item, index) => videos[index].fixedSecond) || imported.find(isFoundationItem)
  const existingFixed = fixed ? null : posts.find(isFoundationItem)
  const fixedItem = fixed || existingFixed
  const fixedId = fixedItem ? String(fixedItem.aweme_id) : ''

  let base = posts.filter((item) => !importedIds.has(String(item.aweme_id)) && String(item.aweme_id) !== fixedId)
  const normalImported = imported.filter((item) => String(item.aweme_id) !== fixedId)
  base = stableRandomInsert(base, normalImported, args.seed)

  if (fixedItem) {
    const targetIndex = Math.min(1, base.length)
    base.splice(targetIndex, 0, fixedItem)
  }

  return {
    posts: base,
    summary: {
      sourcePosts: posts.length,
      manifestVideos: videos.length,
      importedVideos: imported.length,
      fixedSecondId: fixedId || null,
      outputPosts: base.length
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    console.log(usage())
    return
  }

  try {
    const result = importVideos(args)
    console.log(JSON.stringify(result.summary, null, 2))
    if (!args.dryRun) writeJson(args.posts, result.posts)
  } catch (error) {
    console.error(error.message)
    console.error('')
    console.error(usage())
    process.exitCode = 1
  }
}

main()
