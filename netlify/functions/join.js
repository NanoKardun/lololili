'use strict';
const { newPlayer, cleanName, tick, MAX_PLAYERS } = require('./lib/game');
const { withRoom } = require('./lib/store');

function json(status, obj) { return { statusCode: status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(obj) }; }

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Metode tidak diizinkan.' });
  let b; try { b = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Permintaan tidak valid.' }); }
  const name = cleanName(b.name);
  if (!name) return json(400, { error: 'Isi namamu dulu.' });
  const code = String(b.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 5) return json(400, { error: 'Kode ruang harus 5 karakter.' });

  const r = await withRoom(code, (room) => {
    const now = Date.now();
    tick(room, now);
    if (room.phase !== 'lobby') return { cancel: { status: 409, error: 'Permainan di ruang ini sudah dimulai.' } };
    if (room.order.length >= MAX_PLAYERS) return { cancel: { status: 409, error: 'Ruang sudah penuh.' } };
    const p = newPlayer(room, name);
    return { out: { code, pid: p.id, token: p.token } };
  });
  if (r.notFound) return json(404, { error: 'Kode ruang tidak ditemukan.' });
  if (r.cancelled) return json(r.cancelled.status, { error: r.cancelled.error });
  if (r.conflict) return json(503, { error: 'Server sedang sibuk, coba lagi.', debug: r.debug || null });
  return json(200, r.out);
};
