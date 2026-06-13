export class Settings {
  static SETTINGS_KEY = "settings";
  
  load() {
    const savedSettings = localStorage.getItem(Settings.SETTINGS_KEY);
    const defaultSettings = this.getDefaultSettings();

    if (!savedSettings) {
      return defaultSettings;
    }

    const parsedSavedSettings = JSON.parse(savedSettings);
    const settings = this.singleDepthMerge(defaultSettings, parsedSavedSettings);

    return settings;
  }

  save(settings) {
    const savedSettings = this.load();
    const newSettings = this.singleDepthMerge(savedSettings, settings);
    localStorage.setItem(Settings.SETTINGS_KEY, JSON.stringify(newSettings));
  }

  delete() {
    localStorage.removeItem(Settings.SETTINGS_KEY);
  }

  getDefaultSettings() {
    const { voice, rate } = this.getDefaultVoice();

    return {
      questions: {
        numberOfQuestions: 15,
      },
      timer: {
        enabled: true,
        secondsPerQuestion: 15,
      },
      voice: {
        voice,
        rate,
        pitch: 1,
        volume: 1,
        autoSayWord: true,
        autoSaySentence: true,
        autoSayDefinition: true,
      },
    };
  }

  getDefaultVoice() {
    const browser = navigator.userAgent;

    if (/Edg/.test(browser)) {
      return { voice: "Microsoft Ava Multilingual Online (Natural) - English (United States)", rate: 1 };
    }

    if (/Chrome/.test(browser)) {
      return { voice: "English United States", rate: 0.8 };
    }

    return {voice: "", rate: 1 };
  }

  singleDepthMerge(obj1, obj2) {
    const result = { ...obj1, ...obj2 };

    for (const key of Object.keys(result)) {
      result[key] = { ...obj1[key], ...obj2[key] };
    }

    return result;
  }
}
