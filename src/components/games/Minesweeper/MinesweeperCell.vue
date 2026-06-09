<template>
  <div
    class="cell"
    :class="[
      { revealed: cell.isRevealed },
      { mine: cell.isRevealed && cell.isMine },
      { flagged: cell.isFlagged },
      { 'adjacent-count': cell.isRevealed && cell.adjacentMines > 0 },
      `adjacent-${cell.adjacentMines}`,
    ]"
    @click.left="handleLeftClick"
    @contextmenu.prevent="$emit('cell-right-click')"
    @mousedown.middle.prevent="$emit('cell-chord')"
    @dblclick="handleDblClick"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
    @touchmove.passive="handleTouchMove"
  >
    <!-- 未揭示的格子 -->
    <template v-if="!cell.isRevealed">
      <span v-if="cell.isFlagged" class="flag">🚩</span>
    </template>

    <!-- 已揭示的格子 -->
    <template v-else>
      <!-- 地雷 -->
      <span v-if="cell.isMine" class="mine-icon">💣</span>
      <!-- 相鄰地雷數 -->
      <span v-else-if="cell.adjacentMines > 0" class="adjacent-text">
        {{ cell.adjacentMines }}
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

type GameStatus = 'ready' | 'playing' | 'won' | 'lost';

const props = defineProps<{
  cell: Cell;
  gameStatus: GameStatus;
}>();

const emit = defineEmits<{
  'cell-click': [];
  'cell-right-click': [];
  'cell-chord': [];
}>();

// ── 長按 (Long Press) 支援 ──────────────────────────────────────────
const LONG_PRESS_MS = 500;
let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let touchMoved = false;

function handleTouchStart() {
  touchMoved = false;
  longPressTimer = setTimeout(() => {
    if (!touchMoved) {
      // 長按 = 右鍵（插旗）
      emit('cell-right-click');
    }
  }, LONG_PRESS_MS);
}

function handleTouchEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

function handleTouchMove() {
  // 手指滑動就取消長按
  touchMoved = true;
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

// ── 左鍵點擊 ────────────────────────────────────────────────────────
function handleLeftClick() {
  emit('cell-click');
}

// ── 雙擊 = Chord（數字格連鎖開啟） ──────────────────────────────────
function handleDblClick() {
  if (props.cell.isRevealed && props.cell.adjacentMines > 0) {
    emit('cell-chord');
  }
}
</script>

<style scoped>
.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #c6c6c6;
  border: 3px outset #ffffff;
  cursor: pointer;
  user-select: none;
  font-family: 'Arial Black', Gadget, sans-serif;
  position: relative;
  box-sizing: border-box;
  /* 防止長按觸發系統選單 */
  -webkit-touch-callout: none;
}

/* 未揭示的狀態 */
.cell:not(.revealed):hover {
  background: #d0d0d0;
}

.cell:not(.revealed):active {
  border: 3px inset #ffffff;
}

/* 已揭示的狀態 */
.cell.revealed {
  background: #d9d9d9;
  border: 1px solid #7b7b7b;
  cursor: default;
}

/* 地雷 */
.cell.mine {
  background: #ff4d4f;
}

.mine-icon {
  font-size: 20px;
}

/* 旗幟 */
.flag {
  font-size: 18px;
}

/* 數字文字樣式 */
.adjacent-text {
  font-size: 22px;
  font-weight: 900;
  line-height: 1;
}

/* 經典踩地雷顏色 */
.adjacent-1 { color: #0000ff; }
.adjacent-2 { color: #008000; }
.adjacent-3 { color: #ff0000; }
.adjacent-4 { color: #000080; }
.adjacent-5 { color: #800000; }
.adjacent-6 { color: #008080; }
.adjacent-7 { color: #000000; }
.adjacent-8 { color: #808080; }

@media (max-width: 640px) {
  .adjacent-text {
    font-size: 18px;
  }
  .mine-icon, .flag {
    font-size: 16px;
  }
}
</style>
