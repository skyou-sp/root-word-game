// 간격 반복: 단어마다 가중치를 계산해 틀린 단어, 오래 안 본 단어, 안 본 단어를 먼저 출제한다.
function allWords() {
  const list = [];
  ROOTS.forEach(r => r.words.forEach(w => list.push(Object.assign({ root: r.root, rootMeaning: r.meaning }, w))));
  return list;
}

function wordWeight(rec) {
  if (!rec) return 3; // 아직 안 본 단어
  const days = rec.last ? (Date.now() - rec.last) / 86400000 : 0;
  let weight = 1 + Math.min(days, 7) * 0.3;
  if (rec.wrong > 0 && !rec.overcome) weight += 4; // 취약 단어는 자주 등장
  return weight;
}

function pickQuestions(save, count) {
  const pool = allWords().map(w => ({ w, weight: wordWeight(save.words[w.w]) }));
  const picked = [];
  while (picked.length < count && pool.length) {
    const total = pool.reduce((a, b) => a + b.weight, 0);
    let r = Math.random() * total, i = 0;
    while (i < pool.length - 1 && r >= pool[i].weight) { r -= pool[i].weight; i++; }
    picked.push(pool.splice(i, 1)[0].w);
  }
  return picked;
}

// 뜻을 쉼표·공백 단위로 쪼개 어미를 떼고, 하나라도 겹치거나 포함하면 같은 뜻으로 본다.
// (예: "추론하다" ↔ "추론하다", "전화" ↔ "전화, 전화기", "수송하다" ↔ "수송, 통과")
// 오답 보기가 사실은 정답인 경우를 막으려고 전투·○× 퀴즈가 함께 쓴다.
function koTokens(ko) {
  return ko.split(/[,;\/·\s]+/)
    .map(s => s.replace(/[()~]/g, "").replace(/(하다|되다|하는|적인|적|인|의|한)$/, ""))
    .filter(s => s.length >= 2);
}
function koOverlap(a, b) {
  const ta = koTokens(a), tb = koTokens(b);
  return ta.some(x => tb.some(y => x === y || x.includes(y) || y.includes(x)));
}

// 어근 이름을 "/"로 나눈 철자들 (예: "com / con" → ["com", "con"]). 한 글자짜리는 제외.
function rootParts(root) {
  return root.toLowerCase().split("/").map(s => s.trim()).filter(s => s.length >= 2);
}
// 단어 철자에 그 어근의 철자가 들어 있으면 true.
// 다른 어근을 오답으로 낼 때, 사실은 그 어근도 들어 있는 단어(예: transfusion ↔ trans)를 거르는 데 쓴다.
function wordHasRoot(word, root) {
  const w = word.toLowerCase();
  return rootParts(root).some(p => w.includes(p));
}

function makeChoices(word) {
  const others = allWords().filter(x => x.w !== word.w && !koOverlap(x.ko, word.ko));
  const wrongs = [];
  while (wrongs.length < 3 && others.length) {
    const ko = others.splice(Math.floor(Math.random() * others.length), 1)[0].ko;
    if (!wrongs.includes(ko)) wrongs.push(ko); // 같은 뜻이 보기에 두 번 나오지 않게 한다
  }
  const choices = wrongs.concat(word.ko);
  for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
  return choices;
}
