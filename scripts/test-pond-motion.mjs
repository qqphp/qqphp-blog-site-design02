import assert from 'node:assert/strict';
import { advanceSwimmingKoi, createSwimmingKoi, koiBounds, koiSeparation, resizeSwimmingKoi } from '../components/investment-pond-motion.ts';

function seededRandom() {
  let seed = 20260926;
  return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
}

function checkBounds(fish, pond) {
  for (const item of fish) {
    const bounds = koiBounds(item);
    assert.ok(Number.isFinite(item.x + item.y + item.angle));
    assert.ok(item.x + bounds.left >= -.001 && item.x + bounds.right <= pond.width + .001);
    assert.ok(item.y + bounds.top >= -.001 && item.y + bounds.bottom <= pond.height + .001);
  }
}

const wallPond = { width: 600, height: 190 };
for (const angle of [0, Math.PI, -Math.PI / 2, Math.PI / 2, -Math.PI / 4, Math.PI / 4, -3 * Math.PI / 4, 3 * Math.PI / 4]) {
  const fish = createSwimmingKoi([120], wallPond)[0];
  Object.assign(fish, { angle, target: angle, wanderIn: Infinity, tailDuration: Infinity, tailAngle: -Math.PI / 20 });
  const bounds = koiBounds(fish), vx = Math.cos(angle), vy = Math.sin(angle);
  fish.x = Math.abs(vx) < .001 ? wallPond.width / 2 : (vx > 0 ? wallPond.width - bounds.right : -bounds.left) - vx * 45;
  fish.y = Math.abs(vy) < .001 ? wallPond.height / 2 : (vy > 0 ? wallPond.height - bounds.bottom : -bounds.top) - vy * 45;
  let touched = false, walls = 0;
  for (let frame = 0; frame < 600; frame++) {
    const previousAngle = fish.angle;
    advanceSwimmingKoi([fish], wallPond, 1 / 60, () => .5);
    checkBounds([fish], wallPond);
    assert.ok(Math.abs(fish.angle - previousAngle) <= 1.7 / 60 + .0001);
    if (!fish.wallTurn) {
      assert.equal(fish.target, angle, 'the boundary must not turn a fish early');
      continue;
    }
    const contact = koiBounds(fish);
    const gap = Math.min(fish.x + contact.left, wallPond.width - fish.x - contact.right, fish.y + contact.top, wallPond.height - fish.y - contact.bottom);
    assert.ok(gap <= .001, `fish should reach the visible boundary before turning: ${gap}`);
    assert.equal(fish.angle, angle, 'the contact frame should reach the wall before rotating');
    touched = true; walls = fish.wallTurn;
    break;
  }
  assert.equal(touched, true, 'fish must reach the boundary');
  for (let frame = 0; frame < 180; frame++) {
    advanceSwimmingKoi([fish], wallPond, 1 / 60, () => .5);
    walls |= fish.wallTurn;
    checkBounds([fish], wallPond);
  }
  if (Math.abs(vx) > .1 && Math.abs(vy) > .1) {
    assert.ok(walls & (vx > 0 ? 2 : 1), 'corner should handle the horizontal wall');
    assert.ok(walls & (vy > 0 ? 8 : 4), 'corner should handle the vertical wall');
  }
  const released = koiBounds(fish);
  assert.ok(fish.x + released.left > 2 && fish.x + released.right < wallPond.width - 2 && fish.y + released.top > 2 && fish.y + released.bottom < wallPond.height - 2, 'fish should leave the wall/corner');
}
console.log('Four walls and four corners: no early turn, visible contact, gradual turn and release passed.');

for (const viewport of [320, 375, 700, 701, 1280]) {
  const pond = { width: viewport - (viewport <= 700 ? 44 : 84), height: 190 };
  const widths = viewport <= 700
    ? [Math.min(110, Math.max(88, viewport * .29)), Math.min(100, Math.max(82, viewport * .26)), Math.min(96, Math.max(76, viewport * .24))]
    : [120, 128, 112];
  const fish = createSwimmingKoi(widths, pond), random = seededRandom();
  const ranges = fish.map(item => ({ min: item.x, max: item.x }));
  let largestStep = 0, longestContact = 0, contactFrames = 0;
  for (let frame = 0; frame < 60 * 300; frame++) {
    const previous = fish.map(item => ({ x: item.x, y: item.y, angle: item.angle }));
    advanceSwimmingKoi(fish, pond, 1 / 60, random);
    checkBounds(fish, pond);
    let contact = false;
    fish.forEach((item, index) => {
      largestStep = Math.max(largestStep, Math.hypot(item.x - previous[index].x, item.y - previous[index].y));
      assert.ok(Math.abs(item.angle - previous[index].angle) <= 1.7 / 60 + .0001, 'turn must be gradual');
      ranges[index].min = Math.min(ranges[index].min, item.x);
      ranges[index].max = Math.max(ranges[index].max, item.x);
      for (let j = index + 1; j < fish.length; j++) {
        const separation = koiSeparation(item, fish[j]);
        contact ||= separation.distance < separation.clearance - .1;
      }
    });
    contactFrames = contact ? contactFrames + 1 : 0;
    longestContact = Math.max(longestContact, contactFrames);
  }
  assert.ok(largestStep < 3, `unexpected jump at ${viewport}: ${largestStep}`);
  assert.ok(longestContact < 150, `persistent contact at ${viewport}: ${longestContact} frames`);
  ranges.forEach(range => assert.ok(range.max - range.min > pond.width * .3, `fish confined to a small route at ${viewport}: ${JSON.stringify(ranges)}`));
  console.log(`${viewport}px: five simulated minutes, bounds/turns/contact/travel passed (max step ${largestStep.toFixed(2)}px, longest contact ${(longestContact / 60).toFixed(2)}s)`);
}

const pond = { width: 600, height: 190 };
const pair = createSwimmingKoi([100, 100], pond);
Object.assign(pair[0], { x: 235, y: 95, angle: 0, target: 0 });
Object.assign(pair[1], { x: 365, y: 95, angle: Math.PI, target: Math.PI });
for (let frame = 0; frame < 600; frame++) advanceSwimmingKoi(pair, pond, 1 / 60, () => .5);
assert.ok(pair[0].target !== 0 && pair[1].target !== Math.PI, 'approaching fish should avoid one another');
assert.ok(koiSeparation(...pair).distance >= koiSeparation(...pair).clearance - .1);

pair[1].x = pair[0].x; pair[1].y = pair[0].y;
for (let frame = 0; frame < 180; frame++) advanceSwimmingKoi(pair, pond, 1 / 60, () => .5);
assert.ok(koiSeparation(...pair).distance >= koiSeparation(...pair).clearance - .1, 'contact should separate');
checkBounds(pair, pond);

const next = { width: 276, height: 190 };
resizeSwimmingKoi(pair, pond, next, [88, 82]);
checkBounds(pair, next);
const before = pair.map(item => ({ x: item.x, y: item.y }));
advanceSwimmingKoi(pair, next, 60, () => .5);
pair.forEach((item, index) => assert.ok(Math.hypot(item.x - before[index].x, item.y - before[index].y) < 3, 'long frames should not jump'));
console.log('Approaching pairs, contact recovery, resize and long-frame checks passed.');
