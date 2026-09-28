'use strict';
/* =====================================================================
   Logika inti KuisKu (versi sederhana + Room Master).
   Pemain pertama yang membuat/masuk ke room otomatis menjadi Host.
   ===================================================================== */
const crypto = require('crypto');
const QUIZZES_RAW = require('./quiz-data');

const MIN_PLAYERS    = Math.max(1, Number(process.env.MIN_PLAYERS) || 2);
const MAX_PLAYERS     = 20;
const QUESTION_MS     = 15000; 
const COUNTDOWN_MS    = 3000;  
const REVEAL_MS       = 4000;  
const HEARTBEAT_MS    = 8000;  
const POINTS_CORRECT  = 100;

// Menentukan indeks jawaban benar. "answer" boleh berupa nomor (0-3) ATAU teks yang sama
// persis dengan salah satu pilihan. Mengembalikan -1 kalau data soalnya tidak valid.
function correctIndex(q) {
  if (Number.isInteger(q.answer)) return (q.answer >= 0 && q.answer < q.options.length) ? q.answer : -1;
  return q.options.findIndex(t => String(t) === String(q.answer));
}

const QUIZZES = QUIZZES_RAW.filter(z => z && z.id && z.title && Array.isArray(z.questions) && z.questions.length &&
  z.questions.every(q => q && q.q && Array.isArray(q.options) && q.options.length === 4 && correctIndex(q) !== -1));
if (QUIZZES.length !== QUIZZES_RAW.length) console.error('[kuisku] Ada kuis dengan format salah (jumlah pilihan bukan 4 atau answer tidak cocok) dan dilewati. Cek quiz-data.js.');

const AVATARS = ['🦊', '🐼', '🐯', '🦄', '🐸', '🐙', '🐧', '🦁', '🐨', '🐵'];
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const cleanName = s => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
const genCode = () => { let c = ''; for (let i = 0; i < 5; i++) c += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]; return c; };
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1);[a[i], a[j]] = [a[j], a[i]]; } return a; };

const findQuiz = id => QUIZZES.find(z => z.id === id);
const listQuizzes = () => QUIZZES.map(z => ({ id: z.id, title: z.title, count: z.questions.length }));

function newRoom(code, quizId) {
  const quiz = findQuiz(quizId);
  if (!quiz) return null;
  return { code, quizId, quizTitle: quiz.title, hostId: null, players: {}, order: [], phase: 'lobby', qIndex: 0, questions: [], phaseEndsAt: 0 };
}

function newPlayer(room, rawName) {
  const used = new Set(Object.values(room.players).map(p => p.av));
  const av = AVATARS.find(a => !used.has(a)) || AVATARS[room.order.length % AVATARS.length];
  const names = new Set(Object.values(room.players).map(p => p.name.toLowerCase()));
  let name = rawName, k = 2;
  while (names.has(name.toLowerCase())) name = rawName.slice(0, 13) + ' ' + (k++);
  const now = Date.now();
  const p = { id: crypto.randomBytes(4).toString('hex'), token: crypto.randomBytes(16).toString('hex'), name, av,
    score: 0, answer: null, lastGain: 0, lastSeen: now };
  room.players[p.id] = p; 
  room.order.push(p.id);

  // Jika belum ada host (pemain pertama/pembuat room), set pemain ini sebagai Room Master
  if (!room.hostId) {
    room.hostId = p.id;
  }

  return p;
}

const isConnected = (p, now) => now - p.lastSeen <= HEARTBEAT_MS;
const connectedIds = (room, now) => room.order.filter(id => room.players[id] && isConnected(room.players[id], now));

function tick(room, now) {
  if (room.phase === 'countdown' && now >= room.phaseEndsAt) beginQuestion(room, now);
  else if (room.phase === 'question' && (now >= room.phaseEndsAt || allAnswered(room, now))) endQuestion(room, now);
  else if (room.phase === 'reveal' && now >= room.phaseEndsAt) nextOrFinish(room, now);
}

function startGame(room, now) {
  const quiz = findQuiz(room.quizId);
  room.questions = shuffle(quiz.questions).map(q => ({ 
    q: q.q, 
    // Urutan pilihan A, B, C, D tidak diacak. Jawaban benar ditentukan lewat indeks
    // (answer: 0 = pilihan pertama), BUKAN dengan membandingkan teks pilihan dengan angka answer.
    opts: q.options.map((t, i) => ({ t, isCorrect: i === correctIndex(q) }))
  }));
  room.qIndex = 0;
  for (const id of room.order) { const p = room.players[id]; p.score = 0; p.answer = null; p.lastGain = 0; }
  room.phase = 'countdown'; room.phaseEndsAt = now + COUNTDOWN_MS;
}

function beginQuestion(room, now) {
  for (const id of room.order) { const p = room.players[id]; p.answer = null; p.lastGain = 0; }
  room.phase = 'question'; room.phaseEndsAt = now + QUESTION_MS;
}

function allAnswered(room, now) {
  const ids = connectedIds(room, now);
  return ids.length > 0 && ids.every(id => room.players[id].answer);
}

function endQuestion(room, now) {
  const q = room.questions[room.qIndex], okIdx = q.opts.findIndex(o => o.isCorrect);
  for (const id of room.order) {
    const p = room.players[id];
    const correct = p.answer && p.answer.idx === okIdx;
    p.lastGain = correct ? POINTS_CORRECT : 0;
    if (correct) p.score += POINTS_CORRECT;
  }
  room.phase = 'reveal'; room.phaseEndsAt = now + REVEAL_MS;
}

function nextOrFinish(room, now) {
  if (room.qIndex + 1 >= room.questions.length) { room.phase = 'finished'; }
  else { room.qIndex++; beginQuestion(room, now); }
}

function submitAnswer(room, pid, choice, now) {
  const p = room.players[pid];
  if (!p || room.phase !== 'question' || p.answer) return false;
  const q = room.questions[room.qIndex];

  let selectedIdx = choice;
  if (typeof choice === 'string') {
    selectedIdx = q.opts.findIndex(o => o.t === choice);
  }

  if (!Number.isInteger(selectedIdx) || selectedIdx < 0 || selectedIdx >= q.opts.length) return false;
  p.answer = { idx: selectedIdx, at: now };
  return true;
}

function stateFor(room, pid, now) {
  const p = room.players[pid];
  const ranked = room.order.slice().sort((a, b) => room.players[b].score - room.players[a].score);
  const s = {
    now, code: room.code, phase: room.phase, quizTitle: room.quizTitle, min: MIN_PLAYERS,
    connected: connectedIds(room, now).length,
    isHost: room.hostId === pid, // Kirim status apakah player saat ini adalah Host
    you: { score: p.score, rank: ranked.indexOf(pid) + 1 },
    players: room.order.map(id => {
      const x = room.players[id];
      return { name: x.name, av: x.av, score: x.score, connected: isConnected(x, now), isHost: id === room.hostId };
    })
  };
  if (room.phase === 'countdown') s.endsAt = room.phaseEndsAt;
  if (room.phase === 'question' || room.phase === 'reveal') {
    const q = room.questions[room.qIndex];
    s.q = { index: room.qIndex, total: room.questions.length, text: q.q, options: q.opts.map(o => o.t), endsAt: room.phaseEndsAt, picked: p.answer ? p.answer.idx : -1 };
    if (room.phase === 'question') {
      const ids = connectedIds(room, now);
      s.q.answeredCount = ids.filter(id => room.players[id].answer).length;
      s.q.needed = ids.length;
    } else {
      s.reveal = { correct: q.opts.findIndex(o => o.isCorrect), gain: p.lastGain, nextAt: room.phaseEndsAt, last: room.qIndex + 1 >= room.questions.length };
    }
  }
  if (room.phase === 'finished') {
    s.standings = room.order.map(id => { const x = room.players[id]; return { name: x.name, av: x.av, score: x.score }; })
      .sort((a, b) => b.score - a.score);
  }
  return s;
}

module.exports = {
  QUIZZES, listQuizzes, findQuiz, newRoom, newPlayer, cleanName, genCode,
  tick, startGame, submitAnswer, stateFor, isConnected, connectedIds, MIN_PLAYERS, MAX_PLAYERS
};
