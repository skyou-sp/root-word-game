// 음성: 브라우저 내장 음성 합성(Web Speech API)으로 영어 단어/문장을 읽어 준다. 별도 설치나 서버가 필요 없다.
function speak(text) {
  if (!("speechSynthesis" in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.9;
  const voice = speechSynthesis.getVoices().find(v => v.lang === "en-US");
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

function stopSpeech() { if ("speechSynthesis" in window) speechSynthesis.cancel(); }
