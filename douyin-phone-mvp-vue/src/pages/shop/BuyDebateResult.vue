<template>
  <div id="BuyDebateResult" class="base-page">
    <header class="hud">
      <button class="back" @click="router.back()">
        <Icon icon="material-symbols-light:arrow-back-ios-new" />
      </button>
      <div class="meta">
        <div class="title">最终推荐</div>
        <div class="subtitle">辩论已结束 · 推荐结果已生成</div>
      </div>
      <div class="badge">AI 裁判</div>
    </header>

    <div class="result-shell">
      <div class="result-crown">冠军诞生</div>
      <div class="champion-card">
        <div class="champion-icon">🏆</div>
        <div class="champion-name">{{ winner.name }}</div>
        <div class="champion-brand">{{ winner.brand }} · {{ winner.source }}</div>
        <div class="champion-price">{{ winner.price }}</div>
        <div class="champion-match">
          <div class="champion-match-bar"><i :style="{ width: winner.match + '%' }"></i></div>
          <span>匹配度 {{ winner.match }}%</span>
        </div>
        <div class="champion-specs">
          <span v-for="item in winner.specs" :key="item">{{ item }}</span>
        </div>
      </div>

      <div class="recommend-card">
        <div class="recommend-kicker">最终推荐商品</div>
        <div class="recommend-main">
          <div class="recommend-cover">
            <img :src="winner.image" :alt="winner.name" />
          </div>
          <div class="recommend-info">
            <div class="recommend-brand">{{ winner.brand }}</div>
            <div class="recommend-name">{{ winner.name }}</div>
            <div class="recommend-price">{{ winner.price }}</div>
            <div class="recommend-line">{{ winner.argument }}</div>
          </div>
        </div>

        <div class="recommend-reasons">
          <div v-for="item in winner.reasons.slice(0, 3)" :key="item">{{ item }}</div>
        </div>

        <div class="recommend-actions">
          <button class="buy-btn" @click="goShopDetail">去抖音商城看看</button>
          <button class="ghost-btn" @click="showReason = !showReason">查看推荐依据</button>
        </div>

        <div class="mini-candidates">
          <div class="section-heading">其他候选也可选</div>
          <div class="mini-candidate" v-for="item in cast" :key="item.id" :class="{ active: winner.id === item.id }">
            <span>{{ item.brand }}</span>
            <strong>{{ item.match }}%</strong>
          </div>
        </div>

        <div class="reason-section" v-if="showReason">
          <div class="section-heading">为什么推荐它</div>
          <div class="reason-item" v-for="item in winner.reasons" :key="item">
            <span>✓</span>{{ item }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNav } from '@/utils/hooks/useNav'
import { debateCast, buildShopProduct } from './buyDebateData'

const router = useRouter()
const nav = useNav()
const showReason = ref(false)
const cast = debateCast
const winner = computed(() => cast[0])

function goShopDetail() {
  nav('/shop/detail', {}, buildShopProduct(winner.value))
}
</script>

<style scoped lang="less">
@import '@/assets/less/index.less';

#BuyDebateResult {
  min-height: calc(var(--vh, 1vh) * 100);
  padding: 12rem 10rem 28rem;
  box-sizing: border-box;
  color: #fff;
  background:
    radial-gradient(circle at 50% 8%, rgba(255, 114, 86, 0.34), transparent 24%),
    radial-gradient(circle at 12% 34%, rgba(28, 214, 255, 0.18), transparent 22%),
    radial-gradient(circle at 88% 36%, rgba(195, 110, 255, 0.22), transparent 22%),
    linear-gradient(180deg, #11101a 0%, #090a12 62%, #05060b 100%);
}

.hud {
  display: grid;
  grid-template-columns: 32rem 1fr auto;
  gap: 10rem;
  align-items: center;
  margin-bottom: 10rem;
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

.result-shell {
  padding-bottom: 20rem;
}

.result-crown {
  margin: 10rem 0 12rem;
  font-size: 13rem;
  font-weight: 900;
  color: #ffe1b8;
}

.champion-card {
  padding: 16rem;
  border-radius: 20rem;
  background: rgba(6, 7, 12, 0.88);
  border: 1rem solid rgba(255, 255, 255, 0.1);
}

.champion-icon {
  font-size: 30rem;
}

.champion-name {
  margin-top: 10rem;
  font-size: 20rem;
  font-weight: 900;
}

.champion-brand,
.champion-price,
.champion-match {
  margin-top: 8rem;
  color: rgba(255, 255, 255, 0.8);
}

.champion-price {
  color: #ffcf9b;
  font-weight: 900;
}

.champion-match-bar {
  margin: 8rem 0 6rem;
  height: 6rem;
  border-radius: 999rem;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);

  i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #ff8a65, #f5b7b1 55%, #c9b3ff);
  }
}

.champion-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 8rem;
  margin-top: 12rem;

  span {
    padding: 6rem 10rem;
    border-radius: 999rem;
    background: rgba(255, 255, 255, 0.08);
    font-size: 11rem;
  }
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
</style>
