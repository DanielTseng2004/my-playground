<template>
  <div class="minesweeper-container">
    <div class="game-header">
      <div class="header-section">
        <div class="info-item">
          <span class="label">地雷數</span>
          <span class="value">{{ remainingMines }}</span>
        </div>
        <div class="info-item">
          <span class="label">時間</span>
          <span class="value">{{ gameTime }}</span>
        </div>
      </div>
      <button class="reset-btn" @click="confirmReset">
        {{ gameStatus === 'ready' ? '開始遊戲' : '重新開始' }}
      </button>
    </div>

    <!-- 難度選擇區 -->
    <div class="setup-section" v-if="gameStatus === 'ready'">
      <h3>選擇難度</h3>
      <div class="difficulty-selector">
        <button
          v-for="level in difficulties"
          :key="level.id"
          class="difficulty-card"
          :class="{ active: difficulty === level.id }"
          @click="difficulty = level.id"
        >
          <span class="level-name">{{ level.name }}</span>
          <span class="level-info">{{ level.rows }}x{{ level.cols }} | {{ level.mines }} 💣</span>
        </button>
      </div>
      <button class="start-btn" @click="startGame">進入戰場</button>
    </div>

    <!-- 遊戲狀態提示 -->
    <div v-if="gameStatus === 'won' || gameStatus === 'lost'" class="game-status">
      <span v-if="gameStatus === 'won'" class="status-won">🎉 恭喜！你贏了！</span>
      <span v-else-if="gameStatus === 'lost'" class="status-lost">💣 遊戲結束！踩到地雷了</span>
    </div>

    <!-- 遊戲棋盤 -->
    <div class="board-container" v-if="gameStatus !== 'ready'">
      <MinesweeperBoard
        :board="board"
        :game-status="gameStatus"
        @cell-click="handleCellClick"
        @cell-right-click="handleCellRightClick"
        @cell-chord="handleCellChord"
      />
    </div>

    <!-- 統計資訊 -->
    <div class="stats" v-if="gameStatus !== 'ready'">
      <div class="stat-item">
        <span>已標記</span>
        <span class="stat-value">{{ flaggedCount }}</span>
      </div>
      <div class="stat-item">
        <span>已揭示</span>
        <span class="stat-value">{{ revealedCount }}</span>
      </div>
      <div class="stat-item">
        <span>總格子數</span>
        <span class="stat-value">{{ totalCells }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import MinesweeperBoard from './Minesweeper/MinesweeperBoard.vue';

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

type GameStatus = 'ready' | 'playing' | 'won' | 'lost';
type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface DifficultyConfig {
  id: DifficultyLevel;
  name: string;
  rows: number;
  cols: number;
  mines: number;
}

const difficulties: DifficultyConfig[] = [
  { id: 'easy',   name: '簡單', rows: 8,  cols: 8,  mines: 10 },
  { id: 'medium', name: '中等', rows: 12, cols: 12, mines: 25 },
  { id: 'hard',   name: '困難', rows: 16, cols: 16, mines: 40 },
];

const difficulty  = ref<DifficultyLevel>('easy');
const board       = ref<Cell[][]>([]);
const gameStatus  = ref<GameStatus>('ready');
const gameTime    = ref(0);
const isFirstClick = ref(true);   // ★ 追蹤是否為第一步
let   gameTimer: number | null = null;

// ── 計算屬性 ────────────────────────────────────────────────────────

const currentDifficulty = computed(() =>
  difficulties.find(d => d.id === difficulty.value)!
);

const remainingMines = computed(() => {
  if (gameStatus.value === 'ready') return currentDifficulty.value.mines;
  return Math.max(0, currentDifficulty.value.mines - flaggedCount.value);
});

const flaggedCount = computed(() => {
  let count = 0;
  for (const row of board.value)
    for (const cell of row)
      if (cell.isFlagged) count++;
  return count;
});

const revealedCount = computed(() => {
  let count = 0;
  for (const row of board.value)
    for (const cell of row)
      if (cell.isRevealed) count++;
  return count;
});

const totalCells = computed(() =>
  currentDifficulty.value.rows * currentDifficulty.value.cols
);

// ── 棋盤初始化（只建空格，不放地雷）────────────────────────────────

/**
 * 建立一塊全空的棋盤，地雷在第一次點擊後才放置。
 */
function initializeEmptyBoard() {
  const { rows, cols } = currentDifficulty.value;
  board.value = Array(rows)
    .fill(null)
    .map(() =>
      Array(cols)
        .fill(null)
        .map(() => ({
          isMine:        false,
          isRevealed:    false,
          isFlagged:     false,
          adjacentMines: 0,
        }))
    );
}

/**
 * ★ 第一步安全：在玩家點擊後才放地雷，且保證點擊格（含周圍 8 格）不含地雷。
 * @param safeRow  第一步點擊的列
 * @param safeCol  第一步點擊的欄
 */
function placeMinesAfterFirstClick(safeRow: number, safeCol: number) {
  const { rows, cols, mines } = currentDifficulty.value;

  // 建立「安全區」— 點擊格 + 周圍 8 格
  const safeSet = new Set<string>();
  for (let r = Math.max(0, safeRow - 1); r <= Math.min(rows - 1, safeRow + 1); r++) {
    for (let c = Math.max(0, safeCol - 1); c <= Math.min(cols - 1, safeCol + 1); c++) {
      safeSet.add(`${r},${c}`);
    }
  }

  // 隨機放地雷（跳過安全區）
  let minesPlaced = 0;
  while (minesPlaced < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!board.value[r][c].isMine && !safeSet.has(`${r},${c}`)) {
      board.value[r][c].isMine = true;
      minesPlaced++;
    }
  }

  // 計算所有格子的相鄰地雷數
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board.value[r][c].isMine) {
        board.value[r][c].adjacentMines = countAdjacentMines(r, c);
      }
    }
  }
}

function countAdjacentMines(row: number, col: number): number {
  let count = 0;
  const { rows, cols } = currentDifficulty.value;
  for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
    for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
      if ((r !== row || c !== col) && board.value[r][c].isMine) count++;
    }
  }
  return count;
}

// ── 遊戲流程 ────────────────────────────────────────────────────────

function startGame() {
  gameStatus.value  = 'playing';
  gameTime.value    = 0;
  isFirstClick.value = true;        // ★ 重置第一步旗標
  initializeEmptyBoard();           // ★ 只建空盤，不放地雷
  startTimer();
}

// ── 事件處理 ────────────────────────────────────────────────────────

function handleCellClick(row: number, col: number) {
  if (gameStatus.value !== 'playing') return;
  const cell = board.value[row][col];

  // 點到已揭示的數字格 → 觸發 Chord
  if (cell.isRevealed) {
    handleCellChord(row, col);
    return;
  }

  if (cell.isFlagged) return;

  // ★ 第一步：先把地雷埋好再揭示
  if (isFirstClick.value) {
    placeMinesAfterFirstClick(row, col);
    isFirstClick.value = false;
  }

  if (cell.isMine) {
    // 理論上第一步不會踩雷；保險起見仍處理
    gameStatus.value = 'lost';
    revealAllMines();
    stopTimer();
  } else {
    revealCell(row, col);
    checkWinCondition();
  }
}

function handleCellRightClick(row: number, col: number) {
  if (gameStatus.value !== 'playing') return;
  if (board.value[row][col].isRevealed) return;
  board.value[row][col].isFlagged = !board.value[row][col].isFlagged;
}

/**
 * Chording：點擊已揭示的數字格，若周圍旗幟數 === 數字，則開啟周圍未標記格。
 * 由 MinesweeperCell 的 雙擊 / 滾輪 / 長按 觸發，Board 再轉拋到這裡。
 */
function handleCellChord(row: number, col: number) {
  if (gameStatus.value !== 'playing') return;
  const cell = board.value[row][col];
  if (!cell.isRevealed || cell.adjacentMines === 0) return;

  const { rows, cols } = currentDifficulty.value;
  let surroundingFlags = 0;
  const toReveal: { r: number; c: number }[] = [];

  for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
    for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
      if (r === row && c === col) continue;
      if (board.value[r][c].isFlagged) {
        surroundingFlags++;
      } else if (!board.value[r][c].isRevealed) {
        toReveal.push({ r, c });
      }
    }
  }

  if (surroundingFlags !== cell.adjacentMines) return;

  let hitMine = false;
  for (const { r, c } of toReveal) {
    if (board.value[r][c].isMine) hitMine = true;
    revealCell(r, c);
  }

  if (hitMine) {
    gameStatus.value = 'lost';
    revealAllMines();
    stopTimer();
  } else {
    checkWinCondition();
  }
}

// ── 揭示邏輯 ────────────────────────────────────────────────────────

function revealCell(row: number, col: number) {
  const cell = board.value[row][col];
  if (cell.isRevealed || cell.isFlagged) return;

  cell.isRevealed = true;

  // Flood Fill：空白格自動擴散
  if (cell.adjacentMines === 0) {
    const { rows, cols } = currentDifficulty.value;
    for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
        if ((r !== row || c !== col) && !board.value[r][c].isRevealed) {
          revealCell(r, c);
        }
      }
    }
  }
}

function revealAllMines() {
  for (const row of board.value)
    for (const cell of row)
      if (cell.isMine) cell.isRevealed = true;
}

// ── 勝利判斷 ────────────────────────────────────────────────────────

function checkWinCondition() {
  const { mines } = currentDifficulty.value;
  if (revealedCount.value === totalCells.value - mines) {
    gameStatus.value = 'won';
    stopTimer();
  }
}

// ── 重置 ─────────────────────────────────────────────────────────────

function confirmReset() {
  if (gameStatus.value === 'playing') {
    if (confirm('確定要放棄當前進度並重新開始嗎？')) {
      gameStatus.value = 'ready';
      stopTimer();
    }
  } else {
    gameStatus.value = 'ready';
    stopTimer();
  }
}

// ── 計時器 ───────────────────────────────────────────────────────────

function startTimer() {
  stopTimer();
  gameTimer = window.setInterval(() => { gameTime.value++; }, 1000);
}

function stopTimer() {
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }
}

onUnmounted(stopTimer);
</script>

<style scoped>
.minesweeper-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
  min-height: 600px;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #434343 0%, #000000 100%);
  padding: 24px;
  border-radius: 16px;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.header-section {
  display: flex;
  gap: 40px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-item .label {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.info-item .value {
  font-size: 32px;
  font-weight: 800;
  font-family: 'Courier New', Courier, monospace;
  color: #ff4d4f;
}

.reset-btn {
  padding: 12px 28px;
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.reset-btn:hover {
  background: #ff7875;
  transform: translateY(-2px);
}

/* 準備階段樣式 */
.setup-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 20px;
  padding: 40px;
  border: 2px dashed #dee2e6;
}

.setup-section h3 {
  font-size: 24px;
  margin-bottom: 30px;
  color: #333;
}

.difficulty-selector {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
}

.difficulty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 30px;
  background: white;
  border: 2px solid #eee;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 140px;
}

.difficulty-card:hover {
  border-color: #ff4d4f;
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

.difficulty-card.active {
  border-color: #ff4d4f;
  background: #fff1f0;
}

.level-name {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 8px;
}

.level-info {
  font-size: 14px;
  color: #666;
}

.start-btn {
  padding: 16px 60px;
  font-size: 20px;
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 50px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 8px 16px rgba(255, 77, 79, 0.3);
}

.start-btn:hover {
  background: #ff7875;
  transform: scale(1.05);
}

/* 遊戲狀態樣式 */
.game-status {
  text-align: center;
  padding: 20px;
}

.status-won, .status-lost {
  font-size: 24px;
  font-weight: 800;
  padding: 16px 40px;
  border-radius: 12px;
  display: inline-block;
}

.status-won {
  background: #f6ffed;
  color: #52c41a;
  border: 2px solid #b7eb8f;
}

.status-lost {
  background: #fff1f0;
  color: #f5222d;
  border: 2px solid #ffa39e;
}

.board-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: #f0f2f5;
  border-radius: 20px;
  overflow: auto;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.stat-item span:first-child {
  font-size: 14px;
  color: #8c8c8c;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #262626;
}

@media (max-width: 640px) {
  .minesweeper-container {
    padding: 12px;
  }

  .difficulty-selector {
    flex-direction: column;
    width: 100%;
  }

  .difficulty-card {
    flex-direction: row;
    justify-content: space-between;
    padding: 16px;
  }

  .setup-section {
    padding: 20px;
  }
}
</style>
