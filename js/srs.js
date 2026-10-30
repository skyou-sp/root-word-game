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

function makeChoices(word) {
  const others = allWords().filter(x => x.w !== word.w && x.ko !== word.ko);
  const wrongs = [];
  while (wrongs.length < 3 && others.length) wrongs.push(others.splice(Math.floor(Math.random() * others.length), 1)[0].ko);
  const choices = wrongs.concat(word.ko);
  for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
  return choices;
}
