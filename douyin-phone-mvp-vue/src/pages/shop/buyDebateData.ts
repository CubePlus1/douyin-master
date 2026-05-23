import role1 from '@/assets/img/buy-debate/03928727564fd28ac79f96f93fd1e0c8.jpg'
import role2 from '@/assets/img/buy-debate/de1c9206f5f57ced33a1c9fb5eb228b9.png'
import role3 from '@/assets/img/buy-debate/4b50e16dfe519895d92512f77aab9f84.png'
import goodsEmpty405 from '@/assets/img/goods-detail/goods-empty-405.png'

export const debateCast = [
  {
    id: 'a',
    brand: '阿玛尼',
    name: '丝绒唇釉 #405',
    role: '理性型选手',
    image: role1,
    price: '320元/6.5ml',
    match: 95,
    argument: '丝绒质地不拔干，#405显白王者色号',
    reason: '丝绒质地不拔干，#405显白王者色号，适合想要显白和高级柔雾妆效的用户。',
    reasons: ['丝绒质地不拔干，长时间使用更稳', '#405 是高频推荐色号，显白优势明确', '评论反馈集中在经典、显气色、适配范围广'],
    specs: ['正红色系', '丝绒哑光', '8小时持妆', '所有肤色'],
    source: '抖音 @美妆师小鱼 · 年度口红榜单高频推荐',
    keywords: ['显白王者', '不拔干', '经典色号', '丝绒质地'],
    params: '320元/6.5ml · 丝绒哑光 · 8小时持妆 · 所有肤色'
  },
  {
    id: 'b',
    brand: '迪奥',
    name: '烈艳蓝金唇膏 #999',
    role: '妆效型选手',
    image: role2,
    price: '350元/3.5g',
    match: 93,
    argument: '正红色天花板，质地滋润不卡纹',
    reason: '正红色天花板，质地滋润不卡纹，适合偏好正式场景和送礼质感的用户。',
    reasons: ['正红色识别度高，正式场景表现稳定', '滋润缎光质地降低卡纹风险', '品牌礼赠属性强，但价格略高'],
    specs: ['经典正红', '滋润缎光', '6小时持妆', '所有肤色'],
    source: '抖音 @成分党Lisa · 黄皮显白口红合集提及',
    keywords: ['正红天花板', '滋润不卡纹', '送礼首选', '高显色度'],
    params: '350元/3.5g · 滋润缎光 · 6小时持妆 · 所有肤色'
  },
  {
    id: 'c',
    brand: 'YSL',
    name: '小金条 #1966',
    role: '稳妥型选手',
    image: role3,
    price: '340元/2.2g',
    match: 91,
    argument: '复古红棕调，黄皮显白神器',
    reason: '复古红棕调，黄皮显白神器，适合秋冬氛围感和暖皮用户。',
    reasons: ['复古红棕调对暖黄皮更友好', '柔雾质地适合秋冬氛围妆', '风格强但日常通用性弱于冠军款'],
    specs: ['红棕复古', '柔雾哑光', '7小时持妆', '黄皮/暖皮'],
    source: '抖音 @毛蛋MAODAN · 大牌口红对比视频入选',
    keywords: ['复古红棕', '黄皮显白', '秋冬必备', '高级感'],
    params: '340元/2.2g · 柔雾哑光 · 7小时持妆 · 黄皮/暖皮'
  }
] as const

export function buildShopProduct(winner: (typeof debateCast)[number]) {
  const priceText = winner.price.replace('元/', '元/').replace('元', '')

  return {
    name: `${winner.brand} ${winner.name}`,
    price: priceText,
    real_price: priceText,
    sold: '2.8万',
    cover: goodsEmpty405,
    imgs: [goodsEmpty405],
    discount: '辩论胜者推荐',
    detail: {
      imgs: [goodsEmpty405]
    }
  }
}
