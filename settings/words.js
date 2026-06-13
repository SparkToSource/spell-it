import data from '../assets/english.json' with { type: 'json' };

export class Words extends EventTarget {
  static FILE_KEY = "fileName";
  static WORDS_KEY = "words";
  static UPDATE_EVENT = "update";

  constructor() {
    super();
  }

  get hasUserUploadedWords() {
    return localStorage.getItem(Words.FILE_KEY) !== null;
  }

  load() {
    const words = localStorage.getItem(Words.WORDS_KEY);

    if (!words) {
      return this.getDefaultWords();
    }

    const result = JSON.parse(words);
    return result;
  }

  save(fileName, words) {
    localStorage.setItem(Words.FILE_KEY, fileName);
    localStorage.setItem(Words.WORDS_KEY, words);

    this.dispatchEvent(new CustomEvent(Words.UPDATE_EVENT));
  }

  delete() {
    localStorage.removeItem(Words.FILE_KEY);
    localStorage.removeItem(Words.WORDS_KEY);

    this.dispatchEvent(new CustomEvent(Words.UPDATE_EVENT));
  }

  getFileName() {
    return localStorage.getItem(Words.FILE_KEY) || "words.json";
  }

  asBlob() {
    const words = this.load();

    const blob = new Blob([JSON.stringify(words)], { type: "application/json" });

    return blob;
  }

  getDefaultWords() {
    return data;
  }
}
