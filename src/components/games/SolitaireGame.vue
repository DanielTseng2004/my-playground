<template>
  <div class="game-container solitaire-game">
    <div
      v-if="!gameStarted"
      class="start-screen"
    >
      <div class="game-logo">🃏</div>
      <h1>經典接龍</h1>
      <p>將所有牌按花色移至目標牌堆 (A 到 K)</p>
      <n-button
        type="primary"
        size="large"
        round
        class="btn-start"
        @click="startGame"
        >開始遊戲</n-button
      >
    </div>

    <template v-else>
      <div class="game-header">
        <div class="stats">
          <div class="stat-item">
            <span class="label">移動次數</span>
            <span class="value">{{ moves }}</span>
          </div>
          <div class="stat-item">
            <span class="label">剩餘牌數</span>
            <span class="value">{{ remainingCards }}</span>
          </div>
          <div class="stat-item">
            <span class="label">完成度</span>
            <span class="value">{{ completionPercent }}%</span>
          </div>
        </div>

        <div class="controls">
          <n-button
            @click="undoMove"
            :disabled="!canUndo"
            size="medium"
            round
            secondary
            type="info"
            >撤銷</n-button
          >
          <n-button
            @click="resetGame"
            size="medium"
            round
            secondary
            type="warning"
            >重新開始</n-button
          >
        </div>
      </div>

      <div class="board">
        <div class="top-row">
          <div class="stock-waste-group">
            <div class="pile-container">
              <div
                class="card-slot stock-pile"
                @click="drawCard"
                :class="{ empty: stock.length === 0 }"
              >
                <div
                  v-if="stock.length > 0"
                  class="card card-back"
                ></div>
                <div
                  v-else
                  class="empty-placeholder"
                >
                  <svg
                    viewBox="0 0 24 24"
                    class="refresh-icon"
                  >
                    <path
                      fill="currentColor"
                      d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
                    />
                  </svg>
                </div>
              </div>
              <span class="pile-count">{{ stock.length }}</span>
            </div>

            <div class="pile-container">
              <div class="card-slot waste-pile">
                <div
                  v-if="waste.length > 0"
                  class="card"
                  :class="getCardClass(waste[waste.length - 1])"
                  @click="selectCard('waste', 0, waste.length - 1)"
                  @dragstart="
                    handleDragStart($event, 'waste', 0, waste.length - 1)
                  "
                  draggable="true"
                >
                  <div class="card-content">
                    <div class="card-corner">
                      <span class="val">{{
                        waste[waste.length - 1].value
                      }}</span>
                      <span class="suit-mini">{{
                        waste[waste.length - 1].suit
                      }}</span>
                    </div>
                    <span class="suit-center">{{
                      waste[waste.length - 1].suit
                    }}</span>
                  </div>
                </div>
              </div>
              <span
                class="pile-count"
                style="opacity: 0"
                >&nbsp;</span
              >
            </div>
          </div>

          <div class="spacer"></div>

          <div class="foundation-group">
            <div
              v-for="(suit, sIdx) in suits"
              :key="suit"
              class="pile-container"
            >
              <div
                class="card-slot foundation-pile"
                @dragover.prevent
                @drop="handleDrop($event, 'foundation', sIdx)"
                :class="{
                  'drag-over': dragOverTarget === `foundation-${sIdx}`,
                }"
                @dragenter="dragOverTarget = `foundation-${sIdx}`"
                @dragleave="dragOverTarget = null"
              >
                <div
                  v-if="foundation[suit] && foundation[suit].length > 0"
                  class="card"
                  :class="
                    getCardClass(foundation[suit][foundation[suit].length - 1])
                  "
                >
                  <div class="card-content">
                    <div class="card-corner">
                      <span class="val">{{
                        foundation[suit][foundation[suit].length - 1].value
                      }}</span>
                      <span class="suit-mini">{{ suit }}</span>
                    </div>
                    <span class="suit-center">{{ suit }}</span>
                  </div>
                </div>
                <div
                  v-else
                  class="empty-suit-icon"
                >
                  {{ suit }}
                </div>
              </div>
              <span class="pile-count"
                >{{ foundation[suit]?.length || 0 }}/13</span
              >
            </div>
          </div>
        </div>

        <div class="tableau-row">
          <div
            v-for="(pile, pIdx) in tableau"
            :key="pIdx"
            class="tableau-pile-container"
          >
            <div
              class="tableau-slot"
              @dragover.prevent
              @drop="handleDrop($event, 'tableau', pIdx)"
              :class="{
                'drag-over': dragOverTarget === `tableau-${pIdx}`,
                'empty-tableau': pile.length === 0,
              }"
              @dragenter="dragOverTarget = `tableau-${pIdx}`"
              @dragleave="dragOverTarget = null"
            >
              <div
                v-for="(card, cIdx) in pile"
                :key="cIdx"
                class="card-in-pile"
                :style="{
                  top: cIdx * (card.revealed ? 28 : 14) + 'px',
                  zIndex: cIdx,
                }"
              >
                <div
                  class="card"
                  :class="[getCardClass(card), { 'card-back': !card.revealed }]"
                  @click="selectCard('tableau', pIdx, cIdx)"
                  @dragstart="handleDragStart($event, 'tableau', pIdx, cIdx)"
                  :draggable="card.revealed"
                >
                  <div
                    v-if="card.revealed"
                    class="card-content"
                  >
                    <div class="card-corner">
                      <span class="val">{{ card.value }}</span>
                      <span class="suit-mini">{{ card.suit }}</span>
                    </div>
                    <span class="suit-center">{{ card.suit }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <transition name="result-fade">
        <div
          v-if="gameWon"
          class="victory-overlay"
        >
          <div class="victory-content">
            <div class="victory-icon">🏆</div>
            <h2>精彩的勝利！</h2>
            <p>
              你用了 <strong>{{ moves }}</strong> 步完成了牌局！
            </p>
            <n-button
              type="primary"
              size="large"
              round
              @click="resetGame"
              >再玩一局</n-button
            >
          </div>
        </div>
      </transition>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { NButton } from "naive-ui";

interface Card {
  suit: string;
  value: string;
  rank: number;
  revealed: boolean;
}

interface GameState {
  stock: Card[];
  waste: Card[];
  foundation: Record<string, Card[]>;
  tableau: Card[][];
  moves: number;
}

const suits = ["♠", "♥", "♦", "♣"];
const values = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

const gameStarted = ref(false);
const stock = ref<Card[]>([]);
const waste = ref<Card[]>([]);
const foundation = ref<Record<string, Card[]>>({});
const tableau = ref<Card[][]>([]);
const moves = ref(0);
const gameWon = ref(false);
const dragOverTarget = ref<string | null>(null);
const history = ref<GameState[]>([]);

const remainingCards = computed(() => {
  if (!gameStarted.value) return 52;
  let count = stock.value.length + waste.value.length;
  tableau.value.forEach((pile) => (count += pile.length));
  return count;
});

const completionPercent = computed(() => {
  if (!gameStarted.value || !foundation.value) return 0;
  let completed = 0;
  suits.forEach((suit) => {
    if (foundation.value[suit]) completed += foundation.value[suit].length;
  });
  return Math.floor((completed / 52) * 100);
});

const canUndo = computed(() => history.value.length > 0);

function createDeck() {
  const deck: Card[] = [];
  suits.forEach((suit) => {
    values.forEach((val, i) => {
      deck.push({ suit, value: val, rank: i + 1, revealed: false });
    });
  });
  return deck.sort(() => Math.random() - 0.5);
}

function startGame() {
  const deck = createDeck();
  stock.value = [];
  waste.value = [];
  foundation.value = {};
  tableau.value = Array(7)
    .fill(null)
    .map(() => []);
  moves.value = 0;
  gameWon.value = false;
  history.value = [];
  suits.forEach((suit) => (foundation.value[suit] = []));
  let deckIdx = 0;
  for (let i = 0; i < 7; i++) {
    for (let j = i; j < 7; j++) {
      const card = deck[deckIdx++];
      card.revealed = i === j;
      tableau.value[j].push(card);
    }
  }
  stock.value = deck.slice(deckIdx);
  gameStarted.value = true;
}

function getCardClass(card: Card) {
  return card.suit === "♥" || card.suit === "♦" ? "red-suit" : "black-suit";
}

function drawCard() {
  saveHistory();
  if (stock.value.length === 0) {
    if (waste.value.length > 0) {
      stock.value = waste.value
        .reverse()
        .map((c) => ({ ...c, revealed: false }));
      waste.value = [];
      moves.value++;
    }
  } else {
    const card = stock.value.pop()!;
    card.revealed = true;
    waste.value.push(card);
    moves.value++;
  }
}

// 判斷一組牌是否為合法的降序且紅黑交替序列（用於檢查抓起的整疊牌）
function isValidSequence(cards: Card[]): boolean {
  if (cards.length <= 1) return true;
  const isRed = (s: string) => s === "♥" || s === "♦";

  for (let i = 0; i < cards.length - 1; i++) {
    const current = cards[i];
    const next = cards[i + 1];
    // 必須未翻開就不能移動
    if (!current.revealed || !next.revealed) return false;
    // 點數必須依序減 1，且顏色不能相同
    if (
      current.rank !== next.rank + 1 ||
      isRed(current.suit) === isRed(next.suit)
    ) {
      return false;
    }
  }
  return true;
}

function handleDragStart(
  e: DragEvent,
  source: string,
  pileIdx: number,
  cardIdx: number,
) {
  // 如果是工作區，抓取的這張牌及其後面的牌必須形成合法序列
  if (source === "tableau") {
    const subStack = tableau.value[pileIdx].slice(cardIdx);
    if (!isValidSequence(subStack)) {
      e.preventDefault();
      return;
    }
  }

  const dragData = { source, pileIdx, cardIdx };
  e.dataTransfer!.effectAllowed = "move";
  e.dataTransfer!.setData("application/json", JSON.stringify(dragData));
}

function handleDrop(e: DragEvent, target: string, targetIdx: number) {
  e.preventDefault();
  dragOverTarget.value = null;

  const rawData = e.dataTransfer!.getData("application/json");
  if (!rawData) return;
  const dragData = JSON.parse(rawData);

  // 避免原地空投
  if (dragData.source === target && dragData.pileIdx === targetIdx) return;

  const sourceCards = getSourcePile(dragData.source, dragData.pileIdx);
  if (!sourceCards) return;

  // 取得被拖曳的整疊卡片（若是 waste 則只有一張）
  const draggedCards = sourceCards.slice(dragData.cardIdx);
  if (draggedCards.length === 0) return;

  const topDraggedCard = draggedCards[0]; // 整疊牌的最上面那張

  // 1. 移動到目標牌堆 (Foundation)
  if (target === "foundation") {
    // 只有當只拖曳「一張牌」時，才允許進入 Foundation
    if (
      draggedCards.length === 1 &&
      canMoveToFoundation(topDraggedCard, targetIdx)
    ) {
      saveHistory();
      if (dragData.source === "tableau") {
        foundation.value[suits[targetIdx]].push(
          tableau.value[dragData.pileIdx].pop()!,
        );
        revealTableauCard(dragData.pileIdx);
      } else if (dragData.source === "waste") {
        foundation.value[suits[targetIdx]].push(waste.value.pop()!);
      }
      moves.value++;
      checkWin();
    }
  }

  // 2. 移動到工作牌堆 (Tableau)
  else if (target === "tableau") {
    const targetPile = tableau.value[targetIdx];
    const targetTopCard = targetPile[targetPile.length - 1]; // 目標牌堆最底下的牌

    if (canMoveToTableau(topDraggedCard, targetTopCard)) {
      saveHistory();
      if (dragData.source === "tableau") {
        // 切出整疊並推進新牌堆
        const movingCards = tableau.value[dragData.pileIdx].splice(
          dragData.cardIdx,
        );
        tableau.value[targetIdx].push(...movingCards);
        revealTableauCard(dragData.pileIdx);
      } else if (dragData.source === "waste") {
        tableau.value[targetIdx].push(waste.value.pop()!);
      }
      moves.value++;
    }
  }
}

// 點擊卡片自動尋找可行位置（智慧移動）
function selectCard(source: string, pileIdx: number, cardIdx: number) {
  const sourceCards = getSourcePile(source, pileIdx);
  if (!sourceCards) return;

  // 取得從點擊位置開始的整疊牌
  const draggedCards = sourceCards.slice(cardIdx);
  if (draggedCards.length === 0 || !draggedCards[0].revealed) return;

  // 如果不是合法序列，不予理會
  if (source === "tableau" && !isValidSequence(draggedCards)) return;

  const topDraggedCard = draggedCards[0];

  // 優先權 1：如果是單張，嘗試移動到 Foundation
  if (draggedCards.length === 1) {
    for (let i = 0; i < suits.length; i++) {
      if (canMoveToFoundation(topDraggedCard, i)) {
        saveHistory();
        if (source === "tableau") {
          foundation.value[suits[i]].push(tableau.value[pileIdx].pop()!);
          revealTableauCard(pileIdx);
        } else if (source === "waste") {
          foundation.value[suits[i]].push(waste.value.pop()!);
        }
        moves.value++;
        checkWin();
        return;
      }
    }
  }

  // 優先權 2：嘗試移動到其他 Tableau 牌堆 (允許整疊移動)
  for (let i = 0; i < 7; i++) {
    if (source === "tableau" && pileIdx === i) continue; // 不移到自己這堆

    const targetPile = tableau.value[i];
    const targetTopCard = targetPile[targetPile.length - 1];

    if (canMoveToTableau(topDraggedCard, targetTopCard)) {
      saveHistory();
      if (source === "tableau") {
        const movingCards = tableau.value[pileIdx].splice(cardIdx);
        tableau.value[i].push(...movingCards);
        revealTableauCard(pileIdx);
      } else if (source === "waste") {
        tableau.value[i].push(waste.value.pop()!);
      }
      moves.value++;
      return;
    }
  }
}

function canMoveToFoundation(card: Card, foundationIdx: number) {
  const suit = suits[foundationIdx];
  const pile = foundation.value[suit];
  if (pile.length === 0) return card.value === "A";
  const topCard = pile[pile.length - 1];
  return card.suit === suit && card.rank === topCard.rank + 1;
}

function canMoveToTableau(draggedCard: Card, targetCard: Card | undefined) {
  // 如果目標位置是空的，只有 K 才能放
  if (!targetCard) return draggedCard.value === "K";

  const isRed = (s: string) => s === "♥" || s === "♦";
  // 檢查拖過來的頂端牌，點數是否比目標小 1，且顏色相異
  return (
    draggedCard.rank === targetCard.rank - 1 &&
    isRed(draggedCard.suit) !== isRed(targetCard.suit)
  );
}

function revealTableauCard(pileIdx: number) {
  const pile = tableau.value[pileIdx];
  if (pile.length > 0 && !pile[pile.length - 1].revealed) {
    pile[pile.length - 1].revealed = true;
  }
}

function checkWin() {
  if (completionPercent.value === 100) gameWon.value = true;
}

function saveHistory() {
  history.value.push({
    stock: JSON.parse(JSON.stringify(stock.value)),
    waste: JSON.parse(JSON.stringify(waste.value)),
    foundation: JSON.parse(JSON.stringify(foundation.value)),
    tableau: JSON.parse(JSON.stringify(tableau.value)),
    moves: moves.value,
  });
  if (history.value.length > 30) history.value.shift();
}

function undoMove() {
  if (history.value.length === 0) return;
  const state = history.value.pop()!;
  stock.value = state.stock;
  waste.value = state.waste;
  foundation.value = state.foundation;
  tableau.value = state.tableau;
  moves.value = state.moves;
  gameWon.value = false;
}

function resetGame() {
  gameStarted.value = false;
  startGame();
}

function getSourcePile(source: string, idx: number) {
  if (source === "waste") return waste.value;
  if (source === "tableau") return tableau.value[idx];
  return null;
}
</script>

<style scoped>
/* 全域現代感配置（參考 Google 綠色卡牌桌） */
.solitaire-game {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  background: radial-gradient(circle at 50% 30%, #1e7a4d 0%, #145334 100%);
  border-radius: 24px;
  padding: 30px;
  min-height: 780px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
  position: relative;
  font-family:
    "Product Sans",
    system-ui,
    -apple-system,
    sans-serif;
  color: #ffffff;
}

/* 開始畫面 Google 化 */
.start-screen {
  height: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.game-logo {
  font-size: 110px;
  margin-bottom: 10px;
  filter: drop-shadow(0 10px 15px rgba(0, 0, 0, 0.2));
  animation: float 4s ease-in-out infinite;
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
.start-screen h1 {
  font-size: 44px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: 1px;
}
.start-screen p {
  font-size: 16px;
  margin-bottom: 35px;
  opacity: 0.75;
}
.btn-start {
  padding: 0 40px !important;
  font-weight: bold;
  font-size: 16px !important;
  height: 48px !important;
}

/* 頂部狀態列扁平現代化 */
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 35px;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}
.stats {
  display: flex;
  gap: 35px;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}
.stat-item .label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.stat-item .value {
  color: #ffffff;
  font-size: 22px;
  font-weight: 700;
}
.controls {
  display: flex;
  gap: 12px;
}

/* 棋盤排版 */
.board {
  display: flex;
  flex-direction: column;
  gap: 35px;
}
.top-row {
  display: flex;
  width: 100%;
}
.stock-waste-group {
  display: flex;
  gap: 18px;
}
.foundation-group {
  display: flex;
  gap: 18px;
}
.spacer {
  flex: 1;
}
.pile-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.pile-count {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  font-weight: 500;
}

/* 牌槽樣式設計（仿 Google 內嵌虛線/實線陰影） */
.card-slot {
  width: 96px;
  height: 138px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.15);
  box-shadow: inset 0 4px 10px rgba(0, 0, 0, 0.3);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: 2px dashed rgba(255, 255, 255, 0.15);
}
.stock-pile {
  cursor: pointer;
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.05);
}
.stock-pile:hover {
  background: rgba(0, 0, 0, 0.25);
}

.empty-placeholder .refresh-icon {
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.3);
}

/* 紙牌本體設計：輕微圓角、溫和白、擬真陰影 */
.card {
  width: 96px;
  height: 138px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.25),
    0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  position: relative;
  transition:
    transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.15s ease;
  user-select: none;
  box-sizing: border-box;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.35);
}

/* 花色色調改為質感深色 */
.card.red-suit {
  color: #d93025;
} /* Google 經典紅 */
.card.black-suit {
  color: #202124;
} /* Google 經典深灰 */

/* 牌背優化：Google 幾何科技風質感 */
.card-back {
  background-color: #1a73e8; /* Google 藍 */
  background-image:
    radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 0),
    radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 0);
  background-size: 16px 16px;
  background-position:
    0 0,
    8px 8px;
  border: 4px solid #ffffff;
}

/* 牌面內容精緻化排版 */
.card-content {
  padding: 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.card-corner {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.1;
  width: fit-content;
}
.card-corner .val {
  font-size: 20px;
  font-weight: 700;
  font-family: sans-serif;
}
.card-corner .suit-mini {
  font-size: 14px;
}

.suit-center {
  position: absolute;
  top: 55%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 42px;
  opacity: 0.9;
}

/* 目標牌堆空格花色提示 */
.empty-suit-icon {
  font-size: 36px;
  opacity: 0.2;
  color: #ffffff;
  font-weight: bold;
}

/* 工作牌堆區域 (Tableau) */
.tableau-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 18px;
  width: 100%;
}
.tableau-pile-container {
  position: relative;
  width: 96px;
}
.tableau-slot {
  width: 96px;
  min-height: 138px;
  border-radius: 10px;
}
.empty-tableau {
  border: 2px dashed rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.08);
}
.card-in-pile {
  position: absolute;
  left: 0;
  width: 100%;
}

/* 拖曳動態視覺反饋 */
.drag-over {
  background: rgba(255, 255, 255, 0.15) !important;
  border: 2px solid #ffffff !important;
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
}

/* 勝利彈窗 Google 扁平化風格 */
.victory-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border-radius: 24px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.victory-content {
  background: #ffffff;
  padding: 40px 60px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  color: #202124;
}
.victory-icon {
  font-size: 72px;
  margin-bottom: 15px;
}
.victory-content h2 {
  font-size: 30px;
  color: #1e7a4d;
  margin-bottom: 8px;
  font-weight: 700;
}
.victory-content p {
  font-size: 16px;
  color: #5f6368;
  margin-bottom: 25px;
}

/* 完美的 RWD 響應式微調 */
@media (max-width: 850px) {
  .solitaire-game {
    padding: 20px;
  }
  .card,
  .card-slot,
  .tableau-pile-container,
  .tableau-slot {
    width: 80px;
    height: 115px;
  }
  .card-corner .val {
    font-size: 16px;
  }
  .suit-center {
    font-size: 32px;
  }
  .tableau-row,
  .foundation-group,
  .stock-waste-group {
    gap: 12px;
  }
  .card-in-pile {
    transform: translateY(0);
  }
}

@media (max-width: 680px) {
  .solitaire-game {
    padding: 12px;
    border-radius: 12px;
  }
  .card,
  .card-slot,
  .tableau-pile-container,
  .tableau-slot {
    width: 56px;
    height: 80px;
    border-radius: 6px;
  }
  .card-back {
    border-width: 2px;
  }
  .card-corner .val {
    font-size: 13px;
  }
  .card-corner .suit-mini {
    font-size: 10px;
  }
  .suit-center {
    font-size: 22px;
  }
  .stats {
    gap: 15px;
  }
  .stat-item .value {
    font-size: 16px;
  }
  .stat-item .label {
    font-size: 10px;
  }
  .tableau-row,
  .foundation-group,
  .stock-waste-group {
    gap: 8px;
  }
  .empty-suit-icon {
    font-size: 24px;
  }
}
</style>
