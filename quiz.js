const HINT_BONUS_MOVES = 3;
const HINT_LIMITS = { easy: 10, medium: 5, hard: 3 };

// Replace these with your own 10 questions. correctIndex is 0-based into options.
const QUESTION_BANK = [
  { question: "Placeholder question 1 — replace me", options: ["A", "B", "C", "D"], correctIndex: 0 },
  { question: "Placeholder question 2 — replace me", options: ["A", "B", "C", "D"], correctIndex: 0 },
  { question: "Placeholder question 3 — replace me", options: ["A", "B", "C", "D"], correctIndex: 0 },
  { question: "Placeholder question 4 — replace me", options: ["A", "B", "C", "D"], correctIndex: 0 },
  { question: "Placeholder question 5 — replace me", options: ["A", "B", "C", "D"], correctIndex: 0 },
  { question: "Placeholder question 6 — replace me", options: ["A", "B", "C", "D"], correctIndex: 0 },
  { question: "Placeholder question 7 — replace me", options: ["A", "B", "C", "D"], correctIndex: 0 },
  { question: "Placeholder question 8 — replace me", options: ["A", "B", "C", "D"], correctIndex: 0 },
  { question: "Placeholder question 9 — replace me", options: ["A", "B", "C", "D"], correctIndex: 0 },
  { question: "Placeholder question 10 — replace me", options: ["A", "B", "C", "D"], correctIndex: 0 }
];

let usedQuestionIndices = [];
function updateHintButton() {
  const btn = document.getElementById('hint-button');
  const limit = HINT_LIMITS[state.difficulty];
  const remaining = limit - state.hintsUsed;

  if (remaining <= 0) {
    btn.disabled = true;
    btn.textContent = 'No hints left';
  } else {
    btn.disabled = false;
    btn.textContent = `+3 Moves (${remaining} left)`;
  }
}
function getNextQuestion() {
  if (usedQuestionIndices.length >= QUESTION_BANK.length) {
    usedQuestionIndices = []; // exhausted the bank — reset and allow repeats again
  }
  const available = QUESTION_BANK
    .map((_, i) => i)
    .filter(i => !usedQuestionIndices.includes(i));
  const chosen = available[Math.floor(Math.random() * available.length)];
  usedQuestionIndices.push(chosen);
  return QUESTION_BANK[chosen];
}

function openHintModal() {
  if (!state.started || state.gameOver || state.turn !== 'sheep' || state.quizOpen) return;

  const limit = HINT_LIMITS[state.difficulty];
  if (state.hintsUsed >= limit) return; // shouldn't normally fire since the button disables itself, but safe either way

  state.hintsUsed++;
  updateHintButton();

  state.quizOpen = true;
  const q = getNextQuestion();
  const questionEl = document.getElementById('quiz-question');
  const optionsEl = document.getElementById('quiz-options');

  questionEl.textContent = q.question;
  optionsEl.innerHTML = '';

  q.options.forEach((optionText, i) => {
    const btn = document.createElement('button');
    btn.textContent = optionText;
    btn.addEventListener('click', () => handleQuizAnswer(i === q.correctIndex));
    optionsEl.appendChild(btn);
  });

  document.getElementById('quiz-modal').classList.remove('hidden');
}



function handleQuizAnswer(isCorrect) {
  document.getElementById('quiz-modal').classList.add('hidden');
  state.quizOpen = false;

  if (isCorrect) {
    state.movesRemaining += HINT_BONUS_MOVES;
    renderTurnIndicator();
  } else {
    endGame('quizFailed');
  }
}