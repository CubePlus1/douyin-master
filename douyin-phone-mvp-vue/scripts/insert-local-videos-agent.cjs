/* eslint-env node */
const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '..')
const defaultPostsPath = path.join(projectRoot, 'src', 'assets', 'data', 'posts6.json')
const defaultPublicVideoDir = path.join(projectRoot, 'public', 'videos', 'local')

function parseArgs(argv) {
  const args = {
    sourceDir: '',
    posts: defaultPostsPath,
    publicVideoDir: defaultPublicVideoDir,
    dryRun: false
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--source-dir') args.sourceDir = path.resolve(argv[++i] || '')
    else if (arg === '--posts') args.posts = path.resolve(argv[++i] || '')
    else if (arg === '--public-video-dir') args.publicVideoDir = path.resolve(argv[++i] || '')
    else if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--help') args.help = true
  }

  return args
}

function usage() {
  return [
    'Usage:',
    '  node scripts/insert-local-videos-agent.cjs [--source-dir <dir>] [--dry-run]',
    '',
    'Default behavior:',
    '  - finds the Desktop video directory under D:\\Desktop',
    '  - selects the last two mp4 files by filename sort',
    '  - copies them to public/videos/local',
    '  - inserts them at feed positions 2 and 4'
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

function findDefaultSourceDir() {
  const desktop = 'D:\\Desktop'
  if (!fs.existsSync(desktop)) throw new Error('D:\\Desktop does not exist')

  const candidates = fs
    .readdirSync(desktop, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(desktop, entry.name))
    .filter((dir) => fs.readdirSync(dir).filter((name) => name.toLowerCase().endsWith('.mp4')).length >= 2)

  const namedVideoDir = candidates.find((dir) => path.basename(dir).includes('视频'))
  if (namedVideoDir) return namedVideoDir
  if (candidates.length === 1) return candidates[0]
  throw new Error(`Could not uniquely identify source video directory. Candidates: ${candidates.join(', ')}`)
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

function buildTextExtra(desc, tags, id) {
  return tags.map((tag, index) => {
    const needle = `#${tag}`
    const start = Math.max(0, desc.indexOf(needle))
    return {
      start,
      end: start + needle.length,
      type: 1,
      hashtag_name: tag,
      hashtag_id: `${id}-tag-${index}`,
      is_commerce: false,
      caption_start: 0,
      caption_end: 0
    }
  })
}

function createLocalPost(template, file, index) {
  const item = clone(template)
  const id = `local-video-${path.basename(file, '.mp4')}`
  const videoPath = `/videos/local/${path.basename(file)}`
  const tags = ['本地素材', '短视频']
  const desc = `本地导入短视频 ${index + 1} #本地素材 #短视频`
  const uid = `local-author-${index + 1}`
  const nickname = `本地素材库 ${index + 1}`
  const now = Math.floor(Date.now() / 1000)
  const size = fs.statSync(file).size

  item.aweme_id = id
  item.desc = desc
  item.create_time = now - index * 60
  item.share_url = ''
  item.duration = 15000
  item.text_extra = buildTextExtra(desc, tags, id)
  item.is_top = 0
  item.video.play_addr.uri = videoPath
  item.video.play_addr.url_list = [videoPath]
  item.video.play_addr.width = 1080
  item.video.play_addr.height = 1920
  item.video.play_addr.url_key = `${id}_h264_1080p_local`
  item.video.play_addr.data_size = size
  item.video.play_addr.file_hash = path.basename(file, '.mp4')
  item.video.width = 1080
  item.video.height = 1920
  item.video.ratio = '1080p'
  item.video.duration = 15000
  item.video.horizontal_type = undefined
  item.video.poster = item.video.cover?.url_list?.[0]
  item.music.title = `${nickname}的原声`
  item.music.author = nickname
  item.music.owner_id = uid
  item.music.owner_nickname = nickname
  item.music.duration = 15
  item.author.uid = uid
  item.author.short_id = String(hash(uid)).slice(0, 8)
  item.author.unique_id = uid
  item.author.nickname = nickname
  item.author.signature = '本地授权视频素材，自动导入推荐流'
  item.author_user_id = Number(String(hash(uid)).slice(0, 8))
  item.statistics.digg_count = 10000 + (hash(id) % 90000)
  item.statistics.comment_count = 100 + (hash(`${id}:comment`) % 3000)
  item.statistics.collect_count = 100 + (hash(`${id}:collect`) % 5000)
  item.statistics.share_count = 100 + (hash(`${id}:share`) % 2000)
  item.share_info.share_url = ''
  item.share_info.share_link_desc = `${desc} 复制此链接，打开Dou音搜索，直接观看视频！`
  item.suggest_words = {
    suggest_words: [
      {
        words: [{ word: '本地短视频素材', word_id: `${id}-search-0`, info: '{}' }],
        scene: 'feed_bottom_rec',
        icon_url: '',
        hint_text: '相关搜索',
        extra_info: '{}'
      }
    ]
  }

  return item
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    console.log(usage())
    return
  }

  const sourceDir = args.sourceDir || findDefaultSourceDir()
  const mp4Files = fs
    .readdirSync(sourceDir)
    .filter((name) => name.toLowerCase().endsWith('.mp4'))
    .sort()
    .map((name) => path.join(sourceDir, name))

  if (mp4Files.length < 2) throw new Error(`Need at least 2 mp4 files in ${sourceDir}`)

  const selected = mp4Files.slice(-2)
  const posts = readJson(args.posts)
  if (!Array.isArray(posts) || posts.length < 4) throw new Error('posts data must contain at least 4 items')

  const template = posts[0]
  const localPosts = selected.map((file, index) => createLocalPost(template, file, index))
  const localIds = new Set(localPosts.map((item) => item.aweme_id))
  const output = posts.filter((item) => !localIds.has(String(item.aweme_id)))

  output.splice(1, 0, localPosts[0])
  output.splice(3, 0, localPosts[1])

  const copiedTo = selected.map((file) => path.join(args.publicVideoDir, path.basename(file)))
  const summary = {
    sourceDir,
    selected: selected.map((file) => path.basename(file)),
    positions: [2, 4],
    sourcePosts: posts.length,
    outputPosts: output.length,
    copiedTo: copiedTo.map((file) => path.relative(projectRoot, file))
  }

  console.log(JSON.stringify(summary, null, 2))
  if (args.dryRun) return

  fs.mkdirSync(args.publicVideoDir, { recursive: true })
  selected.forEach((file, index) => fs.copyFileSync(file, copiedTo[index]))
  writeJson(args.posts, output)
}

try {
  main()
} catch (error) {
  console.error(error.message)
  console.error('')
  console.error(usage())
  process.exitCode = 1
}
