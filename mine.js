const express = require("express");
const crypto = require("crypto");
const { db, addResources } = require("./db.js");

const START_ENERGY = 12;
const ROCK_COUNT = 6;
const MAX_RUNS = 500;

const ORES = {
  iron: { name: "Iron Ore", icon: "🪨", points: 10 },
  coal: { name: "Coal", icon: "⚫", points: 5 },
  gold: { name: "Gold Ore", icon: "🟡", points: 25 }
};

db.exec(`CREATE TABLE IF NOT EXISTS mine_best (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  score INTEGER NOT NULL
)`);
db.exec("INSERT OR IGNORE INTO mine_best (id, score) VALUES (1, 0)");

const runs = new Map();

function getBest() {
  return db.prepare("SELECT score FROM mine_best WHERE id = 1").get().score;
}

function saveBest(score) {
  db.prepare("UPDATE mine_best SET score = ? WHERE id = 1 AND score < ?").run(score, score);
}

function randomRocks() {
  const types = Object.keys(ORES);
  return Array.from({ length: ROCK_COUNT }, () => types[Math.floor(Math.random() * types.length)]);
}

function toPublicRun(runId, run) {
  return {
    runId,
    energy: run.energy,
    resources: run.resources,
    score: run.score,
    over: run.over,
    best: getBest(),
    rocks: run.rocks.map(type => ({ type, name: ORES[type].name, icon: ORES[type].icon }))
  };
}

const router = express.Router();

router.post("/runs", (req, res) => {
  if (runs.size >= MAX_RUNS) {
    runs.delete(runs.keys().next().value);
  }

  const runId = crypto.randomUUID();
  const run = {
    energy: START_ENERGY,
    resources: { iron: 0, coal: 0, gold: 0 },
    score: 0,
    over: false,
    rocks: randomRocks()
  };

  runs.set(runId, run);
  res.status(201).json({ ok: true, run: toPublicRun(runId, run) });
});

router.post("/runs/:runId/dig", (req, res) => {
  const run = runs.get(req.params.runId);
  const index = Number((req.body || {}).rock);

  if (!run) {
    return res.status(404).json({ ok: false, error: "This run has expired. Start a new run." });
  }

  if (run.over) {
    return res.status(400).json({ ok: false, error: "This run is over. Start a new run." });
  }

  if (!Number.isInteger(index) || index < 0 || index >= run.rocks.length) {
    return res.status(400).json({ ok: false, error: "Pick one of the rocks to mine." });
  }

  const ore = run.rocks[index];

  run.energy--;
  run.resources[ore]++;
  run.score += ORES[ore].points;
  run.over = run.energy === 0;
  run.rocks = randomRocks();

  saveBest(run.score);
  addResources({ [ore]: 1 });

  res.json({ ok: true, ore, run: toPublicRun(req.params.runId, run) });
});

module.exports = router;
