<script setup lang="ts">
import { defineAsyncComponent, ref, markRaw, computed } from "vue";
import { NTabs, NTabPane } from "naive-ui";

// 定義遊戲陣列
const gameTabs = [
  {
    key: "puzzle",
    icon: "🧩",
    label: "數字華容道",
    desc: "移動方塊，將混亂的數字恢復順序。",
    color: "#3498db",
    component: defineAsyncComponent(() => import("./games/NumberPuzzle.vue")),
  },
  {
    key: "blackjack",
    icon: "🃏",
    label: "Blackjack",
    desc: "經典21點，考驗你的運氣與策略！",
    color: "#2c3e50",
    component: defineAsyncComponent(() => import("./games/BlackjackGame.vue")),
  },
  {
    key: "slot",
    icon: "🎰",
    label: "Slot",
    desc: "試試你的好運氣，拉下搖桿轉出大獎！",
    color: "#e74c3c",
    component: defineAsyncComponent(() => import("./games/SlotGame.vue")),
  },
  {
    key: "texas",
    icon: "♠️",
    label: "Texas",
    desc: "德州撲克心理戰，頂尖對決一觸即發。",
    color: "#27ae60",
    component: defineAsyncComponent(() => import("./games/TexasGame.vue")),
  },
  {
    key: "ttt",
    icon: "❌",
    label: "TTT",
    desc: "圈圈叉叉，最經典也最耐玩的雙人對弈。",
    color: "#f1c40f",
    component: defineAsyncComponent(() => import("./games/TTTGame.vue")),
  },
  {
    key: "wordle",
    icon: "📝",
    label: "Wordle",
    desc: "每日猜單字，挑戰你的英文單字庫！",
    color: "#8e44ad",
    component: defineAsyncComponent(() => import("./games/WordleGame.vue")),
  },
  {
    key: "m2048",
    icon: "🔢",
    label: "2048",
    desc: "滑動方塊，拼湊出終極數字 2048！",
    color: "#edc22e",
    component: defineAsyncComponent(() => import("./games/2048game.vue")),
  },
  {
    key: "minesweeper",
    icon: "💣",
    label: "踩地雷",
    desc: "步步驚心！運用邏輯找出所有地雷。",
    color: "#95a5a6",
    component: defineAsyncComponent(() => import("./games/MinesweeperGame.vue")),
  },
  {
    key: "gomoku",
    icon: "⚪",
    label: "五子棋",
    desc: "黑白對弈，先連成五子者勝，考驗你的大局觀。",
    color: "#dcb35c",
    component: defineAsyncComponent(() => import("./games/GomokuGame.vue")),
  },
  {
    key: "solitaire",
    icon: "🃏",
    label: "接龍",
    desc: "經典撲克牌接龍，考驗你的邏輯與耐心。",
    color: "#1a5f3f",
    component: defineAsyncComponent(() => import("./games/SolitaireGame.vue")),
  },
];

const activeTab = ref("puzzle");

const currentTabInfo = computed(() => {
  return gameTabs.find((tab) => tab.key === activeTab.value) || gameTabs[0];
});
</script>

<template>
  <div class="game-page-full">
    <div class="header-section">
      <transition name="header-fade" mode="out-in">
        <div :key="activeTab" class="header-content">
          <div class="icon-circle" :style="{ background: currentTabInfo.color }">
            {{ currentTabInfo.icon }}
          </div>
          <h1>{{ currentTabInfo.label }}</h1>
          <p>{{ currentTabInfo.desc }}</p>
        </div>
      </transition>
    </div>

    <div class="tabs-container">
      <n-tabs
        v-model:value="activeTab"
        type="line"
        size="large"
        justify-content="center"
        class="custom-tabs"
      >
        <n-tab-pane
          v-for="tab in gameTabs"
          :key="tab.key"
          :name="tab.key"
        >
          <template #tab>
            <div class="tab-trigger">
              <span class="tab-icon">{{ tab.icon }}</span>
              <span class="tab-label">{{ tab.label }}</span>
            </div>
          </template>

          <div class="play-area">
            <transition name="fade-slide" mode="out-in" appear>
              <div :key="tab.key" class="game-card-wrapper">
                <component :is="markRaw(tab.component)" />
              </div>
            </transition>
          </div>
        </n-tab-pane>
      </n-tabs>
    </div>
  </div>
</template>

<style scoped>
.game-page-full {
  width: 100%;
  min-height: 100vh;
  background-color: #f0f2f5;
  padding-bottom: 60px;
}

.header-section {
  padding: 40px 20px;
  text-align: center;
  background: white;
  margin-bottom: 2px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}

.header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  margin-bottom: 16px;
  color: white;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.header-content h1 {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 8px;
  color: #1a1a1a;
}

.header-content p {
  color: #666;
  font-size: 16px;
  max-width: 600px;
}

.tabs-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.custom-tabs :deep(.n-tabs-nav) {
  background: transparent;
  padding: 10px 0;
}

.tab-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  transition: transform 0.2s ease;
}

.tab-trigger:hover {
  transform: translateY(-2px);
}

.tab-icon {
  font-size: 24px;
}

.tab-label {
  font-size: 13px;
  font-weight: 600;
}

.play-area {
  margin-top: 30px;
  width: 100%;
  display: flex;
  justify-content: center;
}

.game-card-wrapper {
  width: 100%;
  max-width: 1000px;
  background: white;
  padding: 30px;
  border-radius: 24px;
  box-shadow: 0 15px 45px rgba(0, 0, 0, 0.05);
}

/* Header 切換動畫 */
.header-fade-enter-active,
.header-fade-leave-active {
  transition: all 0.3s ease;
}

.header-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.header-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 複寫全域 fade-slide 確保在組件內運作良好 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: scale(0.98) translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: scale(1.02) translateY(-10px);
}
</style>
