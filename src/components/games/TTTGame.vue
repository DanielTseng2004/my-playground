<template>
  <div class="game-container ttt-game">
    <div class="status">
      <h2 v-if="winner">
        <span v-if="winner === 'Draw'" class="draw-text">平手！🤝</span>
        <span v-else-if="winner === 'X'" class="win-text">你贏了！🎉</span>
        <span v-else class="lose-text">機器人贏了！🤖</span>
      </h2>
      <h2 v-else class="turn-text">輪到: {{ playerTurn ? '你 (X)' : '機器人 (O)' }}</h2>
    </div>

    <div class="board">
      <div 
        v-for="(cell, index) in board" 
        :key="index" 
        class="square" 
        :class="{ 
          disabled: !playerTurn || winner,
          x: cell === 'X',
          o: cell === 'O',
          winning: winningLine.includes(index)
        }" 
        @click="handleClick(index)"
      >
        <span v-if="cell" class="cell-content">{{ cell }}</span>
      </div>
    </div>

    <div class="controls">
      <n-button type="primary" @click="resetGame">重新開始</n-button>
    </div>

    <div class="stats">
      <p>你的勝利: <span class="stat-value">{{ playerWins }}</span></p>
      <p>機器人勝利: <span class="stat-value">{{ robotWins }}</span></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NButton } from 'naive-ui';

const board = ref<(string | null)[]>(Array(9).fill(null));
const playerTurn = ref(true);
const playerWins = ref(0);
const robotWins = ref(0);
const winningLine = ref<number[]>([]);

const winner = computed(() => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  
  for (const [a, b, c] of lines) {
    if (board.value[a] && board.value[a] === board.value[b] && board.value[a] === board.value[c]) {
      winningLine.value = [a, b, c];
      return board.value[a];
    }
  }
  
  return board.value.every(cell => cell !== null) ? 'Draw' : null;
});

function handleClick(i: number) {
  if (winner.value || board.value[i] || !playerTurn.value) return;
  
  board.value[i] = 'X';
  playerTurn.value = false;
  
  if (!winner.value && !board.value.every(cell => cell !== null)) {
    setTimeout(robotMove, 500);
  }
}

function robotMove() {
  if (winner.value) return;
  
  const bestMove = findBestMove();
  if (bestMove !== -1) {
    board.value[bestMove] = 'O';
  }
  
  playerTurn.value = true;
  
  if (winner.value) {
    if (winner.value === 'X') {
      playerWins.value++;
    } else if (winner.value === 'O') {
      robotWins.value++;
    }
  }
}

function findBestMove(): number {
  let bestScore = -Infinity;
  let bestMove = -1;
  
  for (let i = 0; i < 9; i++) {
    if (board.value[i] === null) {
      board.value[i] = 'O';
      const score = minimax(0, false);
      board.value[i] = null;
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  
  return bestMove;
}

function minimax(depth: number, isMaximizing: boolean): number {
  const gameWinner = checkWinner();
  
  if (gameWinner === 'O') return 10 - depth;
  if (gameWinner === 'X') return depth - 10;
  if (board.value.every(cell => cell !== null)) return 0;
  
  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board.value[i] === null) {
        board.value[i] = 'O';
        const score = minimax(depth + 1, false);
        board.value[i] = null;
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board.value[i] === null) {
        board.value[i] = 'X';
        const score = minimax(depth + 1, true);
        board.value[i] = null;
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

function checkWinner(): string | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  
  for (const [a, b, c] of lines) {
    if (board.value[a] && board.value[a] === board.value[b] && board.value[a] === board.value[c]) {
      return board.value[a];
    }
  }
  
  return null;
}

function resetGame() {
  board.value = Array(9).fill(null);
  playerTurn.value = true;
  winningLine.value = [];
}
</script>

<style scoped>
.ttt-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.status {
  text-align: center;
  height: 60px;
  font-size: 18px;
  color: #333;
}

.win-text {
  color: #52c41a;
  animation: winPulse 0.6s ease infinite;
}

.lose-text {
  color: #f5222d;
  animation: losePulse 0.6s ease infinite;
}

.draw-text {
  color: #666;
  animation: drawPulse 0.6s ease infinite;
}

.turn-text {
  color: #1890ff;
}

.board {
  display: grid;
  grid-template-columns: repeat(3, 100px);
  grid-template-rows: repeat(3, 100px);
  gap: 5px;
  background: #333;
  padding: 5px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.square {
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  user-select: none;
  position: relative;
  overflow: hidden;
}

.square:hover:not(.disabled) {
  background: #f0f0f0;
  transform: scale(1.05);
}

.square.disabled {
  cursor: not-allowed;
}

.square.x .cell-content {
  color: #1890ff;
  animation: cellAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.square.o .cell-content {
  color: #f5222d;
  animation: cellAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.square.winning {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  animation: winningFlash 0.6s ease infinite;
}

.square.winning::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.5), transparent);
  animation: winningGlow 0.6s ease infinite;
}

.controls {
  margin: 15px 0;
}

.stats {
  display: flex;
  gap: 30px;
  margin-top: 20px;
  padding: 15px 30px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
}

.stats p {
  margin: 0;
}

.stat-value {
  color: #1890ff;
  font-size: 18px;
  animation: statBounce 0.4s ease;
}

@keyframes cellAppear {
  0% {
    opacity: 0;
    transform: scale(0.5) rotate(-180deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes winningFlash {
  0%, 100% {
    background: linear-gradient(135deg, #ffd700, #ffed4e);
  }
  50% {
    background: linear-gradient(135deg, #ffed4e, #ffd700);
  }
}

@keyframes winningGlow {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

@keyframes winPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes losePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes drawPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes statBounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

/* 響應式設計 */
@media (max-width: 768px) {
  .ttt-game {
    padding: 15px;
  }

  .board {
    grid-template-columns: repeat(3, 80px);
    grid-template-rows: repeat(3, 80px);
    gap: 4px;
    padding: 4px;
  }

  .square {
    font-size: 32px;
  }

  .stats {
    gap: 20px;
    padding: 12px 20px;
    font-size: 14px;
  }

  .stat-value {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .ttt-game {
    padding: 10px;
    gap: 10px;
  }

  .status {
    height: 50px;
    font-size: 16px;
  }

  .board {
    grid-template-columns: repeat(3, 60px);
    grid-template-rows: repeat(3, 60px);
    gap: 3px;
    padding: 3px;
  }

  .square {
    font-size: 24px;
    border-radius: 3px;
  }

  .square:hover:not(.disabled) {
    transform: scale(1.02);
  }

  .controls {
    margin: 10px 0;
  }

  .stats {
    flex-direction: column;
    gap: 10px;
    padding: 10px 15px;
    font-size: 13px;
  }

  .stat-value {
    font-size: 14px;
  }
}
</style>
