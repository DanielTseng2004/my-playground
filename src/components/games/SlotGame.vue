<template>
  <div class="game-container slot-game">
    <div class="slot-machine">
      <div class="reels">
        <div v-for="(reel, index) in reels" :key="index" class="reel" :class="{ spinning: spinning }">
          <div class="symbol">{{ reel }}</div>
        </div>
      </div>
    </div>
    
    <div class="controls">
      <n-button type="primary" size="large" :loading="spinning" @click="spin">
        {{ spinning ? '旋轉中...' : '拉霸！' }}
      </n-button>
    </div>

    <transition name="result-fade">
      <div v-if="result" class="result" :class="getResultClass()">
        <div class="result-icon">{{ getResultIcon() }}</div>
        <h2>{{ result }}</h2>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NButton } from 'naive-ui';

const symbols = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣'];
const reels = ref(['?', '?', '?']);
const spinning = ref(false);
const result = ref('');

function spin() {
  if (spinning.value) return;
  
  spinning.value = true;
  result.value = '';
  
  let count = 0;
  const interval = setInterval(() => {
    reels.value = reels.value.map(() => symbols[Math.floor(Math.random() * symbols.length)]);
    count++;
    if (count > 20) {
      clearInterval(interval);
      spinning.value = false;
      checkWin();
    }
  }, 50);
}

function checkWin() {
  if (reels.value[0] === reels.value[1] && reels.value[1] === reels.value[2]) {
    result.value = '恭喜中大獎！';
  } else if (reels.value[0] === reels.value[1] || reels.value[1] === reels.value[2] || reels.value[0] === reels.value[2]) {
    result.value = '小獎！';
  } else {
    result.value = '再試一次！';
  }
}

function getResultClass() {
  if (result.value.includes('大獎')) return 'jackpot';
  if (result.value.includes('小獎')) return 'win';
  return 'lose';
}

function getResultIcon() {
  if (result.value.includes('大獎')) return '🎉';
  if (result.value.includes('小獎')) return '😊';
  return '😅';
}
</script>

<style scoped>
.slot-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  padding: 40px;
}

.slot-machine {
  perspective: 1000px;
}

.reels {
  display: flex;
  gap: 20px;
  background: linear-gradient(135deg, #333, #222);
  padding: 20px;
  border-radius: 15px;
  border: 5px solid #ffd700;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3), inset 0 2px 5px rgba(255, 255, 255, 0.1);
}

.reel {
  width: 100px;
  height: 100px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 50px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.reel.spinning {
  animation: reelSpin 0.1s linear;
  filter: blur(2px);
}

.symbol {
  animation: symbolBounce 0.3s ease;
}

.result {
  text-align: center;
  padding: 20px 40px;
  border-radius: 12px;
  animation: resultPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.result.jackpot {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  border: 3px solid #ff6b6b;
  box-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
}

.result.win {
  background: linear-gradient(135deg, #d4edda, #c3f7d2);
  border: 2px solid #52c41a;
}

.result.lose {
  background: linear-gradient(135deg, #e2e3e5, #d6d8db);
  border: 2px solid #666;
}

.result-icon {
  font-size: 50px;
  margin-bottom: 10px;
  animation: bounce 0.6s ease infinite;
}

.result h2 {
  margin: 0;
  font-size: 24px;
}

@keyframes reelSpin {
  0% { transform: rotateX(0deg); }
  100% { transform: rotateX(360deg); }
}

@keyframes symbolBounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes resultPop {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.result-fade-enter-active,
.result-fade-leave-active {
  transition: all 0.4s ease;
}

.result-fade-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .slot-game {
    padding: 15px;
  }

  .reels {
    gap: 8px;
  }

  .reel {
    width: 70px;
    height: 70px;
    font-size: 36px;
    border-radius: 8px;
  }

  .result {
    padding: 15px 30px;
  }

  .result h2 {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .slot-game {
    padding: 10px;
    gap: 10px;
  }

  .reels {
    gap: 5px;
  }

  .reel {
    width: 55px;
    height: 55px;
    font-size: 28px;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .result {
    margin-top: 15px;
    padding: 12px 20px;
    border-radius: 8px;
  }

  .result-icon {
    font-size: 36px;
    margin-bottom: 8px;
  }

  .result h2 {
    font-size: 18px;
  }

  .controls {
    flex-direction: column;
    gap: 8px;
  }

  .controls button {
    width: 100%;
  }
}
</style>
