// Serveur multijoueur MawCraft
// -----------------------------
// Rôle : mettre en relation les joueurs d'un même monde (= une même seed).
// Le terrain n'est PAS transmis : il est régénéré à l'identique côté client à
// partir de la seed. Le serveur ne transporte que :
//   - les positions des joueurs (diffusées en temps réel, non sauvegardées) ;
//   - les blocs cassés/posés (les « deltas »), diffusés ET sauvegardés sur disque.
//
// Chaque seed possède son fichier data/world-<seed>.json contenant uniquement
// les blocs modifiés. C'est léger et ça suffit à faire persister le monde.

import { WebSocketServer } from 'ws';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '127.0.0.1'; // derrière nginx : localhost uniquement

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// seed -> { edits: Map<"x,y,z", blockId>, clients: Set<ws>, dirty: bool }
const rooms = new Map();
let nextId = 1;

const fileFor = seed => join(DATA_DIR, `world-${seed}.json`);

function loadRoom(seed) {
  let room = rooms.get(seed);
  if (room) return room;
  room = { edits: new Map(), clients: new Set(), dirty: false };
  const f = fileFor(seed);
  if (existsSync(f)) {
    try {
      const obj = JSON.parse(readFileSync(f, 'utf8'));
      for (const [k, v] of Object.entries(obj.edits || {})) room.edits.set(k, v);
      console.log(`[monde ${seed}] ${room.edits.size} blocs chargés`);
    } catch (e) {
      console.error(`[monde ${seed}] lecture impossible : ${e.message}`);
    }
  }
  rooms.set(seed, room);
  return room;
}

function saveRoom(seed, room) {
  try {
    writeFileSync(fileFor(seed), JSON.stringify({ seed, edits: Object.fromEntries(room.edits) }));
    room.dirty = false;
  } catch (e) {
    console.error(`[monde ${seed}] sauvegarde impossible : ${e.message}`);
  }
}

function broadcast(room, except, obj) {
  const s = JSON.stringify(obj);
  for (const c of room.clients) if (c !== except && c.readyState === 1) c.send(s);
}

// Sauvegarde périodique des mondes modifiés
setInterval(() => {
  for (const [seed, room] of rooms) if (room.dirty) saveRoom(seed, room);
}, 5000);

const wss = new WebSocketServer({ host: HOST, port: PORT });
console.log(`Serveur MawCraft en écoute sur ws://${HOST}:${PORT}`);

wss.on('connection', ws => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  let room = null, seed = null;
  ws.mc = null; // { id, name, seed }
  ws.state = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };

  ws.on('message', buf => {
    let msg;
    try { msg = JSON.parse(buf); } catch { return; }

    if (msg.t === 'join') {
      if (room) return; // déjà dans un monde
      seed = msg.seed >>> 0;
      const name = ('' + (msg.name || 'Joueur')).slice(0, 16) || 'Joueur';
      const id = nextId++;
      ws.mc = { id, name, seed };
      room = loadRoom(seed);

      // liste des joueurs déjà présents
      const players = [];
      for (const c of room.clients)
        if (c.mc) players.push({ id: c.mc.id, name: c.mc.name, ...c.state });

      ws.send(JSON.stringify({ t: 'init', id, players, edits: Object.fromEntries(room.edits) }));
      room.clients.add(ws);
      broadcast(room, ws, { t: 'join', id, name, ...ws.state });
      console.log(`[monde ${seed}] ${name} (#${id}) rejoint — ${room.clients.size} en ligne`);
      return;
    }

    if (!room) return;

    if (msg.t === 'move') {
      ws.state = {
        x: +msg.x || 0, y: +msg.y || 0, z: +msg.z || 0,
        yaw: +msg.yaw || 0, pitch: +msg.pitch || 0,
      };
      broadcast(room, ws, { t: 'move', id: ws.mc.id, ...ws.state });
    } else if (msg.t === 'block') {
      const x = msg.x | 0, y = msg.y | 0, z = msg.z | 0, id = msg.id | 0;
      if (!Number.isInteger(msg.x) || !Number.isInteger(msg.y) || !Number.isInteger(msg.z)) return;
      room.edits.set(`${x},${y},${z}`, id);
      room.dirty = true;
      broadcast(room, ws, { t: 'block', x, y, z, id });
    }
  });

  ws.on('close', () => {
    if (!room) return;
    room.clients.delete(ws);
    if (ws.mc) {
      broadcast(room, ws, { t: 'leave', id: ws.mc.id });
      console.log(`[monde ${seed}] ${ws.mc.name} (#${ws.mc.id}) quitte — ${room.clients.size} en ligne`);
    }
  });
});

// Détection des connexions mortes
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 30000);

// Sauvegarde avant l'arrêt
function shutdown() {
  console.log('Arrêt : sauvegarde des mondes…');
  for (const [seed, room] of rooms) saveRoom(seed, room);
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
