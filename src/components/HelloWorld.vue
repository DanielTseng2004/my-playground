<script setup lang="ts">
import { NCard, NButton, NSpace, NGradientText } from "naive-ui";
</script>

<template>
  <div class="playground-container">
    <div class="glass-card-wrapper">
      <n-card class="glass-card">
        <div class="content">
          <n-gradient-text
            type="info"
            :size="56"
            weight="800"
            class="title-text"
          >
            數位遊樂場
          </n-gradient-text>
          <p class="description">
            歡迎來到您的個人創意空間。在這裡，您可以探索、實驗並打造屬於您的數位世界。
          </p>
          <n-space
            justify="center"
            class="actions"
          >
            <n-button
              type="primary"
              size="large"
              round
              class="primary-btn"
              to="/games"
            >
              開始探索
            </n-button>
            <n-button
              size="large"
              round
              secondary
              class="secondary-btn"
            >
              瞭解更多
            </n-button>
          </n-space>
        </div>
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.playground-container {
  width: 100%;
  min-height: 85vh;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 調整背景色，增加對比度 */
  background: linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%);
  border-radius: 0; /* 撐滿寬度，取消圓角 */
  margin: 0;
  overflow: hidden;
  position: relative;
}

.playground-container::before {
  content: "";
  position: absolute;
  width: 400px;
  height: 400px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  top: -150px;
  right: -100px;
  animation: float 12s infinite alternate;
}

.playground-container::after {
  content: "";
  position: absolute;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  bottom: -100px;
  left: -50px;
  animation: float 10s infinite alternate-reverse;
}

@keyframes float {
  from {
    transform: translateY(0) scale(1);
  }
  to {
    transform: translateY(60px) scale(1.1);
  }
}

.glass-card-wrapper {
  perspective: 1000px;
  z-index: 1;
  width: 90%;
  max-width: 800px;
}

.glass-card {
  background: rgba(
    255,
    255,
    255,
    0.15
  ) !important; /* 降低背景透明度以增加對比 */
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  border-radius: 32px !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3) !important;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.glass-card:hover {
  transform: translateY(-15px);
  background: rgba(255, 255, 255, 0.2) !important;
}

.content {
  text-align: center;
  padding: 60px 40px;
}

.title-text {
  /* 增加文字陰影提升可讀性 */
  color: #ffffff;
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  margin-bottom: 20px;
}

.description {
  font-size: 1.4rem;
  /* 使用純白並增加文字陰影 */
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  margin: 30px 0 50px;
  line-height: 1.8;
  font-weight: 500;
}

.primary-btn {
  padding: 0 40px !important;
  height: 50px !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.secondary-btn {
  padding: 0 40px !important;
  height: 50px !important;
  font-weight: 600 !important;
  background-color: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
}
</style>
