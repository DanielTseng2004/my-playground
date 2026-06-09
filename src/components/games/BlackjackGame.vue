<template>
  <div class="game-container blackjack-game">
    <div class="dealer-area">
      <h3>莊家</h3>
      <div class="cards">
        <div v-for="(card, index) in dealerCards" :key="index" class="card" :class="{ hidden: index === 1 && !gameOver, dealing: true }" :style="{ animationDelay: index * 0.2 + 's' }">
          {{ (index === 1 && !gameOver) ? '?' : card.suit + card.value }}
        </div>
      </div>
      <p v-if="gameOver" class="score-display">得分: <span class="score-value">{{ dealerScore }}</span></p>
    </div>

    <div class="player-area">
      <h3>玩家</h3>
      <div class="cards">
        <div v-for="(card, index) in playerCards" :key="index" class="card dealing" :style="{ animationDelay: index * 0.2 + 's' }">
          {{ card.suit }}{{ card.value }}
        </div>
      </div>
      <p class="score-display">得分: <span class="score-value">{{ playerScore }}</span></p>
    </div>

    <div class="controls">
      <n-button v-if="!gameStarted" type="primary" @click="startGame">開始遊戲</n-button>
      <template v-else-if="!gameOver">
        <n-button type="info" @click="hit">要牌 (Hit)</n-button>
        <n-button type="warning" @click="stand">停牌 (Stand)</n-button>
      </template>
      <n-button v-else type="primary" @click="startGame">再玩一次</n-button>
    </div>

    <transition name="result-fade">
      <div v-if="gameOver" class="result" :class="getResultClass()">
        <div class="result-icon">{{ getResultIcon() }}</div>
        <h2>{{ resultMessage }}</h2>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NButton } from 'naive-ui';

interface Card {
  suit: string;
  value: string;
  rank: number;
}

const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const deck = ref<Card[]>([]);
const playerCards = ref<Card[]>([]);
const dealerCards = ref<Card[]>([]);
const gameStarted = ref(false);
const gameOver = ref(false);
const resultMessage = ref('');

function createDeck() {
  const newDeck: Card[] = [];
  for (const suit of suits) {
    for (let i = 0; i < values.length; i++) {
      newDeck.push({
        suit,
        value: values[i],
        rank: i + 1 > 10 ? 10 : (i === 0 ? 11 : i + 1)
      });
    }
  }
  return newDeck.sort(() => Math.random() - 0.5);
}

function calculateScore(cards: Card[]) {
  let score = cards.reduce((sum, card) => sum + card.rank, 0);
  let aces = cards.filter(card => card.value === 'A').length;
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
  resultMessage.value = '';
  
  if (playerScore.value === 21) {
    stand();
  }
}

function hit() {
  playerCards.value.push(deck.value.pop()!);
  if (playerScore.value > 21) {
    endGame('玩家爆牌，莊家獲勝！');
  }
}

async function stand() {
  while (dealerScore.value < 17) {
    dealerCards.value.push(deck.value.pop()!);
  }
  
  if (dealerScore.value > 21) {
    endGame('莊家爆牌，玩家獲勝！');
  } else if (dealerScore.value > playerScore.value) {
    endGame('莊家獲勝！');
  } else if (dealerScore.value < playerScore.value) {
    endGame('玩家獲勝！');
  } else {
    endGame('平手！');
  }
}

function endGame(msg: string) {
  resultMessage.value = msg;
  gameOver.value = true;
}

function getResultClass() {
  if (resultMessage.value.includes('玩家獲勝') || resultMessage.value.includes('爆牌')) return 'win';
  if (resultMessage.value.includes('平手')) return 'draw';
  return 'lose';
}

function getResultIcon() {
  if (resultMessage.value.includes('玩家獲勝') || resultMessage.value.includes('爆牌')) return '🎉';
  if (resultMessage.value.includes('平手')) return '🤝';
  return '😢';
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

.cards {
  display: flex;
  gap: 10px;
  margin: 10px 0;
}

.card {
  width: 60px;
  height: 90px;
  border: 1px solid #ccc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  font-size: 20px;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
  transition: all 0.3s;
}

.card.dealing {
  animation: cardDeal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card.hidden {
  background: linear-gradient(135deg, #2c3e50, #34495e);
  color: #2c3e50;
}

.score-display {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.score-value {
  color: #1890ff;
  font-size: 20px;
  animation: scoreFlash 0.5s ease;
}

.result {
  margin-top: 20px;
  padding: 20px 40px;
  border-radius: 12px;
  text-align: center;
  animation: resultPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.result.win {
  background: linear-gradient(135deg, #d4edda, #c3f7d2);
  border: 2px solid #52c41a;
}

.result.lose {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  border: 2px solid #f5222d;
}

.result.draw {
  background: linear-gradient(135deg, #e2e3e5, #d6d8db);
  border: 2px solid #666;
}

.result-icon {
  font-size: 40px;
  margin-bottom: 10px;
  animation: bounce 0.6s ease infinite;
}

.result h2 {
  margin: 0;
  font-size: 20px;
}

.controls {
  display: flex;
  gap: 10px;
}

@keyframes cardDeal {
  0% {
    transform: translateX(-100px) rotateY(90deg);
    opacity: 0;
  }
  100% {
    transform: translateX(0) rotateY(0deg);
    opacity: 1;
  }
}

@keyframes scoreFlash {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

@keyframes resultPop {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.result-fade-enter-active,
.result-fade-leave-active {
  transition: all 0.4s ease;
}

.result-fade-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .blackjack-game {
    padding: 15px;
  }

  .cards {
    gap: 8px;
    flex-wrap: wrap;
  }

  .card {
    width: 50px;
    height: 75px;
    font-size: 16px;
  }

  .score-display {
    font-size: 14px;
  }

  .score-value {
    font-size: 18px;
  }

  .result {
    padding: 15px 30px;
  }

  .result h2 {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .blackjack-game {
    padding: 10px;
    gap: 10px;
  }

  .cards {
    gap: 5px;
  }

  .card {
    width: 40px;
    height: 60px;
    font-size: 13px;
    box-shadow: 1px 1px 3px rgba(0,0,0,0.1);
  }

  .score-display {
    font-size: 12px;
  }

  .score-value {
    font-size: 16px;
  }

  .result {
    margin-top: 15px;
    padding: 12px 20px;
    border-radius: 8px;
  }

  .result-icon {
    font-size: 30px;
    margin-bottom: 8px;
  }

  .result h2 {
    font-size: 16px;
  }

  .controls {
    flex-direction: column;
    gap: 8px;
  }

  .controls button {
    width: 100%;
  }
}
</style>
