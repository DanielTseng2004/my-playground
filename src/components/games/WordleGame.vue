<template>
  <div class="game-container wordle-game">
    <div class="board">
      <div
        v-for="(row, i) in 6"
        :key="i"
        class="word-row"
      >
        <div
          v-for="(col, j) in 5"
          :key="j"
          class="letter-box"
          :class="getLetterClass(i, j)"
        >
          {{ getLetter(i, j) }}
        </div>
      </div>
    </div>

    <div
      v-if="gameOver"
      class="status"
    >
      <h2 :class="won ? 'win-text' : 'lose-text'">
        {{ won ? "太棒了！🎉" : "再接再厲！" }}
      </h2>
      <p
        v-if="!won"
        class="answer"
      >
        答案是: <span class="answer-text">{{ solution }}</span>
      </p>
      <n-button
        type="primary"
        @click="initGame"
        >再玩一次</n-button
      >
    </div>

    <div
      class="keyboard"
      v-else
    >
      <div
        class="keyboard-row"
        v-for="(row, i) in keyboardRows"
        :key="i"
      >
        <button
          v-for="key in row"
          :key="key"
          @click="handleKey(key)"
          :class="{
            wide: key === 'Enter' || key === 'Del',
            ...{ [getKeyboardKeyClass(key)]: true },
          }"
        >
          {{ key }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { NButton } from "naive-ui";

const words = [
  "APPLE",
  "BEACH",
  "BRAIN",
  "CLOUD",
  "DREAM",
  "FLAME",
  "GHOST",
  "HEART",
  "LIGHT",
  "MUSIC",
  "OCEAN",
  "PIANO",
  "QUICK",
  "RIVER",
  "SMILE",
  "THINK",
  "UNITY",
  "VOICE",
  "WATCH",
  "YOUTH",
  "CRANE",
  "SLATE",
  "TRACE",
  "AUDIO",
  "RAISE",
  "STARE",
  "ARISE",
  "SNARE",
  "LEAST",
  "IRATE",
  "CRATE",
  "TRAIN",
  "TRAIL",
  "REALM",
  "PEARL",
  "FLAME",
  "BLEND",
  "CRISP",
  "DWARF",
  "EXPEL",
  "FROST",
  "GRILL",
  "HARSH",
  "INKED",
  "JOUST",
  "KNEEL",
  "LEMON",
  "MOIST",
  "NOBLE",
  "OLIVE",
  "PLUME",
  "QUEST",
  "RISKY",
  "SCORN",
  "TIGER",
  "UNITY",
  "VENOM",
  "WRING",
  "YACHT",
  "ZONAL",
  // --- 新增：強力開局字與高頻母音字 ---
  "ADIEU",
  "ROAST",
  "CLONE",
  "SHARE",
  "TEARS",
  "RELAX",
  "ALIEN",
  "GUIDE",
  "HOUSE",
  "PLANT",
  "HEART",
  "SMART",
  "STORE",
  "ALIVE",
  "BLAST",
  // --- 新增：常見常用字（補強不同子音開頭） ---
  "BEACH",
  "BRICK",
  "CHAIR",
  "CHIEF",
  "CLOCK",
  "CROWD",
  "DRIVE",
  "DREAM",
  "FAINT",
  "FLUTE",
  "FRONT",
  "GHOST",
  "GRAPH",
  "GRAPE",
  "GREEN",
  "HEAVY",
  "LIGHT",
  "MATCH",
  "NIGHT",
  "OCEAN",
  "PILOT",
  "PRIDE",
  "SHARK",
  "SHIRT",
  "SMILE",
  "SNAKE",
  "SPARK",
  "SPOON",
  "STAGE",
  "STORM",
  "SWEET",
  "THINK",
  "THROW",
  "TOWEL",
  "TRUCK",
  "VOICE",
  "WATCH",
  "WATER",
  "WHEAT",
  "WORLD",
  // --- 新增：趣味與特殊字母組合 ---
  "BLIMP",
  "CLERK",
  "FLICK",
  "FLOCK",
  "GLOVE",
  "JUICY",
  "LUNCH",
  "MANGO",
  "PIZZA",
  "PROUD",
  "SHAVE",
  "SKATE",
  "TRASH",
  "VAPOR",
  "WHALE",
  "ZEBRA",
];
const keyboardRows = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Enter", "Z", "X", "C", "V", "B", "N", "M", "Del"],
];

const solution = ref("");
const guesses = ref<string[]>([]);
const currentGuess = ref("");
const gameOver = ref(false);
const won = ref(false);
const keyboardStatus = ref<{ [key: string]: "correct" | "present" | "absent" }>(
  {},
);

function initGame() {
  solution.value = words[Math.floor(Math.random() * words.length)];
  guesses.value = [];
  currentGuess.value = "";
  gameOver.value = false;
  won.value = false;
  keyboardStatus.value = {};
}

function handleKey(key: string) {
  if (gameOver.value) return;

  if (key === "Enter") {
    if (currentGuess.value.length === 5) {
      submitGuess();
    }
  } else if (key === "Del") {
    currentGuess.value = currentGuess.value.slice(0, -1);
  } else if (currentGuess.value.length < 5) {
    currentGuess.value += key;
  }
}

function handleKeyboardInput(event: KeyboardEvent) {
  const key = event.key.toUpperCase();

  // 檢查是否是字母 (A-Z)
  if (/^[A-Z]$/.test(key)) {
    event.preventDefault();
    handleKey(key);
  }
  // 檢查是否是 Enter 鍵
  else if (event.key === "Enter") {
    event.preventDefault();
    handleKey("Enter");
  }
  // 檢查是否是 Backspace 鍵
  else if (event.key === "Backspace") {
    event.preventDefault();
    handleKey("Del");
  }
}

function submitGuess() {
  guesses.value.push(currentGuess.value);
  updateKeyboardStatus();
  if (currentGuess.value === solution.value) {
    won.value = true;
    gameOver.value = true;
  } else if (guesses.value.length === 6) {
    gameOver.value = true;
  }
  currentGuess.value = "";
}

function updateKeyboardStatus() {
  const lastGuess = guesses.value[guesses.value.length - 1];
  for (let i = 0; i < lastGuess.length; i++) {
    const letter = lastGuess[i];
    if (letter === solution.value[i]) {
      keyboardStatus.value[letter] = "correct";
    } else if (
      solution.value.includes(letter) &&
      keyboardStatus.value[letter] !== "correct"
    ) {
      keyboardStatus.value[letter] = "present";
    } else if (!keyboardStatus.value[letter]) {
      keyboardStatus.value[letter] = "absent";
    }
  }
}

function getKeyboardKeyClass(key: string): string {
  if (key === "Enter" || key === "Del") return "";
  return keyboardStatus.value[key] || "";
}

function getLetter(row: number, col: number) {
  if (row < guesses.value.length) {
    return guesses.value[row][col];
  }
  if (row === guesses.value.length) {
    return currentGuess.value[col] || "";
  }
  return "";
}

function getLetterClass(row: number, col: number) {
  if (row >= guesses.value.length) return "";

  const letter = guesses.value[row][col];
  if (letter === solution.value[col]) return "correct";
  if (solution.value.includes(letter)) return "present";
  return "absent";
}

onMounted(() => {
  initGame();
  // 添加鍵盤事件監聽
  window.addEventListener("keydown", handleKeyboardInput);
});

onUnmounted(() => {
  // 移除鍵盤事件監聽
  window.removeEventListener("keydown", handleKeyboardInput);
});
</script>

<style scoped>
.wordle-game {
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

.board {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.word-row {
  display: flex;
  gap: 5px;
}

.letter-box {
  width: 50px;
  height: 50px;
  border: 2px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  text-transform: uppercase;
  background: white;
  transition: all 0.3s;
}

.letter-box.correct {
  background: #6aaa64;
  color: white;
  border-color: #6aaa64;
  animation: letterFlip 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.letter-box.present {
  background: #c9b458;
  color: white;
  border-color: #c9b458;
  animation: letterFlip 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.letter-box.absent {
  background: #787c7e;
  color: white;
  border-color: #787c7e;
  animation: letterFlip 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.status {
  text-align: center;
  padding: 20px 40px;
  background: #f5f5f5;
  border-radius: 12px;
}

.win-text {
  color: #52c41a;
  animation: winBounce 0.6s ease infinite;
}

.lose-text {
  color: #f5222d;
}

.answer {
  margin: 10px 0;
  font-size: 16px;
}

.answer-text {
  font-weight: 600;
  color: #1890ff;
  font-size: 18px;
}

.keyboard {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.keyboard button {
  padding: 15px 10px;
  border-radius: 4px;
  border: none;
  background: #d3d6da;
  font-weight: bold;
  cursor: pointer;
  min-width: 35px;
  transition: all 0.2s;
}

.keyboard button:hover {
  background: #b0b3b8;
  transform: translateY(-2px);
}

.keyboard button:active {
  transform: translateY(0);
}

.keyboard button.wide {
  min-width: 65px;
}

.keyboard button.correct {
  background: #6aaa64;
  color: white;
  border-color: #6aaa64;
}

.keyboard button.correct:hover {
  background: #5a9a54;
}

.keyboard button.present {
  background: #c9b458;
  color: white;
  border-color: #c9b458;
}

.keyboard button.present:hover {
  background: #b9a448;
}

.keyboard button.absent {
  background: #787c7e;
  color: white;
  border-color: #787c7e;
  cursor: not-allowed;
}

.keyboard button.absent:hover {
  background: #787c7e;
  transform: none;
}

@keyframes letterFlip {
  0% {
    transform: rotateX(0deg);
  }
  50% {
    transform: rotateX(90deg);
  }
  100% {
    transform: rotateX(0deg);
  }
}

@keyframes winBounce {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 響應式設計 */
/* 平板設備 (768px 以下) */
@media (max-width: 768px) {
  .wordle-game {
    padding: 15px;
    gap: 15px;
  }

  .letter-box {
    width: 40px;
    height: 40px;
    font-size: 20px;
    border: 1.5px solid #ccc;
  }

  .keyboard button {
    padding: 12px 8px;
    font-size: 13px;
    min-width: 30px;
  }

  .keyboard button.wide {
    min-width: 55px;
  }

  .status {
    padding: 15px 30px;
  }

  .answer-text {
    font-size: 16px;
  }
}

/* 手機設備 (480px 以下) */
@media (max-width: 480px) {
  .wordle-game {
    padding: 10px;
    gap: 12px;
  }

  .board {
    gap: 3px;
  }

  .word-row {
    gap: 3px;
  }

  .letter-box {
    width: 32px;
    height: 32px;
    font-size: 18px;
    border: 1px solid #ccc;
  }

  .keyboard {
    gap: 5px;
    margin-top: 15px;
  }

  .keyboard-row {
    gap: 2px;
  }

  .keyboard button {
    padding: 10px 6px;
    font-size: 11px;
    min-width: 26px;
    border-radius: 3px;
  }

  .keyboard button.wide {
    min-width: 48px;
    font-size: 10px;
  }

  .status {
    padding: 12px 20px;
    border-radius: 8px;
  }

  .status h2 {
    font-size: 1.3rem;
    margin: 0 0 10px 0;
  }

  .answer {
    margin: 8px 0;
    font-size: 14px;
  }

  .answer-text {
    font-size: 15px;
  }
}
</style>
