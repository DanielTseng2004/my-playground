<template>
  <div class="puzzle-game">
    <!-- 說明 + 統計：在棋盤上方，手機直排，桌機並排 -->
    <div class="meta-row">
      <div class="meta-card instructions-card">
        <h3 class="card-title">遊戲說明</h3>
        <p><strong>目標：</strong>將所有方塊排列成 1–15 的順序，空白位置在右下角</p>
        <p><strong>操作：</strong>點擊與空白相鄰的方塊移動</p>
      </div>

      <div class="meta-card stats-card">
        <h3 class="card-title">遊戲統計</h3>
        <div class="stat-row">
          <span class="stat-label">移動次數</span>
          <span class="stat-value">{{ moves }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">用時</span>
          <span class="stat-value">{{ formatTime(elapsedTime) }}</span>
        </div>
        <div class="btn-wrap">
          <button v-if="!isGameWon" class="btn-primary" @click="shuffleBoard">
            {{ isGameStarted ? '重新開始' : '開始遊戲' }}
          </button>
          <button v-else class="btn-success" @click="shuffleBoard">🎉 再來一局</button>
        </div>
      </div>
    </div>

    <!-- 棋盤區：固定正方形，CSS Grid 撐格子 -->
    <div class="board-center">
      <div class="puzzle-board">
        <div
          v-for="(tile, index) in board"
          :key="`tile-${index}`"
          class="tile-slot"
          :class="{ empty: tile === null }"
          @click="handleTileClick(index)"
          @touchend.prevent="handleTileClick(index)"
        >
          <div
            v-if="tile !== null"
            class="tile"
            :class="{
              correct: isCorrectPosition(tile, index),
              moving: movingTile === tile,
            }"
          >{{ tile }}</div>
        </div>
      </div>
    </div>

    <!-- 勝利覆蓋層 -->
    <transition name="celebration">
      <div v-if="isGameWon" class="win-overlay">
        <div class="win-message">
          <span class="win-icon bounce">🏆</span>
          <p class="win-text">恭喜！你完成了！</p>
          <p class="win-stats">{{ moves }} 步 · {{ formatTime(elapsedTime) }}</p>
          <button class="btn-success" style="margin-top:16px" @click="shuffleBoard">🎉 再來一局</button>
        </div>
        <span
          v-for="i in 30"
          :key="`confetti-${i}`"
          class="confetti"
          :style="confettiStyle(i)"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// ── 棋盤邏輯（不變）────────────────────────────────────────
const board         = ref<(number | null)[]>([]);
const moves         = ref(0);
const elapsedTime   = ref(0);
const isGameStarted = ref(false);
const isGameWon     = ref(false);
const movingTile    = ref<number | null>(null);
let gameTimer: ReturnType<typeof setInterval> | null = null;

const confettiData = Array.from({ length: 30 }, () => ({
  left:     Math.random() * 100,
  color:    `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`,
  size:     6 + Math.floor(Math.random() * 8),
  delay:    Math.random() * 1.5,
  duration: 2.5 + Math.random() * 2,
}));

function confettiStyle(i: number) {
  const d = confettiData[i - 1];
  return {
    left:              `${d.left}%`,
    background:        d.color,
    width:             `${d.size}px`,
    height:            `${d.size}px`,
    animationDelay:    `${d.delay}s`,
    animationDuration: `${d.duration}s`,
  };
}

function initializeBoard() {
  board.value = [...Array.from({ length: 15 }, (_, i) => i + 1), null];
}

function shuffleBoard() {
  initializeBoard();
  let cur = 15;
  for (let i = 0; i < 200; i++) {
    const nb = getNeighbors(cur);
    const rn = nb[Math.floor(Math.random() * nb.length)];
    [board.value[cur], board.value[rn]] = [board.value[rn], board.value[cur]];
    cur = rn;
  }
  moves.value         = 0;
  elapsedTime.value   = 0;
  isGameStarted.value = true;
  isGameWon.value     = false;
  if (gameTimer) clearInterval(gameTimer);
  gameTimer = setInterval(() => elapsedTime.value++, 1000);
}

function getNeighbors(index: number) {
  const n: number[] = [], r = Math.floor(index / 4), c = index % 4;
  if (r > 0) n.push(index - 4);
  if (r < 3) n.push(index + 4);
  if (c > 0) n.push(index - 1);
  if (c < 3) n.push(index + 1);
  return n;
}

function handleTileClick(index: number) {
  if (!isGameStarted.value || isGameWon.value) return;
  const emptyIndex = board.value.indexOf(null);
  if (getNeighbors(emptyIndex).includes(index)) {
    movingTile.value = board.value[index];
    [board.value[index], board.value[emptyIndex]] = [board.value[emptyIndex], board.value[index]];
    moves.value++;
    setTimeout(() => (movingTile.value = null), 300);
    checkWin();
  }
}

function checkWin() {
  if (board.value[15] === null && board.value.slice(0, 15).every((t, i) => t === i + 1)) {
    isGameWon.value = true;
    if (gameTimer) { clearInterval(gameTimer); gameTimer = null; }
  }
}

function isCorrectPosition(tile: number | null, index: number): boolean {
  return tile !== null && tile === index + 1;
}

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

onMounted(() => initializeBoard());
onUnmounted(() => {
  if (gameTimer) clearInterval(gameTimer);
});
</script>

<style scoped>
/* ── 根容器 ───────────────────────────────────────────────── */
.puzzle-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
}

/* ── 說明 + 統計並排列 ─────────────────────────────────────── */
.meta-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.meta-card {
  flex: 1;
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  box-sizing: border-box;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: #333;
  margin: 0 0 10px;
}

.meta-card p {
  font-size: 12px;
  color: #555;
  margin: 4px 0;
  line-height: 1.5;
}

/* ── 統計 ───────────────────────────────────────────────────── */
.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}

.stat-label { color: #888; }
.stat-value { font-weight: 700; color: #333; }

.btn-wrap {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}

/* ── 按鈕 ───────────────────────────────────────────────────── */
.btn-primary,
.btn-success {
  border: none;
  border-radius: 999px;
  padding: 8px 22px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}
.btn-primary:active,
.btn-success:active { transform: scale(0.96); }

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
}
.btn-success {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: #fff;
}

/* ── 棋盤置中容器 ──────────────────────────────────────────── */
.board-center {
  width: 100%;
  display: flex;
  justify-content: center;
}

/* ── 棋盤：純 CSS，不依賴 JS 注入尺寸 ─────────────────────── */
.puzzle-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 12px;
  background: rgba(255,255,255,0.85);
  border-radius: 18px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  /* 棋盤寬度撐滿父容器（.puzzle-game 已限 max-width 480px） */
  width: 100%;
  box-sizing: border-box;
}

/* ── 格子：用 aspect-ratio 保持正方形，不需 JS ──────────────── */
.tile-slot {
  aspect-ratio: 1;
  background: #efefef;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  transition: background 0.15s;
}

.tile-slot:hover:not(.empty) { background: #e8e8e8; }

.tile-slot.empty {
  background: rgba(0,0,0,0.06);
  cursor: default;
}

/* ── 數字方塊 ─────────────────────────────────────────────── */
.tile {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 700;
  /* clamp 直接用 vw 作為流動字體，無需 JS */
  font-size: clamp(14px, 5vw, 26px);
  border-radius: 10px;
  pointer-events: none;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.25s ease;
  box-shadow: 0 3px 12px rgba(102,126,234,0.4);
}

.tile.correct {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  box-shadow: 0 3px 12px rgba(82,196,26,0.4);
  animation: correctTile 0.5s ease;
}

.tile.moving { animation: tileMove 0.25s ease; }

/* ── 勝利覆蓋層 ───────────────────────────────────────────── */
.win-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.45);
  z-index: 1000;
  overflow: hidden;
}

.win-message {
  background: #fff;
  padding: 36px 48px;
  border-radius: 22px;
  text-align: center;
  box-shadow: 0 8px 40px rgba(0,0,0,0.25);
  animation: popIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  z-index: 1001;
  max-width: min(440px, 88vw);
  width: 100%;
  box-sizing: border-box;
}

.win-icon { font-size: 56px; display: block; margin-bottom: 12px; }
.win-icon.bounce { animation: bounce 0.8s ease infinite; }
.win-text  { font-size: 26px; font-weight: 700; color: #333; margin: 0 0 6px; }
.win-stats { font-size: 14px; color: #999; margin: 0; }

.confetti {
  position: absolute;
  top: -12px;
  border-radius: 2px;
  animation: confettiFall linear forwards;
  pointer-events: none;
}

/* ── 動畫 ─────────────────────────────────────────────────── */
@keyframes tileMove {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.1); }
  100% { transform: scale(1); }
}
@keyframes correctTile {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.15); filter: brightness(1.25); }
  100% { transform: scale(1); }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-10px); }
}
@keyframes popIn {
  0%   { opacity: 0; transform: scale(0.6); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes confettiFall {
  0%   { transform: translateY(0) rotate(0deg);       opacity: 1; }
  100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
}

.celebration-enter-active { transition: opacity 0.3s ease; }
.celebration-leave-active  { transition: opacity 0.2s ease; }
.celebration-enter-from,
.celebration-leave-to      { opacity: 0; }

/* ── 手機調整 ─────────────────────────────────────────────── */
@media (max-width: 400px) {
  .meta-row      { flex-direction: column; }
  .win-message   { padding: 24px 20px; }
  .win-icon      { font-size: 40px; }
  .win-text      { font-size: 20px; }
}
</style>
