'use strict';
const { tick, startGame, connectedIds, MIN_PLAYERS } = require('./lib/game');
const { withRoom } = require('./lib/store');

function json(status, obj) { return { statusCode: status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(obj) }; }

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Metode tidak diizinkan.' });
  let b; try { b = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Permintaan tidak valid.' }); }
  const code = String(b.code || '').toUpperCase(), pid = String(b.pid || ''), token = String(b.token || '');

  const r = await withRoom(code, (room) => {
    const now = Date.now();
    const p = room.players[pid];
    if (!p || p.token !== token) return { cancel: { status: 401, error: 'Sesi tidak valid.' } };

    // Validasi Room Master
    if (room.hostId && room.hostId !== pid) {
      return { cancel: { status: 403, error: 'Hanya Room Master yang dapat memulai game.' } };
    }

    p.lastSeen = now;
    tick(room, now);
    if (room.phase !== 'lobby') return { cancel: { status: 409, error: 'Permainan sudah berjalan.' } };
    if (connectedIds(room, now).length < MIN_PLAYERS) return { cancel: { status: 409, error: `Butuh minimal ${MIN_PLAYERS} pemain untuk mulai.` } };
    startGame(room, now);
  });

  if (r.notFound) return json(404, { error: 'Ruang tidak ditemukan.' });
  if (r.cancelled) return json(r.cancelled.status, { error: r.cancelled.error });
  if (r.conflict) return json(503, { error: 'Server sedang sibuk, coba lagi.', debug: r.debug || null });
  return json(200, { ok: true });
};
