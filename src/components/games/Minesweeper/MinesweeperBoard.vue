<template>
  <div class="board-wrapper">
    <div class="board" :style="boardStyle">
      <template v-for="(row, rowIndex) in board" :key="rowIndex">
        <MinesweeperCell
          v-for="(cell, colIndex) in row"
          :key="`${rowIndex}-${colIndex}`"
          :cell="cell"
          :game-status="gameStatus"
          @cell-click="$emit('cell-click', rowIndex, colIndex)"
          @cell-right-click="$emit('cell-right-click', rowIndex, colIndex)"
          @cell-chord="$emit('cell-chord', rowIndex, colIndex)"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MinesweeperCell from './MinesweeperCell.vue';

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

type GameStatus = 'ready' | 'playing' | 'won' | 'lost';

const props = defineProps<{
  board: Cell[][];
  gameStatus: GameStatus;
}>();

defineEmits<{
  'cell-click': [row: number, col: number];
  'cell-right-click': [row: number, col: number];
  'cell-chord': [row: number, col: number];
}>();

const boardStyle = computed(() => {
  const cols = props.board[0]?.length || 8;
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 40px)`,
    gridAutoRows: '40px',
    gap: '2px',
    background: '#bdbdbd',
    padding: '6px',
    borderRadius: '4px',
    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(255,255,255,0.5)',
  };
});
</script>

<style scoped>
.board-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  max-width: 100%;
  overflow: auto;
}

@media (max-width: 640px) {
  .board {
    grid-template-columns: repeat(v-bind('board[0]?.length || 8'), 32px) !important;
    grid-auto-rows: 32px !important;
    gap: 1px !important;
    padding: 3px !important;
  }
}
</style>
