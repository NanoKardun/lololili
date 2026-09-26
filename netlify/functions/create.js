'use strict';
const { newRoom, newPlayer, cleanName, genCode } = require('./lib/game');
const { createRoom } = require('./lib/store');

function json(status, obj) { return { statusCode: status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(obj) }; }

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Metode tidak diizinkan.' });
  let b; try { b = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Permintaan tidak valid.' }); }
  const name = cleanName(b.name);
  if (!name) return json(400, { error: 'Isi namamu dulu.' });

  let lastError = null;
  for (let i = 0; i < 8; i++) {
    const code = genCode();
    const room = newRoom(code, b.quizId);
    if (!room) return json(400, { error: 'Kuis tidak ditemukan.' });
    const p = newPlayer(room, name);
    const r = await createRoom(code, room);
    if (r.ok) return json(200, { code, pid: p.id, token: p.token });
    lastError = r.error;
  }
  // Kalau sampai di sini, penyimpanan (Netlify Blobs) yang bermasalah, bukan
  // "kode ruang bentrok" (peluangnya nyaris nol). Pesan error aslinya
  // disertakan di bawah supaya gampang didiagnosis lewat tab Network browser
  // atau lewat Netlify → Logs → Functions → create.
  console.error('[kuisku] create.js: gagal menyimpan ruang setelah 8 percobaan. Error terakhir:', lastError);
  return json(503, { error: 'Server sedang sibuk, coba lagi.', debug: lastError || null });
};
