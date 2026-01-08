// State Variables
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = []; // To store history for review
let timer;
const TIME_LIMIT = 30;

// DOM Elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const timerDisplay = document.getElementById('timer');
const questionCountDisplay = document.getElementById('question-count');

// Event Listeners
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', resetGame);

async function startGame() {
    startScreen.classList.remove('active');
    quizScreen.classList.add('active');
    
    // Fetch 10 questions from Open Trivia DB
    try {
        const res = await fetch('https://opentdb.com/api.php?amount=10&type=multiple');
        const data = await res.json();
        questions = data.results;
        loadQuestion();
    } catch (error) {
        questionText.innerText = "Failed to load questions. Please refresh.";
    }
}

function resetGame() {
    score = 0;
    currentQuestionIndex = 0;
    userAnswers = [];
    resultScreen.classList.remove('active'); // Hidden is handled by CSS logic usually, but here we toggle active
    resultScreen.classList.add('hidden'); 
    startScreen.classList.add('active');
    quizScreen.classList.remove('active');
}

function loadQuestion() {
    clearInterval(timer);
    const currentQuestion = questions[currentQuestionIndex];
    
    // Update UI
    questionCountDisplay.innerText = `Question ${currentQuestionIndex + 1}/${questions.length}`;
    questionText.innerHTML = decodeHTML(currentQuestion.question);
    optionsContainer.innerHTML = '';
    
    // Mix correct and incorrect answers
    const answers = [...currentQuestion.incorrect_answers, currentQuestion.correct_answer];
    // Simple shuffle
    answers.sort(() => Math.random() - 0.5);

    answers.forEach(answer => {
        const button = document.createElement('button');
        button.innerHTML = decodeHTML(answer);
        button.classList.add('option-btn');
        button.addEventListener('click', () => selectAnswer(button, currentQuestion.correct_answer, answer));
        optionsContainer.appendChild(button);
    });

    startTimer();
}

function startTimer() {
    let timeLeft = TIME_LIMIT;
    timerDisplay.innerText = timeLeft;
    
    timer = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeOut();
        }
    }, 1000);
}

function handleTimeOut() {
    // Auto-record as incorrect (null answer)
    recordAnswer(false, "Time Out", questions[currentQuestionIndex].correct_answer);
    highlightCorrectAnswer();
    setTimeout(nextQuestion, 2000);
}

function selectAnswer(selectedButton, correctAnswer, selectedText) {
    clearInterval(timer);
    const isCorrect = selectedText === correctAnswer;
    
    // Visual Feedback
    if (isCorrect) {
        selectedButton.classList.add('correct');
        score++;
    } else {
        selectedButton.classList.add('incorrect');
        highlightCorrectAnswer();
    }

    recordAnswer(isCorrect, selectedText, correctAnswer);
    
    // Disable all buttons to prevent double clicking
    Array.from(optionsContainer.children).forEach(btn => btn.disabled = true);
    
    // Wait 1.5s then go next
    setTimeout(nextQuestion, 1500);
}

function highlightCorrectAnswer() {
    const correctText = questions[currentQuestionIndex].correct_answer;
    Array.from(optionsContainer.children).forEach(button => {
        if (button.innerHTML === decodeHTML(correctText)) {
            button.classList.add('correct');
        }
    });
}

function recordAnswer(isCorrect, userAns, correctAns) {
    userAnswers.push({
        question: questions[currentQuestionIndex].question,
        isCorrect: isCorrect,
        userAns: userAns,
        correctAns: correctAns
    });
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    quizScreen.classList.remove('active');
    resultScreen.classList.add('active');
    resultScreen.classList.remove('hidden');
    
    document.getElementById('final-score').innerText = score;
    document.getElementById('total-questions').innerText = questions.length;
    
    generateReview();
}

function generateReview() {
    const reviewList = document.getElementById('review-list');
    reviewList.innerHTML = '';
    
    userAnswers.forEach((item, index) => {
        const div = document.createElement('div');
        div.classList.add('review-item');
        div.innerHTML = `
            <div class="review-q">${index + 1}. ${decodeHTML(item.question)}</div>
            <div class="review-ans">
                You: <span class="${item.isCorrect ? 'text-green' : 'text-red'}">${decodeHTML(item.userAns)}</span> 
                ${!item.isCorrect ? `| Correct: <span class="text-green">${decodeHTML(item.correctAns)}</span>` : ''}
            </div>
        `;
        reviewList.appendChild(div);
    });
}

// Utility to decode HTML entities (e.g. &quot; -> ")
function decodeHTML(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}