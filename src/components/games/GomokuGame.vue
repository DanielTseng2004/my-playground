<template>
  <div class="game-container gomoku-game">
    <div class="game-info">
      <div class="status-panel">
        <div class="player-info" :class="{ active: currentPlayer === 1 && !winner }">
          <div class="stone black"></div>
          <span class="label">黑棋 (玩家)</span>
        </div>
        <div class="vs">VS</div>
        <div class="player-info" :class="{ active: currentPlayer === 2 && !winner }">
          <div class="stone white"></div>
          <span class="label">白棋 (電腦)</span>
        </div>
      </div>
      
      <div class="action-bar">
        <n-button @click="resetGame" secondary type="warning">重新開始</n-button>
        <div v-if="winner" class="winner-announcement" :class="winner === 1 ? 'win' : 'lose'">
          {{ winner === 1 ? '恭喜你贏了！' : '電腦獲勝，再接再厲！' }}
        </div>
      </div>
    </div>

    <div class="board-container">
      <div class="board" :style="boardStyle">
        <div v-for="row in BOARD_SIZE" :key="'row-'+row" class="grid-row">
          <div v-for="col in BOARD_SIZE" :key="'col-'+col" class="grid-cell"></div>
        </div>
        
        <div class="stones-layer">
          <div 
            v-for="(row, rIdx) in board" 
            :key="rIdx" 
            class="stone-row"
          >
            <div 
              v-for="(cell, cIdx) in row" 
              :key="cIdx" 
              class="stone-slot"
              @click="handleMove(rIdx, cIdx)"
            >
              <transition name="stone-pop">
                <div 
                  v-if="cell !== 0" 
                  class="stone" 
                  :class="[
                    cell === 1 ? 'black' : 'white',
                    { 'last-move': lastMove?.r === rIdx && lastMove?.c === cIdx },
                    { 'winning-stone': isWinningStone(rIdx, cIdx) }
                  ]"
                ></div>
              </transition>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { NButton } from 'naive-ui';

const BOARD_SIZE = 15;
const board = ref<number[][]>([]); // 0: empty, 1: black, 2: white
const currentPlayer = ref(1); // 1: black (player), 2: white (AI)
const winner = ref<number | null>(null);
const winningLine = ref<{r: number, c: number}[]>([]);
const lastMove = ref<{r: number, c: number} | null>(null);
const isProcessing = ref(false);

const boardStyle = computed(() => ({
  gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
  gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`
}));

function initBoard() {
  const newBoard = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    newBoard.push(new Array(BOARD_SIZE).fill(0));
  }
  board.value = newBoard;
}

function resetGame() {
  initBoard();
  currentPlayer.value = 1;
  winner.value = null;
  winningLine.value = [];
  lastMove.value = null;
  isProcessing.value = false;
}

function handleMove(r: number, c: number) {
  if (board.value[r][c] !== 0 || winner.value || isProcessing.value || currentPlayer.value !== 1) return;

  makeMove(r, c, 1);
  
  if (!winner.value) {
    isProcessing.value = true;
    setTimeout(() => {
      aiMove();
      isProcessing.value = false;
    }, 600);
  }
}

function makeMove(r: number, c: number, player: number) {
  board.value[r][c] = player;
  lastMove.value = { r, c };
  
  const line = checkWinner(r, c, player);
  if (line) {
    winner.value = player;
    winningLine.value = line;
  } else {
    currentPlayer.value = player === 1 ? 2 : 1;
  }
}

function checkWinner(r: number, c: number, player: number) {
  const directions = [
    [[0, 1], [0, -1]], // 水平
    [[1, 0], [-1, 0]], // 垂直
    [[1, 1], [-1, -1]], // 主對角線
    [[1, -1], [-1, 1]]  // 副對角線
  ];

  for (const dir of directions) {
    let count = 1;
    let line = [{ r, c }];
    
    for (const [dr, dc] of dir) {
      let nr = r + dr;
      let nc = c + dc;
      while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board.value[nr][nc] === player) {
        count++;
        line.push({ r: nr, c: nc });
        nr += dr;
        nc += dc;
      }
    }
    
    if (count >= 5) return line;
  }
  return null;
}

function isWinningStone(r: number, c: number) {
  return winningLine.value.some(pos => pos.r === r && pos.c === c);
}

// 簡單的 AI 邏輯：優先防守和進攻
function aiMove() {
  if (winner.value) return;

  let bestScore = -1;
  let move = { r: -1, c: -1 };

  // 遍歷所有空格評分
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board.value[r][c] === 0) {
        const score = evaluateMove(r, c);
        if (score > bestScore) {
          bestScore = score;
          move = { r, c };
        }
      }
    }
  }

  if (move.r !== -1) {
    makeMove(move.r, move.c, 2);
  }
}

function evaluateMove(r: number, c: number) {
  // 簡單的評分權重
  let totalScore = 0;
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

  for (const [dr, dc] of directions) {
    totalScore += getLineScore(r, c, dr, dc, 2); // 進攻分
    totalScore += getLineScore(r, c, dr, dc, 1) * 0.9; // 防守分（略低於進攻）
  }
  
  // 距離中心越近分數略高
  const distToCenter = Math.abs(r - 7) + Math.abs(c - 7);
  totalScore += (20 - distToCenter) * 0.1;

  return totalScore;
}

function getLineScore(r: number, c: number, dr: number, dc: number, player: number) {
  let count = 1;
  let blocked = 0;

  // 正向
  let nr = r + dr;
  let nc = c + dc;
  while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board.value[nr][nc] === player) {
    count++;
    nr += dr;
    nc += dc;
  }
  if (!(nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board.value[nr][nc] === 0)) blocked++;

  // 反向
  nr = r - dr;
  nc = c - dc;
  while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board.value[nr][nc] === player) {
    count++;
    nr -= dr;
    nc -= dc;
  }
  if (!(nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board.value[nr][nc] === 0)) blocked++;

  if (count >= 5) return 10000;
  if (blocked === 2) return 0;
  
  if (count === 4) return blocked === 0 ? 5000 : 1000;
  if (count === 3) return blocked === 0 ? 500 : 100;
  if (count === 2) return blocked === 0 ? 50 : 10;
  return count;
}

onMounted(() => {
  initBoard();
});
</script>

<style scoped>
.gomoku-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  user-select: none;
}

.game-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.status-panel {
  display: flex;
  align-items: center;
  gap: 30px;
  background: #f8f9fa;
  padding: 12px 30px;
  border-radius: 50px;
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);
}

.player-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
  opacity: 0.5;
}

.player-info.active {
  opacity: 1;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: scale(1.05);
}

.vs {
  font-weight: 800;
  color: #ccc;
  font-style: italic;
}

.stone {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.stone.black {
  background: radial-gradient(circle at 30% 30%, #444, #000);
}

.stone.white {
  background: radial-gradient(circle at 30% 30%, #fff, #ccc);
  border: 1px solid #ddd;
}

.label {
  font-weight: 600;
  font-size: 14px;
}

.action-bar {
  display: flex;
  align-items: center;
  gap: 20px;
}

.winner-announcement {
  font-weight: 700;
  font-size: 18px;
  padding: 4px 16px;
  border-radius: 8px;
  animation: slideIn 0.5s ease;
}

.winner-announcement.win {
  color: #27ae60;
  background: #eafaf1;
}

.winner-announcement.lose {
  color: #e74c3c;
  background: #fdedec;
}

.board-container {
  padding: 15px;
  background: #dcb35c;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2), 0 0 0 10px #c69c45;
}

.board {
  display: grid;
  width: 450px;
  height: 450px;
  position: relative;
  background-image: 
    linear-gradient(#333 1px, transparent 1px),
    linear-gradient(90deg, #333 1px, transparent 1px);
  background-size: calc(100% / 14) calc(100% / 14);
  background-position: center;
  border: 1px solid #333;
}

/* 棋盤格點 */
.grid-row {
  display: contents;
}

.stones-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.stone-row {
  flex: 1;
  display: flex;
}

.stone-slot {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  z-index: 1;
}

.stone-slot .stone {
  width: 85%;
  height: 85%;
  z-index: 2;
}

.stone.last-move::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4757;
  box-shadow: 0 0 5px rgba(255, 71, 87, 0.8);
}

.stone.winning-stone {
  animation: pulse 1s infinite;
  box-shadow: 0 0 15px #f1c40f;
  border: 2px solid #f1c40f;
}

@keyframes stone-pop {
  0% { transform: scale(0.5); opacity: 0; }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.stone-pop-enter-active {
  animation: stone-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes slideIn {
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* 響應式 */
@media (max-width: 600px) {
  .board {
    width: 320px;
    height: 320px;
  }
  
  .status-panel {
    gap: 15px;
    padding: 8px 20px;
  }
  
  .player-info {
    padding: 4px 10px;
  }
  
  .label {
    font-size: 12px;
  }
}
</style>
