<template>
  <div class="game-container texas-game">
    <div class="opponent-hand">
      <h3>莊家手牌</h3>
      <div class="cards">
        <div
          v-for="(card, index) in opponentHand"
          :key="index"
          class="card"
          :class="{
            hidden: phase !== 'showdown',
            reveal: phase === 'showdown',
          }"
          :style="{ animationDelay: index * 0.1 + 's' }"
        >
          <span v-if="phase === 'showdown'" :class="getSuitClass(card.suit)">
            {{ card.suit }}{{ card.value }}
          </span>
          <span v-else class="card-back">?</span>
        </div>
      </div>
    </div>

    <div class="community-cards">
      <h3>公共牌</h3>
      <div class="cards">
        <div
          v-for="(card, index) in communityCards"
          :key="index"
          class="card"
          :class="getSuitClass(card.suit)"
          :style="{ animationDelay: index * 0.1 + 's' }"
        >
          {{ card.suit }}{{ card.value }}
        </div>
        <div
          v-for="n in 5 - communityCards.length"
          :key="'empty-' + n"
          class="card empty"
        >
          ?
        </div>
      </div>
    </div>

    <div class="player-hand">
      <h3>你的手牌</h3>
      <div class="cards">
        <div
          v-for="(card, index) in playerHand"
          :key="index"
          class="card"
          :class="getSuitClass(card.suit)"
          :style="{ animationDelay: index * 0.1 + 's' }"
        >
          {{ card.suit }}{{ card.value }}
        </div>
      </div>
    </div>

    <div class="controls">
      <n-button
        v-if="phase === 'idle'"
        type="primary"
        @click="startHand"
        >發牌</n-button
      >
      <n-button
        v-else-if="phase !== 'showdown'"
        type="info"
        @click="nextPhase"
      >
        {{
          phase === "preflop"
            ? "翻牌 (Flop)"
            : phase === "flop"
              ? "轉牌 (Turn)"
              : "河牌 (River)"
        }}
      </n-button>
      <n-button
        v-else
        type="primary"
        @click="startHand"
        >下一局</n-button
      >
    </div>

    <transition name="result-fade">
      <div
        v-if="phase === 'showdown'"
        class="result"
        :class="getResultClass()"
      >
        <div class="result-icon">{{ getResultIcon() }}</div>
        <h2 class="result-title">{{ gameResult }}</h2>
        <div class="result-details">
          <div class="hand-info">
            <span class="label">你的牌型:</span>
            <span class="rank-name">{{ playerHandRank.name }}</span>
          </div>
          <div class="hand-info">
            <span class="label">莊家牌型:</span>
            <span class="rank-name">{{ opponentHandRank.name }}</span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { NButton } from "naive-ui";

interface Card {
  suit: string;
  value: string;
  rank: number;
}

interface HandEvaluation {
  score: number; // 牌型分數 (1-9)
  name: string; // 牌型中文名稱
  ranks: number[]; // 用於同分時的比大小序列（包含主要對子與踢腳）
}

const suits = ["♠", "♥", "♦", "♣"];
const values = [
  { v: "2", r: 2 },
  { v: "3", r: 3 },
  { v: "4", r: 4 },
  { v: "5", r: 5 },
  { v: "6", r: 6 },
  { v: "7", r: 7 },
  { v: "8", r: 8 },
  { v: "9", r: 9 },
  { v: "10", r: 10 },
  { v: "J", r: 11 },
  { v: "Q", r: 12 },
  { v: "K", r: 13 },
  { v: "A", r: 14 },
];

const deck = ref<Card[]>([]);
const playerHand = ref<Card[]>([]);
const opponentHand = ref<Card[]>([]);
const communityCards = ref<Card[]>([]);
const phase = ref<"idle" | "preflop" | "flop" | "turn" | "river" | "showdown">(
  "idle",
);

function getSuitClass(suit: string): string {
  if (suit === "♥" || suit === "♦") {
    return "red-suit";
  }
  return "black-suit";
}

function createDeck() {
  const newDeck: Card[] = [];
  for (const suit of suits) {
    for (const val of values) {
      newDeck.push({ suit, value: val.v, rank: val.r });
    }
  }
  return newDeck.sort(() => Math.random() - 0.5);
}

function startHand() {
  deck.value = createDeck();
  playerHand.value = [deck.value.pop()!, deck.value.pop()!];
  opponentHand.value = [deck.value.pop()!, deck.value.pop()!];
  communityCards.value = [];
  phase.value = "preflop";
}

function nextPhase() {
  if (phase.value === "preflop") {
    communityCards.value.push(
      deck.value.pop()!,
      deck.value.pop()!,
      deck.value.pop()!,
    );
    phase.value = "flop";
  } else if (phase.value === "flop") {
    communityCards.value.push(deck.value.pop()!);
    phase.value = "turn";
  } else if (phase.value === "turn") {
    communityCards.value.push(deck.value.pop()!);
    phase.value = "river";
  } else if (phase.value === "river") {
    phase.value = "showdown";
  }
}

// 輔助函式：從 7 張牌中找出所有 5 張牌的組合 (C 7 取 5 = 21 種)
function getCombinations(cards: Card[]): Card[][] {
  const results: Card[][] = [];
  const f = (active: Card[], rest: Card[]) => {
    if (active.length === 5) {
      results.push(active);
      return;
    }
    for (let i = 0; i < rest.length; i++) {
      f([...active, rest[i]], rest.slice(i + 1));
    }
  };
  f([], cards);
  return results;
}

// 精準評估「剛好 5 張牌」的強弱
function evaluate5Cards(cards: Card[]): HandEvaluation {
  // 由大到小排序
  const sorted = [...cards].sort((a, b) => b.rank - a.rank);
  const ranks = sorted.map((c) => c.rank);

  const isFlush = new Set(sorted.map((c) => c.suit)).size === 1;

  // 檢查順子 (包含 A,2,3,4,5 的特殊情況)
  let isStraight = false;
  let straightRanks = [...ranks];
  if (ranks[0] - ranks[4] === 4 && new Set(ranks).size === 5) {
    isStraight = true;
  } else if (
    ranks[0] === 14 &&
    ranks[1] === 5 &&
    ranks[2] === 4 &&
    ranks[3] === 3 &&
    ranks[4] === 2
  ) {
    isStraight = true;
    straightRanks = [5, 4, 3, 2, 1]; // 將 A 當作 1 進行後續比大小
  }

  // 計算每一種點數出現的次數
  const counts: Record<number, number> = {};
  ranks.forEach((r) => (counts[r] = (counts[r] || 0) + 1));

  // 按出現次數排序，次數相同按點數大到小排序 (例如: 葫蘆 KKK22 -> [[3, 13], [2, 2]])
  const countPairs = Object.entries(counts)
    .map(([rank, count]) => ({
      rank: Number(rank),
      count,
    }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);

  // 根據次數組合判定牌型
  const c0 = countPairs[0].count;
  const c1 = countPairs[1] ? countPairs[1].count : 0;

  // 重新建立比大小用的權重陣列 (主要牌放在前面，踢腳牌放在後面)
  const compareRanks = countPairs.map((cp) => cp.rank);

  if (isFlush && isStraight) {
    return { score: 9, name: "同花順", ranks: straightRanks };
  }
  if (c0 === 4) {
    return { score: 8, name: "四條", ranks: compareRanks }; // [四條點數, 踢腳點數]
  }
  if (c0 === 3 && c1 === 2) {
    return { score: 7, name: "葫蘆", ranks: compareRanks }; // [三條點數, 對子點數]
  }
  if (isFlush) {
    return { score: 6, name: "同花", ranks: ranks }; // [最大張, ..., 最小張]
  }
  if (isStraight) {
    return { score: 5, name: "順子", ranks: straightRanks }; // [順子最大張, ...]
  }
  if (c0 === 3) {
    return { score: 4, name: "三條", ranks: compareRanks }; // [三條點數, 踢腳1, 踢腳2]
  }
  if (c0 === 2 && c1 === 2) {
    return { score: 3, name: "兩對", ranks: compareRanks }; // [大對子, 小對子, 踢腳]
  }
  if (c0 === 2) {
    return { score: 2, name: "一對", ranks: compareRanks }; // [對子點數, 踢腳1, 踢腳2, 踢腳3]
  }
  return { score: 1, name: "高牌", ranks: ranks }; // [最大張, ..., 最小張]
}

// 主評估函式：從 7 張牌選出最強的 5 張組合
function evaluateHand(hand: Card[], community: Card[]): HandEvaluation {
  const allCards = [...hand, ...community];
  if (allCards.length < 5) {
    return { score: 0, name: "未定", ranks: [] };
  }

  const combos = getCombinations(allCards);
  let bestHand = evaluate5Cards(combos[0]);

  for (let i = 1; i < combos.length; i++) {
    const current = evaluate5Cards(combos[i]);
    if (compareEvaluations(current, bestHand) > 0) {
      bestHand = current;
    }
  }
  return bestHand;
}

// 比較兩組 5 張牌的強弱 (回傳 > 0 代表 a 贏，< 0 代表 b 贏，0 代表完全平手)
function compareEvaluations(a: HandEvaluation, b: HandEvaluation): number {
  if (a.score !== b.score) {
    return a.score - b.score;
  }
  // 牌型相同時，依序比對 ranks 裡的每一張踢腳/主要點數
  for (let i = 0; i < a.ranks.length; i++) {
    if (a.ranks[i] !== b.ranks[i]) {
      return a.ranks[i] - b.ranks[i];
    }
  }
  return 0;
}

const playerHandRank = computed(() =>
  evaluateHand(playerHand.value, communityCards.value),
);
const opponentHandRank = computed(() =>
  evaluateHand(opponentHand.value, communityCards.value),
);

const gameResult = computed(() => {
  if (phase.value !== "showdown") return "";

  const result = compareEvaluations(
    playerHandRank.value,
    opponentHandRank.value,
  );
  if (result > 0) return "你贏了！";
  if (result < 0) return "莊家贏了！";
  return "平手！";
});

function getResultClass() {
  if (gameResult.value.includes("你贏")) return "win";
  if (gameResult.value.includes("平手")) return "draw";
  return "lose";
}

function getResultIcon() {
  if (gameResult.value.includes("你贏")) return "🎉";
  if (gameResult.value.includes("平手")) return "🤝";
  return "💀";
}
</script>

<style scoped>
.texas-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.cards {
  display: flex;
  gap: 10px;
  margin: 10px 0;
}

.card {
  width: 55px;
  height: 85px;
  border: 2px solid #333;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
  font-size: 18px;
  font-weight: 600;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transition: all 0.3s;
  animation: cardAppear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

.card.red-suit {
  color: #d32f2f;
}

.card.black-suit {
  color: #1a1a1a;
}

.card.hidden {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: transparent;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.card.hidden .card-back {
  color: #2c3e50;
}

.card.reveal {
  animation: cardReveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card.empty {
  background: #f9f9f9;
  color: #ddd;
  border-style: dashed;
  border-color: #ccc;
}

.result {
  text-align: center;
  padding: 30px 50px;
  border-radius: 12px;
  animation: resultPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.result.win {
  background: linear-gradient(135deg, #d4edda 0%, #c3f7d2 100%);
  border: 3px solid #52c41a;
  box-shadow: 0 0 30px rgba(82, 196, 26, 0.4), 0 8px 24px rgba(0, 0, 0, 0.15);
}

.result.lose {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  border: 3px solid #f5222d;
  box-shadow: 0 0 30px rgba(245, 34, 45, 0.4), 0 8px 24px rgba(0, 0, 0, 0.15);
}

.result.draw {
  background: linear-gradient(135deg, #e2e3e5 0%, #d6d8db 100%);
  border: 3px solid #666;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2), 0 8px 24px rgba(0, 0, 0, 0.15);
}

.result-icon {
  font-size: 48px;
  margin-bottom: 15px;
  animation: bounce 0.6s ease infinite;
  display: inline-block;
}

.result-title {
  margin: 15px 0 20px 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 1px;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 15px;
}

.hand-info {
  font-size: 15px;
  display: flex;
  justify-content: center;
  gap: 8px;
  color: #333;
}

.label {
  font-weight: 600;
  color: #555;
}

.rank-name {
  font-weight: 700;
  color: #1a1a1a;
  background: rgba(255, 255, 255, 0.6);
  padding: 2px 8px;
  border-radius: 4px;
}

@keyframes cardAppear {
  0% {
    opacity: 0;
    transform: translateY(-20px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes cardReveal {
  0% {
    transform: rotateY(90deg);
  }
  100% {
    transform: rotateY(0deg);
  }
}

@keyframes resultPop {
  0% {
    opacity: 0;
    transform: scale(0.5) rotateX(-20deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotateX(0deg);
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}

.result-fade-enter-active,
.result-fade-leave-active {
  transition: all 0.4s ease;
}

.result-fade-enter-from {
  opacity: 0;
  transform: scale(0.8);
}
</style>
