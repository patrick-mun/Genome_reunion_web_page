import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seeded } from './fake-random.js';
import { createGecko, fleeTarget, pickTarget, startTurn, stepGecko } from './gecko-motion.js';

const bounds = { minX: 36, maxX: 964, minY: 700, maxY: 3000 };
const noPointer = { x: -1e5, y: -1e5, has: false };
const context = (overrides) => ({
  now: 0,
  dt: 0.016,
  getBounds: () => bounds,
  pointer: noPointer,
  random: seeded(1),
  ...overrides,
});

test('createGecko apparaît dans la zone haute, au repos', () => {
  const gecko = createGecko(bounds, 800, 1000, seeded(2));
  assert.ok(gecko.pos.x >= bounds.minX && gecko.pos.x <= bounds.maxX);
  assert.ok(gecko.pos.y >= bounds.minY && gecko.pos.y <= bounds.minY + 800 * 1.5);
  assert.equal(gecko.state, 'pause');
  assert.ok(gecko.until >= 1700 && gecko.until <= 3200);
  assert.deepEqual(gecko.prev, gecko.pos);
  assert.notEqual(gecko.prev, gecko.pos);
});

test('pickTarget reste dans la zone autorisée', () => {
  const random = seeded(3);
  const gecko = createGecko(bounds, 800, 0, random);
  for (let i = 0; i < 300; i++) {
    const t = pickTarget(gecko, bounds, random);
    assert.ok(t.x >= bounds.minX && t.x <= bounds.maxX, `x=${t.x}`);
    assert.ok(t.y >= bounds.minY && t.y <= bounds.maxY, `y=${t.y}`);
  }
});

test("fleeTarget s'éloigne du pointeur et reste dans la zone", () => {
  const random = seeded(4);
  const gecko = createGecko(bounds, 800, 0, random);
  gecko.pos = { x: 500, y: 1500 };
  const pointer = { x: 450, y: 1500, has: true };
  const t = fleeTarget(gecko, pointer, bounds, random);
  assert.ok(t.x > gecko.pos.x, "fuit vers la droite, à l'opposé du pointeur");
  assert.ok(t.x <= bounds.maxX && t.y >= bounds.minY && t.y <= bounds.maxY);
});

test('fleeTarget supporte un pointeur exactement sur le margouillat', () => {
  const random = seeded(5);
  const gecko = createGecko(bounds, 800, 0, random);
  const t = fleeTarget(gecko, { x: gecko.pos.x, y: gecko.pos.y, has: true }, bounds, random);
  assert.ok(Number.isFinite(t.x) && Number.isFinite(t.y));
});

test('startTurn oriente le margouillat vers la destination', () => {
  const gecko = createGecko(bounds, 800, 0, seeded(6));
  gecko.pos = { x: 100, y: 1000 };
  startTurn(gecko, { x: 100, y: 800 }, 300);
  assert.equal(gecko.state, 'turn');
  assert.equal(gecko.targetAngle, 0);
  assert.deepEqual(gecko.seg.to, { x: 100, y: 800 });
});

test("stepGecko reste au repos tant que la pause n'est pas écoulée", () => {
  const gecko = createGecko(bounds, 800, 0, seeded(7));
  stepGecko(gecko, context({ now: 100 }));
  assert.equal(gecko.state, 'pause');
});

test('stepGecko démarre un pivot à la fin de la pause', () => {
  const gecko = createGecko(bounds, 800, 0, seeded(8));
  stepGecko(gecko, context({ now: gecko.until + 1 }));
  assert.equal(gecko.state, 'turn');
  assert.ok(gecko.seg);
});

test("stepGecko fuit quand le pointeur s'approche à moins de 110 px", () => {
  const gecko = createGecko(bounds, 800, 0, seeded(9));
  gecko.pos = { x: 500, y: 1500 };
  gecko.prev = { x: 500, y: 1500 };
  const pointer = { x: 520, y: 1500, has: true };
  stepGecko(gecko, context({ now: 10, pointer }));
  assert.equal(gecko.state, 'turn');
  assert.ok(gecko.seg.speed >= 430 && gecko.seg.speed <= 560);
});

test('stepGecko ignore un pointeur lointain', () => {
  const gecko = createGecko(bounds, 800, 0, seeded(10));
  gecko.pos = { x: 500, y: 1500 };
  stepGecko(gecko, context({ now: 10, pointer: { x: 900, y: 1500, has: true } }));
  assert.equal(gecko.state, 'pause');
});

test('stepGecko enchaîne pivot, détalage puis retour au repos', () => {
  const random = seeded(11);
  const gecko = createGecko(bounds, 800, 0, random);
  gecko.pos = { x: 500, y: 1000 };
  gecko.prev = { x: 500, y: 1000 };
  gecko.angle = 0;
  startTurn(gecko, { x: 500, y: 1400 }, 300); /* cible droit vers le bas : 180° */
  const visited = [gecko.state];
  let now = 0;
  for (let i = 0; i < 3000 && gecko.state !== 'pause'; i++) {
    stepGecko(gecko, context({ now, random }));
    if (visited.at(-1) !== gecko.state) visited.push(gecko.state);
    now += 16;
  }
  assert.deepEqual(visited, ['turn', 'dash', 'pause']);
  assert.equal(gecko.seg, null);
  assert.ok(gecko.until > now - 16, 'une nouvelle pause est programmée');
});

test('stepGecko tourne dans le sens le plus court, par pas bornés', () => {
  const random = seeded(15);
  const gecko = createGecko(bounds, 800, 0, random);
  gecko.pos = { x: 500, y: 1000 };
  gecko.angle = 350;
  startTurn(gecko, { x: 500, y: 600 }, 300); /* cible vers le haut : 0° */
  stepGecko(gecko, context({ now: 0, dt: 0.016, random }));
  assert.ok(gecko.angle > 350 || gecko.angle < 5, `angle=${gecko.angle}`);
  assert.ok(Math.abs(gecko.angle - 350) <= 460 * 0.016 + 1e-9 || gecko.angle < 5);
});

test('stepGecko arrive exactement à destination en fin de détalage', () => {
  const random = seeded(12);
  const gecko = createGecko(bounds, 800, 0, random);
  gecko.pos = { x: 200, y: 1000 };
  gecko.prev = { x: 200, y: 1000 };
  const target = { x: 600, y: 1400 };
  startTurn(gecko, target, 300);
  let now = 0;
  for (let i = 0; i < 3000 && gecko.state !== 'pause'; i++) {
    stepGecko(gecko, context({ now, random }));
    now += 16;
  }
  assert.equal(gecko.state, 'pause');
  assert.deepEqual(gecko.pos, target);
});

test('stepGecko accélère la marche (run) quand le margouillat court', () => {
  const random = seeded(13);
  const gecko = createGecko(bounds, 800, 0, random);
  startTurn(gecko, { x: gecko.pos.x + 300, y: gecko.pos.y }, 400);
  let now = 0;
  for (let i = 0; i < 40; i++) {
    stepGecko(gecko, context({ now, random }));
    now += 16;
  }
  assert.ok(gecko.run > 0, `run=${gecko.run}`);
  assert.ok(gecko.phase > 0);
});

test('stepGecko garde des valeurs finies sur une longue simulation', () => {
  const random = seeded(14);
  const gecko = createGecko(bounds, 800, 0, random);
  const pointer = { x: 500, y: 1500, has: true };
  for (let now = 0; now < 120000; now += 16) stepGecko(gecko, context({ now, random, pointer }));
  for (const v of [gecko.pos.x, gecko.pos.y, gecko.angle, gecko.phase, gecko.run]) {
    assert.ok(Number.isFinite(v));
  }
  assert.ok(gecko.pos.x >= bounds.minX && gecko.pos.x <= bounds.maxX);
});
