'use strict';
/* =====================================================================
   Penyimpanan ruang permainan memakai Netlify Blobs (bawaan Netlify,
   tidak perlu database terpisah, otomatis aktif).

   withRoom(code, fn) membaca ruang, menjalankan fn(room) yang boleh
   mengubah room langsung, lalu menyimpannya. Kalau ada perubahan lain
   yang "menyalip" di tengah jalan (dua pemain menjawab bersamaan),
   baca ulang dan coba lagi — supaya data tidak saling menimpa.
   ===================================================================== */
const { getStore } = require('@netlify/blobs');

// Ditambahkan siteID dan token secara eksplisit agar Netlify Blobs mengenali kredensial
const store = () => getStore({ 
  name: 'kuisku-rooms', 
  consistency: 'strong',
  siteID: process.env.NETLIFY_SITE_ID,
  token: process.env.NETLIFY_AUTH_TOKEN
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function withRoom(code, fn, retries = 5) {
  let lastErr = null;
  for (let i = 0; i < retries; i++) {
    let cur;
    try { cur = await store().getWithMetadata(code, { type: 'json' }); } catch (e) { lastErr = e; console.error('[kuisku] getWithMetadata gagal:', e); cur = null; }
    if (!cur || cur.data == null) {
      if (lastErr) return { notFound: true, debug: String(lastErr && lastErr.message || lastErr) };
      return { notFound: true };
    }
    const room = cur.data;
    const res = await fn(room);
    if (res && Object.prototype.hasOwnProperty.call(res, 'cancel')) return { cancelled: res.cancel };
    let ok;
    try { const w = await store().setJSON(code, room, { onlyIfMatch: cur.etag }); ok = !(w && w.modified === false); }
    catch (e) { lastErr = e; console.error('[kuisku] setJSON (withRoom) gagal:', e); ok = false; }
    if (ok) return { out: res && res.out };
    await sleep(25 + Math.random() * 60);
  }
  return { conflict: true, debug: lastErr ? String(lastErr.message || lastErr) : undefined };
}

async function createRoom(code, room) {
  try {
    const w = await store().setJSON(code, room, { onlyIfNew: true });
    return { ok: !(w && w.modified === false) };
  } catch (e) {
    console.error('[kuisku] createRoom gagal:', e);
    return { ok: false, error: String(e && e.message || e) };
  }
}

module.exports = { withRoom, createRoom };
