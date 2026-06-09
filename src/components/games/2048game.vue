<template>
  <div
    class="game-2048"
    ref="gameContainer"
  >
    <div class="score-board">
      <div class="score-box">
        <span class="label">SCORE</span>
        <span class="value">{{ score }}</span>
      </div>
      <div class="score-box">
        <span class="label">BEST</span>
        <span class="value">{{ bestScore }}</span>
      </div>
    </div>

    <div class="grid-container">
      <div
        class="grid-row"
        v-for="r in 4"
        :key="'row-' + r"
      >
        <div
          class="grid-cell"
          v-for="c in 4"
          :key="'cell-' + c"
        ></div>
      </div>

      <div
        v-for="tile in tiles"
        :key="tile.id"
        class="tile"
        :class="[
          `tile-${tile.value}`,
          {
            'tile-new': tile.isNew,
            'tile-merged': tile.isMerged,
            'tile-to-remove': tile.toRemove,
          },
        ]"
        :style="getTileStyle(tile)"
      >
        <div class="tile-inner">{{ tile.value }}</div>
      </div>

      <transition name="fade">
        <div
          v-if="gameOver"
          class="game-over-overlay"
        >
          <h2>Game Over!</h2>
          <n-button
            type="primary"
            size="large"
            @click="initGame"
            >再試一次</n-button
          >
        </div>
      </transition>
    </div>

    <div class="instructions">
      <p>使用 <b>方向鍵</b> 或在手機上 <b>滑動螢幕</b> 來移動方塊！</p>
      <n-button
        class="reset-btn"
        type="warning"
        @click="initGame"
        >重新開始</n-button
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { NButton } from "naive-ui";

interface Tile {
  id: number;
  row: number;
  col: number;
  value: number;
  isNew: boolean;
  isMerged: boolean;
  toRemove: boolean; // 新增：標記此方塊是否正在動畫中，播完後移除
}

const score = ref(0);
const bestScore = ref(Number(localStorage.getItem("2048_best") || 0));
const tiles = ref<Tile[]>([]);
const gameOver = ref(false);
const gameContainer = ref<HTMLElement | null>(null);

let tileIdCounter = 0;
let isMoving = false; // 防止動畫未結束時玩家連續點擊導致邏輯錯亂

function initGame() {
  score.value = 0;
  tiles.value = [];
  gameOver.value = false;
  isMoving = false;
  addRandomTile();
  addRandomTile();
}

function addRandomTile() {
  // 只篩選沒有被標記移除的實體方塊
  const activeTiles = tiles.value.filter((t) => !t.toRemove);
  const occupied = new Set(activeTiles.map((t) => `${t.row}-${t.col}`));
  const empties: { row: number; col: number }[] = [];

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!occupied.has(`${r}-${c}`)) {
        empties.push({ row: r, col: c });
      }
    }
  }

  if (empties.length > 0) {
    const { row, col } = empties[Math.floor(Math.random() * empties.length)];
    tiles.value.push({
      id: tileIdCounter++,
      row,
      col,
      value: Math.random() < 0.9 ? 2 : 4,
      isNew: true,
      isMerged: false,
      toRemove: false,
    });
  }
}

function getTileStyle(tile: Tile) {
  return {
    transform: `translate(${tile.col * 100}%, ${tile.row * 100}%)`,
    zIndex: tile.toRemove ? 5 : tile.isMerged ? 12 : 10,
  };
}

function move(direction: "up" | "down" | "left" | "right") {
  if (gameOver.value || isMoving) return;

  // 1. 先清理上一輪的動畫標籤，並移除真正該消失的方塊
  tiles.value = tiles.value.filter((t) => !t.toRemove);
  tiles.value.forEach((t) => {
    t.isNew = false;
    t.isMerged = false;
  });

  let moved = false;
  isMoving = true;

  // 2. 建立方向向量
  const isVertical = direction === "up" || direction === "down";
  const isForward = direction === "down" || direction === "right";

  // 外層迴圈：逐行/逐列處理
  for (let i = 0; i < 4; i++) {
    // 抓出當前線上的活躍方塊
    let lineTiles = tiles.value.filter(
      (t) => (isVertical ? t.col : t.row) === i,
    );

    // 排序：確保越靠近移動方向邊緣的方塊先處理
    lineTiles.sort((a, b) => {
      const posA = isVertical ? a.row : a.col;
      const posB = isVertical ? b.row : b.col;
      return isForward ? posB - posA : posA - posB;
    });

    // 模擬這條線上的移動與合併邏輯
    let nextAvailablePos = isForward ? 3 : 0;
    let lastMergedTile: Tile | null = null;

    for (let j = 0; j < lineTiles.length; j++) {
      const current = lineTiles[j];
      const currentPos = isVertical ? current.row : current.col;

      // 尋找前方是否有可以合併的方塊
      // 條件：必須與上一個處理的方塊相鄰、數值相同、且上一個方塊這一步還沒合併過
      if (
        lastMergedTile &&
        lastMergedTile.value === current.value &&
        !lastMergedTile.isMerged
      ) {
        // 發生合併！
        current.toRemove = true; // 標記這個移動過去的方塊等一下要被銷毀
        if (isVertical) {
          current.row = lastMergedTile.row;
        } else {
          current.col = lastMergedTile.col;
        }

        // 升級留下來的那個方塊
        lastMergedTile.value *= 2;
        lastMergedTile.isMerged = true;

        score.value += lastMergedTile.value;
        if (score.value > bestScore.value) {
          bestScore.value = score.value;
          localStorage.setItem("2048_best", String(score.value));
        }

        lastMergedTile = null; // 該位置已閉合，下一個方塊不能再疊上來
        moved = true;
      } else {
        // 沒有合併，單純推擠到下一個空位
        if (currentPos !== nextAvailablePos) {
          if (isVertical) {
            current.row = nextAvailablePos;
          } else {
            current.col = nextAvailablePos;
          }
          moved = true;
        }

        // 記錄這個方塊，作為下一個方塊比對合併的對象
        lastMergedTile = current;
        // 更新下一個空位型態
        isForward ? nextAvailablePos-- : nextAvailablePos++;
      }
    }
  }

  // 3. 延遲處理：等待 CSS 平移過渡（0.15秒）完成後，再更新資料狀態
  if (moved) {
    setTimeout(() => {
      // 移除殘影，留下合併後的實體
      tiles.value = tiles.value.filter((t) => !t.toRemove);
      addRandomTile();
      checkGameOver();
      isMoving = false;
    }, 150); // 這裡的毫秒數必須與 CSS transition 的時間嚴格對齊
  } else {
    isMoving = false;
  }
}

function checkGameOver() {
  const activeTiles = tiles.value.filter((t) => !t.toRemove);
  if (activeTiles.length < 16) return;

  const grid = Array(4)
    .fill(null)
    .map(() => Array(4).fill(0));
  activeTiles.forEach((t) => (grid[t.row][t.col] = t.value));

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (r < 3 && grid[r][c] === grid[r + 1][c]) return;
      if (c < 3 && grid[r][c] === grid[r][c + 1]) return;
    }
  }
  gameOver.value = true;
}

function handleKeyDown(e: KeyboardEvent) {
  if (["ArrowUp", "KeyW"].includes(e.code)) {
    e.preventDefault();
    move("up");
  } else if (["ArrowDown", "KeyS"].includes(e.code)) {
    e.preventDefault();
    move("down");
  } else if (["ArrowLeft", "KeyA"].includes(e.code)) {
    e.preventDefault();
    move("left");
  } else if (["ArrowRight", "KeyD"].includes(e.code)) {
    e.preventDefault();
    move("right");
  }
}

let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}

function handleTouchEnd(e: TouchEvent) {
  const diffX = e.changedTouches[0].clientX - touchStartX;
  const diffY = e.changedTouches[0].clientY - touchStartY;

  if (Math.max(Math.abs(diffX), Math.abs(diffY)) < 30) return;

  if (Math.abs(diffX) > Math.abs(diffY)) {
    move(diffX > 0 ? "right" : "left");
  } else {
    move(diffY > 0 ? "down" : "up");
  }
}

onMounted(() => {
  initGame();
  window.addEventListener("keydown", handleKeyDown);
  if (gameContainer.value) {
    gameContainer.value.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    gameContainer.value.addEventListener("touchend", handleTouchEnd, {
      passive: true,
    });
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<style scoped>
.game-2048 {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  user-select: none;
}

.score-board {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  width: 100%;
  justify-content: flex-end;
}

.score-box {
  background: #bbada0;
  padding: 6px 16px;
  border-radius: 6px;
  text-align: center;
  min-width: 70px;
}

.score-box .label {
  display: block;
  font-size: 11px;
  color: #eee4da;
  font-weight: bold;
}

.score-box .value {
  font-size: 20px;
  color: white;
  font-weight: bold;
}

.grid-container {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  background: #bbada0;
  border-radius: 8px;
  box-sizing: border-box;
}

.grid-row {
  position: absolute;
  display: flex;
  width: 100%;
  height: 25%;
}
.grid-row:nth-child(1) {
  top: 0;
}
.grid-row:nth-child(2) {
  top: 25%;
}
.grid-row:nth-child(3) {
  top: 50%;
}
.grid-row:nth-child(4) {
  top: 75%;
}

.grid-cell {
  width: 25%;
  height: 100%;
  border: 6px solid #bbada0;
  background: rgba(238, 228, 218, 0.35);
  border-radius: 6px;
  box-sizing: border-box;
}

/* 核心優化：方塊基礎樣式與過渡效果分離 */
.tile {
  position: absolute;
  width: 25%;
  height: 25%;
  padding: 6px;
  box-sizing: border-box;
  /* 絲滑移動的關鍵：只對 transform 做 0.15s 的動畫 */
  transition: transform 0.15s ease-in-out;
}

.tile-inner {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  background: #eee4da;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
  color: #776e65;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 用過濾隱藏即將被銷毀的方塊文字，但保持方塊外形移動 */
.tile-to-remove {
  opacity: 0;
  transition:
    transform 0.15s ease-in-out,
    opacity 0.1s ease-in-out;
}

/* 2048 配色 */
.tile-2 .tile-inner {
  background: #eee4da;
}
.tile-4 .tile-inner {
  background: #ede0c8;
}
.tile-8 .tile-inner {
  background: #f2b179;
  color: #f9f6f2;
}
.tile-16 .tile-inner {
  background: #f59563;
  color: #f9f6f2;
}
.tile-32 .tile-inner {
  background: #f67c5f;
  color: #f9f6f2;
}
.tile-64 .tile-inner {
  background: #f65e3b;
  color: #f9f6f2;
}
.tile-128 .tile-inner {
  background: #edcf72;
  color: #f9f6f2;
  font-size: 24px;
}
.tile-256 .tile-inner {
  background: #edcc61;
  color: #f9f6f2;
  font-size: 24px;
}
.tile-512 .tile-inner {
  background: #edc850;
  color: #f9f6f2;
  font-size: 24px;
}
.tile-1024 .tile-inner {
  background: #edc53f;
  color: #f9f6f2;
  font-size: 20px;
}
.tile-2048 .tile-inner {
  background: #edc22e;
  color: #f9f6f2;
  font-size: 20px;
  box-shadow: 0 0 12px #edc22e;
}

/* 縮放動畫 */
.tile-new .tile-inner {
  animation: popIn 0.2s ease-in-out forwards;
}
.tile-merged .tile-inner {
  animation: pulse 0.15s ease-in-out forwards;
}

@keyframes popIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.18);
  }
  100% {
    transform: scale(1);
  }
}

.game-over-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(238, 228, 218, 0.73);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: 8px;
}

.game-over-overlay h2 {
  font-size: 40px;
  color: #776e65;
  margin-bottom: 20px;
}

.instructions {
  margin-top: 20px;
  text-align: center;
  color: #776e65;
  font-size: 14px;
}

.reset-btn {
  margin-top: 10px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
