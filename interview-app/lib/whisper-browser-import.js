// app/lib/whisper-browser-import.js
// IMPORTANT: This file must stay .js, not .ts

export async function loadWhisper() {
  const { pipeline } = await import("@xenova/transformers");
  return pipeline(
    "automatic-speech-recognition",
    "Xenova/whisper-tiny.en"
  );
}
