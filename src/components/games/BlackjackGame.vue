<template>
  <div class="game-container blackjack-game">
    <div class="dealer-area">
      <h3>莊家</h3>
      <div class="cards">
        <div
          v-for="(card, index) in dealerCards"
          :key="index"
          class="card"
          :class="[
            { hidden: index === 1 && !gameOver, dealing: true },
            index === 1 && !gameOver ? '' : getSuitClass(card.suit),
          ]"
          :style="{ animationDelay: index * 0.2 + 's' }"
        >
          <span v-if="!(index === 1 && !gameOver)">
            {{ card.suit }}{{ card.value }}
          </span>
          <span
            v-else
            class="card-back"
            >?</span
          >
        </div>
      </div>
      <p
        v-if="gameOver"
        class="score-display"
      >
        得分: <span class="score-value">{{ dealerScore }}</span>
      </p>
      <p
        v-else
        class="score-display"
      >
        得分: <span class="score-value">?</span>
      </p>
    </div>

    <div class="player-area">
      <h3>玩家</h3>
      <div class="cards">
        <div
          v-for="(card, index) in playerCards"
          :key="index"
          class="card dealing"
          :class="getSuitClass(card.suit)"
          :style="{ animationDelay: index * 0.2 + 's' }"
        >
          {{ card.suit }}{{ card.value }}
        </div>
      </div>
      <p class="score-display">
        得分: <span class="score-value">{{ playerScore }}</span>
      </p>
    </div>

    <div class="controls">
      <n-button
        v-if="!gameStarted"
        type="primary"
        size="large"
        @click="startGame"
        >開始遊戲</n-button
      >
      <template v-else-if="!gameOver">
        <n-button
          type="info"
          size="large"
          @click="hit"
          >要牌 (Hit)</n-button
        >
        <n-button
          type="warning"
          size="large"
          @click="stand"
          >停牌 (Stand)</n-button
        >
      </template>
      <n-button
        v-else
        type="primary"
        size="large"
        @click="startGame"
        >再玩一次</n-button
      >
    </div>

    <transition name="result-fade">
      <div
        v-if="gameOver"
        class="result"
        :class="getResultClass()"
      >
        <div class="result-icon">{{ getResultIcon() }}</div>
        <h2 class="result-title">{{ resultMessage }}</h2>
        <div class="result-details">
          <div class="score-info">
            <span class="label">玩家得分:</span>
            <span class="score-highlight">{{ playerScore }}</span>
          </div>
          <div class="score-info">
            <span class="label">莊家得分:</span>
            <span class="score-highlight">{{ dealerScore }}</span>
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

const deck = ref<Card[]>([]);
const playerCards = ref<Card[]>([]);
const dealerCards = ref<Card[]>([]);
const gameStarted = ref(false);
const gameOver = ref(false);
const resultMessage = ref("");

function getSuitClass(suit: string): string {
  return suit === "♥" || suit === "♦" ? "red-suit" : "black-suit";
}

// 修正：使用 Fisher-Yates 洗牌演算法，確保完全隨機公平
function createDeck() {
  const newDeck: Card[] = [];
  for (const suit of suits) {
    for (let i = 0; i < values.length; i++) {
      newDeck.push({
        suit,
        value: values[i],
        rank: i + 1 > 10 ? 10 : i === 0 ? 11 : i + 1,
      });
    }
  }

  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

function calculateScore(cards: Card[]) {
  let score = cards.reduce((sum, card) => sum + card.rank, 0);
  let aces = cards.filter((card) => card.value === "A").length;
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
}

const playerScore = computed(() => calculateScore(playerCards.value));
const dealerScore = computed(() => calculateScore(dealerCards.value));

function startGame() {
  deck.value = createDeck();
  playerCards.value = [deck.value.pop()!, deck.value.pop()!];
  dealerCards.value = [deck.value.pop()!, deck.value.pop()!];
  gameStarted.value = true;
  gameOver.value = false;
  resultMessage.value = "";

  // 修正：起手天牌（Blackjack）公平性判定
  if (playerScore.value === 21 && dealerScore.value === 21) {
    endGame("雙方皆為 Blackjack，平手！");
  } else if (playerScore.value === 21) {
    endGame("Blackjack！玩家獲勝！");
  } else if (dealerScore.value === 21) {
    endGame("莊家 Blackjack，莊家獲勝！");
  }
}

function hit() {
  if (gameOver.value) return;

  playerCards.value.push(deck.value.pop()!);
  if (playerScore.value > 21) {
    endGame("玩家爆牌，莊家獲勝！");
  }
}

function stand() {
  if (gameOver.value) return;

  // 莊家小於 17 點必須強迫補牌
  while (dealerScore.value < 17) {
    dealerCards.value.push(deck.value.pop()!);
  }

  if (dealerScore.value > 21) {
    endGame("莊家爆牌，玩家獲勝！");
  } else if (dealerScore.value > playerScore.value) {
    endGame("莊家獲勝！");
  } else if (dealerScore.value < playerScore.value) {
    endGame("玩家獲勝！");
  } else {
    endGame("平手！");
  }
}

function endGame(msg: string) {
  resultMessage.value = msg;
  gameOver.value = true;
}

function getResultClass() {
  if (
    resultMessage.value.includes("玩家獲勝") ||
    resultMessage.value.includes("莊家爆牌") ||
    resultMessage.value.includes("玩家獲勝")
  )
    return "win";
  if (resultMessage.value.includes("平手")) return "draw";
  return "lose";
}

function getResultIcon() {
  if (
    resultMessage.value.includes("玩家獲勝") ||
    resultMessage.value.includes("莊家爆牌") ||
    resultMessage.value.includes("玩家獲勝")
  )
    return "🎉";
  if (resultMessage.value.includes("平手")) return "🤝";
  return "😢";
}
</script>

<style scoped>
.blackjack-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
  color: #333;
}

.dealer-area,
.player-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.cards {
  display: flex;
  gap: 10px;
  margin: 10px 0;
  min-height: 95px;
  justify-content: center;
}

.card {
  width: 60px;
  height: 90px;
  border: 2px solid #333;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
  font-size: 18px;
  font-weight: 600;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transition: all 0.3s;
  user-select: none;
}

.card.red-suit {
  color: #d32f2f;
}

.card.black-suit {
  color: #1a1a1a;
}

.card.dealing {
  animation: cardDeal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

.card.hidden {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: transparent;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border-color: #1a252f;
}

.card.hidden .card-back {
  color: #fff;
  font-size: 24px;
}

.score-display {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-top: 5px;
}

.score-value {
  color: #1890ff;
  font-size: 20px;
  font-weight: 700;
  animation: scoreFlash 0.5s ease;
}

.controls {
  display: flex;
  gap: 15px;
  margin: 10px 0;
}

.result {
  margin-top: 10px;
  padding: 20px 40px;
  border-radius: 12px;
  text-align: center;
  animation: resultPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  width: 280px;
}

.result.win {
  background: linear-gradient(135deg, #d4edda 0%, #c3f7d2 100%);
  border: 3px solid #52c41a;
}

.result.lose {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  border: 3px solid #f5222d;
}

.result.draw {
  background: linear-gradient(135deg, #e2e3e5 0%, #d6d8db 100%);
  border: 3px solid #666;
}

.result-icon {
  font-size: 40px;
  margin-bottom: 5px;
  animation: bounce 0.6s ease infinite;
  display: inline-block;
}

.result-title {
  margin: 5px 0 10px 0;
  font-size: 22px;
  font-weight: 700;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.score-info {
  font-size: 14px;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.label {
  font-weight: 600;
  color: #555;
}

.score-highlight {
  font-weight: 700;
  color: #1a1a1a;
  background: rgba(255, 255, 255, 0.6);
  padding: 1px 6px;
  border-radius: 4px;
}

/* 動畫定義 */
@keyframes cardDeal {
  0% {
    transform: translateY(-50px) rotate(-15deg);
    opacity: 0;
  }
  100% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
}

@keyframes scoreFlash {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

@keyframes resultPop {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.result-fade-enter-active,
.result-fade-leave-active {
  transition: all 0.3s ease;
}

.result-fade-enter-from,
.result-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* RWD 響應式微調 */
@media (max-width: 480px) {
  .card {
    width: 50px;
    height: 75px;
    font-size: 15px;
  }
  .card.hidden .card-back {
    font-size: 18px;
  }
  .controls {
    flex-direction: row;
    width: 100%;
    justify-content: center;
  }
}
</style>
