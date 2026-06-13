import { Settings } from '../settings/settings.js';
import { Words } from '../settings/words.js';

export class Game {
  constructor(settings, speaker, questions, timer, ui, score) {
    this.settings = settings;
    this.speaker = speaker;
    this.questions = questions;

    this.timer = timer;
    this.timer.addEventListener(Timer.TIME_UP_EVENT, () => this.answerQuestion());

    this.ui = ui;
    this.ui.addEventListener(UI.ANSWER_EVENT, () => this.answerQuestion());
    this.ui.addEventListener(UI.NEXT_QUESTION_EVENT, () => this.nextQuestion());

    this.score = score;
    this.answers = [];
  }

  askQuestion() {
    this.timer.reset();
    this.speaker.ask(this.questions.currentQuestion, () => this.timer.start());
  }

  answerQuestion() {
    this.speaker.stop();
    this.timer.stop();

    const answer = new Answer(
      this.questions.currentQuestionIndex + 1,
      this.questions.currentQuestion,
      this.ui.answer.value,
      this.timer.timePassed,
    );

    this.answers.push(answer);

    if (answer.isCorrect) {
      this.score.answeredCorrectly();
    }

    this.ui.showAnswer(answer);
  }

  nextQuestion() {
    const nextQuestion = this.questions.next();

    if (nextQuestion) {
      this.askQuestion();
    } else {
      this.openEndScreen(this.score.score, this.answers);
    }
  }

  openEndScreen(score, answers) {
    const gameResult = {
      score,
      answers,
    };

    sessionStorage.setItem("gameResult", JSON.stringify(gameResult));

    window.open("../score", "_self");
  }
}

export class Questions extends EventTarget {
  static NEXT_QUESTION_EVENT = "next";

  constructor({ numberOfQuestions }) {
    super();
    this.numberOfQuestions = numberOfQuestions;

    this.questions = this.generateQuestions();
    this.currentQuestionIndex = 0;
  }

  get all() {
    return this.questions;
  }

  get currentQuestion() {
    return this.questions[this.currentQuestionIndex];
  }

  get length() {
    return this.questions.length;
  }

  next() {
    if (this.currentQuestionIndex === this.length - 1) {
      return null;
    }

    this.currentQuestionIndex++;

    this.dispatchEvent(new CustomEvent(
      Questions.NEXT_QUESTION_EVENT,
      { detail: { currentQuestionIndex: this.currentQuestionIndex, currentQuestion: this.currentQuestion }, },
    ));

    return this.currentQuestion;
  }

  generateQuestions() {
    const words = new Words().load();

    const questionLimit = Math.min(this.numberOfQuestions, words.length);

    for (let i = 0; i < questionLimit; i++) {
      const j = i + Math.floor(Math.random() * (words.length - i));
      [words[i], words[j]] = [words[j], words[i]];
    }

    const questions = [];
    for (let i = 0; i < questionLimit; i++) {
      const word = words[i];
      const question = new Question(word);
      questions.push(question);
    }

    return questions;
  }
}

export class Question {
  constructor({ word, definition, sentence }) {
    this.word = word;
    this.definition = definition;
    this.sentence = sentence;
  }
}

export class Answer {
  constructor(questionNumber, question, answer, timePassed) {
    this.questionNumber = questionNumber;
    this.question = question;
    this.answer = answer.trim().toLowerCase();
    this.timePassed = timePassed;

    this.isCorrect = this.question.word === this.answer;
  }
}

export class Speaker {
  constructor({ voice, rate, pitch, volume, autoSayWord, autoSayDefinition, autoSaySentence }) {
    this.queue = [];
    this.ready = false;

    this.rate = rate;
    this.pitch = pitch;
    this.volume = volume;
    this.autoSayWord = autoSayWord;
    this.autoSayDefinition = autoSayDefinition;
    this.autoSaySentence = autoSaySentence;

    const setVoice = () => {
      const voices = speechSynthesis.getVoices();
      this.voice = voices.find(v => v.name === voice) ?? voices[0];
      this.ready = true;
    }

    if (speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      speechSynthesis.onvoiceschanged = () => {
        setVoice();

        while (this.queue.length > 0) {
          const func = this.queue.pop();
          func();
        }
      }
    }
  }

  ask(question, onStart, onEnd) {
    const textParts = [];
    
    if (this.autoSayWord && question.word) {
      textParts.push(question.word);
    }

    if (this.autoSaySentence && question.sentence) {
      textParts.push(question.sentence);
    }

    if (this.autoSayDefinition && question.definition) {
      textParts.push(question.definition);
    }

    const text = textParts.join(", ");

    return this.say(text, onStart, onEnd);
  }

  say(text, onStart, onEnd) {
    if (!text) {
      onStart();
      onEnd();
      return;
    }

    if (!this.ready) {
      this.queue.push(() => this.say(text, onStart, onEnd));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.voice = this.voice;
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    utterance.volume = this.volume;
    utterance.lang = this.voice.lang;
    utterance.onstart = onStart;
    utterance.onend = onEnd;

    speechSynthesis.speak(utterance);
  }

  stop() {
    speechSynthesis.cancel();
  }
}

export class Timer extends EventTarget {
  static RESET_EVENT = "reset";
  static TICK_EVENT = "tick";
  static TIME_UP_EVENT = "end";

  constructor(duration) {
    super();
    this.duration = duration;
  }

  get timePassed() { return this.duration - this.time; }

  reset() {
    this.time = this.duration;
    this.dispatchEvent(new CustomEvent(Timer.RESET_EVENT));
  }

  start() {
    this.interval = setInterval(() => {
      this.time--;
      this.dispatchEvent(new CustomEvent(Timer.TICK_EVENT, { detail: { time: this.time } }));

      if (this.time === 0) {
        this.stop();
        this.dispatchEvent(new CustomEvent(Timer.TIME_UP_EVENT));
      }
    }, 1000);
  }

  stop() {
    clearInterval(this.interval);
  }
}

export class Score extends EventTarget {
  static SCORE_UPDATED;

  constructor(timer, secondsPerQuestion) {
    super();
    this.timer = timer;
    this.secondsPerQuestion = secondsPerQuestion;
    this.score = 0;
  }

  answeredCorrectly() {
    const increment = Math.round(this.timer.time / this.secondsPerQuestion * 15);

    this.score += increment;

    this.dispatchEvent(new CustomEvent(Score.SCORE_UPDATED, { detail: { increment, score: this.score } }));
  }
}

export class UI extends EventTarget {
  static ANSWER_EVENT = "answer";
  static NEXT_QUESTION_EVENT = "next";

  constructor(settings, speaker, questions, timer, score) {
    super();
    this.settings = settings;
    this.speaker = speaker;

    this.questions = questions;
    this.questions.addEventListener(Questions.NEXT_QUESTION_EVENT, () => this.updateQuestion());

    this.timer = timer;
    this.timer.addEventListener(Timer.RESET_EVENT, () => this.updateTimer(settings.timer.secondsPerQuestion));
    this.timer.addEventListener(Timer.TICK_EVENT, (e) => this.updateTimer(e.detail.time));

    this.score = score;
    this.score.addEventListener(Score.SCORE_UPDATED, (e) => this.updateScore(e.detail.increment, e.detail.score));

    this.answer = document.querySelector("#answer");

    this.scoreText = document.querySelector("#currentScore");
    this.scoreIncrementText = document.querySelector("#increment");
    this.currentQuestionText = document.querySelector("#currentQuestion");
    this.totalQuestionsText = document.querySelector("#totalQuestions");
    
    this.correctAnswerText = document.querySelector("#correctAnswer");
    this.sentenceText = document.querySelector("#sentence");
    this.definitionText = document.querySelector("#definition");
    
    this.timerText = document.querySelector("#timer");
    
    if (!settings.timer.enabled) {
      this.timerText.classList.add("hidden");
    }
    
    this.timeLeftText = document.querySelector("#currentTimeLeft");
    
    this.enterBtn = document.querySelector("#enterBtn");
    this.nextBtn = document.querySelector("#nextBtn");
    this.sayWordBtn = document.querySelector("#sayWordBtn");
    this.saySentenceBtn = document.querySelector("#saySentenceBtn");
    this.sayDefinitionBtn = document.querySelector("#sayDefinitionBtn");

    this.updateQuestion();

    document.querySelector("main").classList.remove("hidden");
    this.answer.focus();
  }

  updateQuestion() {
    this.answer.value = "";
    this.answer.readOnly = false;
    this.answer.classList.remove("correct", "wrong");
    this.answer.focus();

    this.correctAnswerText.innerText = "";
    this.sentenceText.innerText = "";
    this.definitionText.innerText = "";

    this.enterBtn.classList.remove("hidden");
    this.nextBtn.classList.add("hidden");

    this.enterBtn.onclick = () => {
      this.dispatchAnswer();
    };

    this.answer.onkeypress = (e) => {
      if (e.key === 'Enter' || e.keyCode === 13) {
        this.dispatchAnswer();
      }
    }

    if (this.questions.currentQuestion.word) {
      this.sayWordBtn.classList.remove("hidden");
    } else {
      this.sayWordBtn.classList.add("hidden");
    }

    this.sayWordBtn.onclick = () => {
      this.speaker.stop();
      this.speaker.say(this.questions.currentQuestion.word);
      this.answer.focus();
    };

    if (this.questions.currentQuestion.sentence) {
      this.saySentenceBtn.classList.remove("hidden");
    } else {
      this.saySentenceBtn.classList.add("hidden");
    }

    this.saySentenceBtn.onclick = () => {
      this.speaker.stop();
      this.speaker.say(this.questions.currentQuestion.sentence);
      this.answer.focus();
    };

    if (this.questions.currentQuestion.definition) {
      this.sayDefinitionBtn.classList.remove("hidden");
    } else {
      this.sayDefinitionBtn.classList.add("hidden");
    }

    this.sayDefinitionBtn.onclick = () => {
      this.speaker.stop();
      this.speaker.say(this.questions.currentQuestion.definition);
      this.answer.focus();
    };

    this.currentQuestionText.innerText = (this.questions.currentQuestionIndex + 1).toString();
    this.totalQuestionsText.innerText = this.questions.length.toString();
  }

  updateTimer(time) {
    this.timeLeftText.innerText = time;

    if (time <= 3) {
      this.timerText.classList.add("wrong");
    } else {
      this.timerText.classList.remove("wrong");
    }
  }

  updateScore(increment, score) {
    this.scoreText.innerText = score;
    this.scoreIncrementText.innerText = `+${increment}`;

    this.scoreIncrementText.classList.add("fade-out");

    this.scoreIncrementText.onanimationend = () => {
      this.scoreIncrementText.innerText = "";
      this.scoreIncrementText.classList.remove("fade-out");
    }
  }

  dispatchAnswer() {
    const answer = this.answer.value;
    this.dispatchEvent(new CustomEvent(UI.ANSWER_EVENT, { detail: { answer }, }));
  }

  showAnswer(answer) {
    if (answer.isCorrect) {
      this.answer.classList.add("correct");
    } else {
      this.answer.classList.add("wrong");
    }

    this.enterBtn.classList.add("hidden");
    this.nextBtn.classList.remove("hidden");

    this.answer.readOnly = true;

    this.answer.onkeypress = (e) => {
      if (e.key === 'Enter' || e.keyCode === 13) {
        this.dispatchNext();
      }
    }

    this.nextBtn.onclick = (e) => {
      this.dispatchNext();
    }

    if (answer.question.word) {
      this.correctAnswerText.innerText = answer.question.word;
    }

    if (answer.question.sentence) {
      this.sentenceText.innerText = `"${answer.question.sentence}"`;
    }

    if (answer.question.definition) {
      this.definitionText.innerText = answer.question.definition;
    }
  }

  dispatchNext() {
    this.dispatchEvent(new CustomEvent(UI.NEXT_QUESTION_EVENT));
  }
}

const settings = new Settings().load();
const questions = new Questions(settings.questions);
const timer = new Timer(settings.timer.secondsPerQuestion);
const score = new Score(timer, settings.timer.secondsPerQuestion);
const speaker = new Speaker(settings.voice);
const ui = new UI(settings, speaker, questions, timer, score);
const game = new Game(settings, speaker, questions, timer, ui, score);
game.askQuestion();
