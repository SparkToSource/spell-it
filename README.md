# Spell-It

A lightweight, browser-based spelling game, hosted at [https://sparktosource.github.io/spell-it](https://sparktosource.github.io/spell-it), that reads words aloud and help users practice spelling. Add your own word lists and voices to support multiple languages and accents.

## Run locally
Clone the repository and start a local server in the project directory:

```bash
git clone https://github.com/SparkToSource/spell-it.git
cd spell-it
npx live-server
```

## Adding Voices/Languages

The game uses the browser's [SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) ([Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)) to read words aloud when a round starts. The [Microsoft Edge Browser](https://www.microsoft.com/en-us/edge/download) includes hundreds of high-quality voices in many languages by default. If you use a browser that offers few voices that sound robotic or would like to use a different language, install additional voices at the operating-system level so your browser can use them.

Please open the Settings page to adjust the language, voice, speed, and other preferences.

## Changing Words

The game includes a default list of hundreds of English words called [english.json](https://github.com/SparkToSource/spell-it/blob/main/assets/english.json). To use a different list, go to the Settings page and upload a JSON file containing a list of items with this exact structure: `{ "word": "", "description": "", "sentence": "" }`.

Values can be in any language. If you also select a matching voice, you can practice languages other than English.

**Suggested AI prompt**: Generate a JSON list of 50 English words that follow this structure: { "word": "", "description": "", "sentence": "" }.