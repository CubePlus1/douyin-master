/* eslint-env node */
const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '..', 'src', 'assets', 'data', 'posts6.json')
const list = JSON.parse(fs.readFileSync(file, 'utf8'))
const template = list[0]

const ids = ['foundation-demo-001', 'foundation-demo-002', 'foundation-demo-003']
const cleaned = list.filter((item) => !ids.includes(String(item.aweme_id)))

const videos = [
  {
    aweme_id: 'foundation-demo-001',
    desc: '油皮粉底液红黑榜：这几款到底是真持妆还是假控油？#粉底液 #美妆测评 #买前辩论场',
    cover: '1AnqhGECckVJpAcv2NNYA.png',
    nickname: '小艾底妆研究所',
    music: '底妆实测原声',
    digg: 126000,
    comments: 3281,
    collect: 12880,
    share: 2109,
    hashtags: ['粉底液', '美妆测评', '买前辩论场']
  },
  {
    aweme_id: 'foundation-demo-002',
    desc: '通勤 8 小时粉底液实测：奶油肌和雾面控油谁更适合你？#底妆 #油皮 #粉底液推荐',
    cover: '-ASguSbayah2UaERIU22p.png',
    nickname: '梨梨试色间',
    music: '粉底液通勤测试',
    digg: 84000,
    comments: 1690,
    collect: 9200,
    share: 1410,
    hashtags: ['底妆', '油皮', '粉底液推荐']
  },
  {
    aweme_id: 'foundation-demo-003',
    desc: '敏感肌粉底液避雷：低刺激、遮瑕、持妆不能全都要？#敏感肌 #成分党 #粉底液',
    cover: '0DxoLh0EsHbWoNFt2ks-B.png',
    nickname: '成分不骗人',
    music: '成分党说底妆',
    digg: 67000,
    comments: 921,
    collect: 7210,
    share: 866,
    hashtags: ['敏感肌', '成分党', '粉底液']
  }
]

function cloneVideo(input, index) {
  const item = JSON.parse(JSON.stringify(template))
  item.aweme_id = input.aweme_id
  item.desc = input.desc
  item.create_time = Math.floor(Date.now() / 1000) - index * 3600
  item.duration = 25843
  item.is_top = 1
  item.author_user_id = 93000000000 + index
  item.video.cover.url_list = [input.cover]
  item.video.cover.uri = `foundation-demo-cover-${index}`
  item.video.poster = input.cover
  item.video.duration = 25843
  item.statistics.digg_count = input.digg
  item.statistics.comment_count = input.comments
  item.statistics.collect_count = input.collect
  item.statistics.share_count = input.share
  item.music.title = input.music
  item.music.author = input.nickname
  item.music.owner_nickname = input.nickname
  item.author.nickname = input.nickname
  item.author.uid = String(93000000000 + index)
  item.author.short_id = String(930000 + index)
  item.author.signature = '粉底液实测｜底妆避雷｜买前辩论场 Demo'
  item.author.total_favorited = input.digg * 12
  item.share_info.share_link_desc = `${input.desc} 复制此链接，打开Dou音搜索，直接观看视频！`
  item.text_extra = input.hashtags.map((tag, tagIndex) => ({
    start: Math.max(0, input.desc.indexOf(`#${tag}`)),
    end: Math.max(0, input.desc.indexOf(`#${tag}`)) + tag.length + 1,
    type: 1,
    hashtag_name: tag,
    hashtag_id: `foundation-tag-${index}-${tagIndex}`,
    is_commerce: tag.includes('粉底液') || tag.includes('底妆'),
    caption_start: 0,
    caption_end: 0
  }))
  item.suggest_words = {
    suggest_words: [
      {
        words: [{ word: '油皮粉底液推荐', word_id: 'foundation-search-1', info: '{}' }],
        scene: 'feed_bottom_rec',
        icon_url: '',
        hint_text: '相关搜索',
        extra_info: '{"is_ecom_intent":1}'
      }
    ]
  }
  return item
}

fs.writeFileSync(file, `${JSON.stringify(videos.map(cloneVideo).concat(cleaned), null, 2)}\n`)
console.log(`Injected ${videos.length} foundation videos into ${file}`)
