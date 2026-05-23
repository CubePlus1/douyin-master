<template>
  <div id="BuyDebate">
    <header class="hud">
      <button class="back" @click="router.back()">
        <Icon icon="material-symbols-light:arrow-back-ios-new" />
      </button>
      <button class="skip" @click="skipToResult">skip</button>
      <div class="meta">
        <div class="title">买前辩论场</div>
        <div class="subtitle">{{ roundLabel }} · 第 {{ currentRound }} 轮</div>
      </div>
      <div class="badge">AI 裁判</div>
    </header>

    <div class="progress"><i :style="{ width: progress + '%' }"></i></div>

    <main class="stage">
      <div class="light light-left"></div>
      <div class="light light-center" :class="{ active: phase === 'result' }"></div>
      <div class="light light-right"></div>
      <div class="spotlight"></div>
      <div class="stage-floor"></div>

      <button
        v-for="(item, index) in cast"
        :key="item.id"
        class="character"
        :class="[
          `pos-${index}`,
          { active: currentSpeaker === index, faded: currentSpeaker !== index, winner: winnerId === item.id }
        ]"
        @click="selectedDetail = index"
      >
        <div class="body-wrap">
          <div class="halo"></div>
          <div class="avatar">
            <img :src="item.image" :alt="item.name" />
          </div>
        </div>
        <div class="label">{{ item.role }}</div>
      </button>
    </main>

    <section class="dialogue">
      <div class="speaker-row">
        <span class="speaker">{{ cast[currentSpeaker].name }}</span>
        <span class="turn">{{ messageIndex }}/{{ script.length }}</span>
      </div>
      <div class="bubble">
        <p>{{ currentLine }}</p>
      </div>
    </section>

    <button v-if="phase === 'result'" class="sticky-next" @click="goFinalMode">
      查看最终结果
    </button>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNav } from '@/utils/hooks/useNav'
import { debateCast, buildShopProduct } from './buyDebateData'

const router = useRouter()
const nav = useNav()
const phase = ref<'intro' | 'dialogue' | 'eliminate' | 'result'>('intro')
const currentRound = ref(1)
const roundLabel = ref('选手就位')
const currentSpeaker = ref(0)
const currentLine = ref('欢迎来到选品辩论赛！今天4位选手要争夺你的青睐。')
const progress = ref(10)
const winnerId = ref('')
const messageIndex = ref(1)
const selectedDetail = ref(0)

const cast = debateCast

const script = [
  { speaker: 0, round: 1, label: '选手就位', text: '欢迎来到选品辩论赛！今天4位选手要争夺你的青睐。' },
  { speaker: 0, round: 1, label: '选手入场', text: '大家好，我是阿玛尼丝绒唇釉 #405，今天来证明谁才是真正的王者！' },
  { speaker: 1, round: 1, label: '选手入场', text: '迪奥烈艳蓝金唇膏 #999在此！正红色天花板，质地滋润不卡纹' },
  { speaker: 2, round: 1, label: '选手入场', text: '来了来了～YSL报道！我的柔雾哑光质地可不是吹的。' },
  { speaker: 0, round: 1, label: '第1轮辩论', text: '第1轮辩论开始！' },
  { speaker: 0, round: 1, label: '第1轮辩论', text: '持久度方面，我8小时不脱色，谁能比？' },
  { speaker: 1, round: 1, label: '第1轮辩论', text: '持久归持久，滋润才是王道！我质地滋润不卡纹。' },
  { speaker: 2, round: 1, label: '第1轮辩论', text: '两位都别吵了，复古红棕才是今年的流行趋势。' },
  { speaker: 2, round: 1, label: '剩余 2 位选手', text: '很遗憾，YSL 小金条 #1966本次淘汰。' },
  { speaker: 2, round: 1, label: '剩余 2 位选手', text: '好吧，你们继续，我去性价比赛道等你们 😏' },
  { speaker: 0, round: 2, label: '决赛', text: '经过激烈角逐，最后两位选手进入决赛！' },
  { speaker: 0, round: 2, label: '决赛', text: '最后的对决了。丝绒质地不拔干，#405显白王者色号' },
  { speaker: 1, round: 2, label: '决赛', text: '最后的对决了。正红色天花板，质地滋润不卡纹' },
  { speaker: 0, round: 3, label: '冠军诞生', text: '最终冠军是——阿玛尼 丝绒唇釉 #405！' }
]

const timers: number[] = []

function schedule(fn: () => void, delay: number) {
  const id = window.setTimeout(fn, delay)
  timers.push(id)
}

function clearTimers() {
  while (timers.length) {
    window.clearTimeout(timers.pop())
  }
}

function playScript(index: number) {
  const item = script[index]
  if (!item) {
    winnerId.value = 'a'
    phase.value = 'result'
    progress.value = 100
    return
  }

  currentSpeaker.value = item.speaker
  currentRound.value = item.round
  roundLabel.value = item.label
  currentLine.value = item.text
  messageIndex.value = index + 1
  phase.value = item.label.includes('淘汰') || item.label.includes('剩余') ? 'eliminate' : 'dialogue'
  progress.value = Math.min(96, 10 + Math.round((index / script.length) * 86))

  if (item.label === '冠军诞生') {
    winnerId.value = 'a'
    selectedDetail.value = 0
    schedule(() => {
      phase.value = 'result'
      progress.value = 100
    }, 2200)
    return
  }

  schedule(() => playScript(index + 1), 3000)
}

function goFinalMode() {
  clearTimers()
  winnerId.value = 'a'
  phase.value = 'result'
  progress.value = 100
  router.push('/shop/debate/result')
}

function skipToResult() {
  goFinalMode()
}

function goShopDetail() {
  const winner = cast.find((item) => item.id === 'a') || cast[0]
  const product = buildShopProduct(winner)
  nav('/shop/detail', {}, product)
}

onMounted(() => {
  schedule(() => playScript(0), 500)
})

onBeforeUnmount(() => {
  clearTimers()
})
</script>

<style scoped lang="less">
#BuyDebate {
  min-height: calc(var(--vh, 1vh) * 100);
  padding: 12rem 10rem 86rem;
  box-sizing: border-box;
  color: #fff;
  background:
    radial-gradient(circle at 50% 8%, rgba(255, 114, 86, 0.34), transparent 24%),
    radial-gradient(circle at 12% 34%, rgba(28, 214, 255, 0.18), transparent 22%),
    radial-gradient(circle at 88% 36%, rgba(195, 110, 255, 0.22), transparent 22%),
    linear-gradient(180deg, #11101a 0%, #090a12 62%, #05060b 100%);
  overflow-x: hidden;
  overflow-y: visible;
}

#BuyDebate.result-mode {
  .stage {
    height: 32vh;
    min-height: 230rem;
  }

  .avatar {
    width: 132rem;
    height: 174rem;
  }

  .character {
    bottom: 12rem;
  }
}

.hud {
  display: grid;
  grid-template-columns: 32rem 1fr auto;
  gap: 10rem;
  align-items: center;
  margin-bottom: 8rem;
}

.back {
  width: 32rem;
  height: 32rem;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  display: grid;
  place-items: center;
}

.title {
  font-size: 16rem;
  font-weight: 900;
}

.subtitle {
  margin-top: 2rem;
  font-size: 11rem;
  color: rgba(255, 255, 255, 0.62);
}

.badge {
  padding: 7rem 10rem;
  border-radius: 999rem;
  font-size: 11rem;
  font-weight: 800;
  color: #ffecf1;
  background: linear-gradient(90deg, rgba(255, 138, 101, 0.28), rgba(201, 179, 255, 0.28));
  border: 1rem solid rgba(255, 255, 255, 0.1);
}

.progress {
  height: 5rem;
  border-radius: 999rem;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
  margin-bottom: 10rem;

  i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #ff8a65, #f5b7b1 55%, #c9b3ff);
    transition: width 0.45s ease;
  }
}

.stage {
  position: relative;
  height: 56vh;
  min-height: 380rem;
  margin-bottom: 12rem;
  border-radius: 30rem;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(255, 138, 101, 0.16) 0 1rem, transparent 1rem 18rem),
    radial-gradient(ellipse at 50% 68%, rgba(255, 176, 118, 0.24), transparent 34%),
    radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.14), transparent 30%),
    linear-gradient(180deg, rgba(82, 41, 48, 0.92) 0%, rgba(20, 20, 30, 0.96) 48%, rgba(7, 8, 14, 0.98) 100%);
  border: 1rem solid rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 0 0 1rem rgba(255, 255, 255, 0.04), 0 18rem 50rem rgba(0, 0, 0, 0.34);
}

.light,
.spotlight,
.stage-floor {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.light {
  opacity: 0.82;
  filter: blur(20rem);
}

.light-left {
  background: radial-gradient(circle at 18% 26%, rgba(255, 97, 74, 0.32), transparent 26%);
}

.light-center {
  background: radial-gradient(circle at 50% 18%, rgba(255, 230, 188, 0.34), transparent 24%);
}

.light-right {
  background: radial-gradient(circle at 82% 26%, rgba(125, 95, 255, 0.32), transparent 26%);
}

.spotlight {
  background:
    linear-gradient(112deg, transparent 0 22%, rgba(255, 221, 172, 0.1) 34%, transparent 48%),
    linear-gradient(248deg, transparent 0 22%, rgba(201, 179, 255, 0.12) 34%, transparent 48%);
}

.stage-floor {
  top: auto;
  height: 42%;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(255, 182, 115, 0.22), transparent 62%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(0, 0, 0, 0.42));
  border-top: 1rem solid rgba(255, 255, 255, 0.08);
}

.character {
  position: absolute;
  bottom: 20rem;
  width: 36%;
  display: grid;
  place-items: center;
  text-align: center;
  border: 0;
  background: transparent;
  color: inherit;
  transition: transform 0.45s ease, opacity 0.45s ease, filter 0.45s ease;

  &.pos-0 { left: -1%; }
  &.pos-1 { left: 32%; }
  &.pos-2 { left: 65%; }

  &.active {
    transform: translateY(-14rem) scale(1.08);
    opacity: 1;
    filter: none;
  }

  &.faded {
    opacity: 0.7;
    filter: saturate(0.8);
  }

  &.winner .avatar {
    box-shadow: 0 0 0 2rem rgba(255, 255, 255, 0.22), 0 0 34rem rgba(255, 236, 217, 0.3);
  }
}

.body-wrap {
  position: relative;
}

.halo {
  position: absolute;
  left: 50%;
  bottom: 6rem;
  width: 180rem;
  height: 32rem;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.32), transparent 72%);
  filter: blur(6rem);
  opacity: 0.8;
}

.avatar {
  width: 186rem;
  height: 246rem;
  border-radius: 34rem;
  background: rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 0 0 1rem rgba(255, 255, 255, 0.18), 0 18rem 34rem rgba(0, 0, 0, 0.3);
  display: grid;
  place-items: center;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
}

.label {
  margin-top: 8rem;
  padding: 7rem 12rem;
  border-radius: 999rem;
  background: rgba(0, 0, 0, 0.46);
  font-size: 12rem;
  color: rgba(255, 255, 255, 0.86);
}

.dialogue {
  position: relative;
  padding: 14rem;
  border-radius: 24rem;
  background: rgba(8, 9, 12, 0.72);
  border: 1rem solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14rem);
}

.speaker-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rem;
}

.speaker {
  font-size: 13rem;
  font-weight: 900;
}

.turn {
  font-size: 11rem;
  color: rgba(255, 255, 255, 0.52);
}

.bubble {
  min-height: 70rem;
  padding: 12rem 14rem;
  border-radius: 20rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.05));
  border: 1rem solid rgba(255, 255, 255, 0.08);

  p {
    margin: 0;
    line-height: 1.55;
    font-size: 15rem;
    color: rgba(255, 255, 255, 0.92);
  }
}

.result {
  margin-top: 12rem;
  padding: 16rem;
  border-radius: 20rem;
  background: rgba(6, 7, 12, 0.88);
  border: 1rem solid rgba(255, 255, 255, 0.1);
}

.final-page {
  padding-bottom: 40rem;
}

.recommend-card {
  margin-top: 14rem;
  padding: 16rem;
  border-radius: 24rem;
  background: linear-gradient(180deg, rgba(255, 138, 101, 0.2), rgba(255, 255, 255, 0.06));
  border: 1rem solid rgba(255, 225, 184, 0.22);
  box-shadow: 0 14rem 34rem rgba(0, 0, 0, 0.24);
}

.recommend-kicker {
  margin-bottom: 12rem;
  font-size: 12rem;
  font-weight: 900;
  color: #ffe1b8;
}

.recommend-main {
  display: grid;
  grid-template-columns: 86rem 1fr;
  gap: 14rem;
  align-items: center;
}

.recommend-cover {
  height: 100rem;
  border-radius: 18rem;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.9);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.recommend-brand {
  font-size: 12rem;
  color: rgba(255, 255, 255, 0.64);
}

.recommend-name {
  margin-top: 4rem;
  font-size: 19rem;
  font-weight: 900;
}

.recommend-price {
  margin-top: 6rem;
  font-size: 17rem;
  font-weight: 900;
  color: #ffcf9b;
}

.recommend-line {
  margin-top: 6rem;
  font-size: 12rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.78);
}

.recommend-reasons {
  margin-top: 14rem;
  display: grid;
  gap: 8rem;

  div {
    padding: 9rem 10rem;
    border-radius: 14rem;
    background: rgba(255, 255, 255, 0.08);
    font-size: 12rem;
    line-height: 1.42;
    color: rgba(255, 255, 255, 0.86);
  }
}

.recommend-actions {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 10rem;
  margin-top: 14rem;

  button {
    border: 0;
    border-radius: 16rem;
    padding: 12rem 8rem;
    font-size: 13rem;
    font-weight: 900;
  }
}

.buy-btn {
  color: #1a0d06;
  background: linear-gradient(90deg, #ffb36f, #ffe1b8);
}

.ghost-btn {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.mini-candidates,
.reason-section {
  margin-top: 14rem;
}

.section-heading {
  margin-bottom: 10rem;
  font-size: 14rem;
  font-weight: 900;
}

.reason-item {
  display: flex;
  gap: 8rem;
  align-items: flex-start;
  padding: 10rem 0;
  color: rgba(255, 255, 255, 0.86);
  line-height: 1.45;
  border-bottom: 1rem solid rgba(255, 255, 255, 0.06);

  span {
    color: #81f0bd;
    font-weight: 900;
  }
}

.mini-candidate {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8rem;
  padding: 10rem 12rem;
  border-radius: 16rem;
  border: 1rem solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.05);

  &.active {
    color: #fff;
    border-color: rgba(255, 225, 184, 0.24);
    background: rgba(255, 138, 101, 0.16);
  }

  strong {
    color: #ffcf9b;
  }
}

.recap-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8rem;
  align-items: center;
  padding: 9rem 0;
  border-bottom: 1rem solid rgba(255, 255, 255, 0.06);
}

.recap-round,
.recap-tag {
  padding: 4rem 7rem;
  border-radius: 999rem;
  background: rgba(255, 255, 255, 0.08);
  font-size: 10rem;
  color: rgba(255, 255, 255, 0.72);
}

.recap-text {
  font-size: 12rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.82);
}

.result-btn {
  margin-top: 12rem;
  width: 100%;
  border: 0;
  border-radius: 16rem;
  padding: 12rem;
  color: #fff;
  background: linear-gradient(90deg, #ff8a65, #c9b3ff);
  font-weight: 900;
}

.sticky-next {
  position: fixed;
  left: 50%;
  bottom: 18rem;
  z-index: 20;
  transform: translateX(-50%);
  width: min(320rem, calc(100vw - 44rem));
  border: 0;
  border-radius: 999rem;
  padding: 14rem 18rem;
  color: #1b0d07;
  background: linear-gradient(90deg, #ff9b6c, #ffe1b8);
  box-shadow: 0 12rem 30rem rgba(0, 0, 0, 0.36);
  font-size: 15rem;
  font-weight: 900;
}
</style>
