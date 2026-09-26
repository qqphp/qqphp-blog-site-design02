import { koiContour } from './investment-pond-shape';

export type PondSize = { width: number; height: number };
export type SwimmingKoi = {
  x: number; y: number; angle: number; target: number;
  width: number; height: number; speed: number; wanderIn: number; turnFor: number; contactFor: number;
  wallTurn: number; tailPhase: number; tailDuration: number; tailAngle: number;
};

const leftWall = 1, rightWall = 2, topWall = 4, bottomWall = 8;
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const angleDifference = (target: number, current: number) => Math.atan2(Math.sin(target - current), Math.cos(target - current));

export function koiBounds(fish: SwimmingKoi) {
  const cos = Math.cos(fish.angle), sin = Math.sin(fish.angle), scale = fish.width / 240;
  const tailCos = Math.cos(fish.tailAngle), tailSin = Math.sin(fish.tailAngle);
  let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
  for (const point of koiContour) {
    let x = point.x, y = point.y;
    if (point.tail) {
      x = 42 + (point.x - 42) * tailCos - (point.y - 55) * tailSin;
      y = 55 + (point.x - 42) * tailSin + (point.y - 55) * tailCos;
    }
    const rotatedX = ((x - 120) * cos - (y - 55) * sin) * scale;
    const rotatedY = ((x - 120) * sin + (y - 55) * cos) * scale;
    const radius = point.radius * scale;
    left = Math.min(left, rotatedX - radius); right = Math.max(right, rotatedX + radius);
    top = Math.min(top, rotatedY - radius); bottom = Math.max(bottom, rotatedY + radius);
  }
  return { left, right, top, bottom };
}

// Three overlapping circles follow the long body, allowing fish to pass side by side.
export function koiSeparation(a: SwimmingKoi, b: SwimmingKoi, ahead = 0) {
  let dx = b.x - a.x, dy = b.y - a.y, distance = Infinity;
  for (const offsetA of [-.24, 0, .24]) {
    for (const offsetB of [-.24, 0, .24]) {
      const x = b.x + Math.cos(b.angle) * (offsetB * b.width + b.speed * ahead) - a.x - Math.cos(a.angle) * (offsetA * a.width + a.speed * ahead);
      const y = b.y + Math.sin(b.angle) * (offsetB * b.width + b.speed * ahead) - a.y - Math.sin(a.angle) * (offsetA * a.width + a.speed * ahead);
      const gap = Math.hypot(x, y);
      if (gap < distance) { distance = gap; dx = x; dy = y; }
    }
  }
  return { dx, dy, distance, clearance: (a.height + b.height) * .28 };
}

function contain(fish: SwimmingKoi, pond: PondSize) {
  const bounds = koiBounds(fish);
  let walls = 0;
  if (fish.x + bounds.left <= 0) walls |= leftWall;
  if (fish.x + bounds.right >= pond.width) walls |= rightWall;
  if (fish.y + bounds.top <= 0) walls |= topWall;
  if (fish.y + bounds.bottom >= pond.height) walls |= bottomWall;
  fish.x = clamp(fish.x, -bounds.left, pond.width - bounds.right);
  fish.y = clamp(fish.y, -bounds.top, pond.height - bounds.bottom);
  return walls;
}

function turnAtBoundary(fish: SwimmingKoi, pond: PondSize) {
  const walls = contain(fish, pond);
  let vx = Math.cos(fish.angle), vy = Math.sin(fish.angle), hit = 0;
  if ((walls & leftWall) && vx < -.00001) hit |= leftWall;
  if ((walls & rightWall) && vx > .00001) hit |= rightWall;
  if ((walls & topWall) && vy < -.00001) hit |= topWall;
  if ((walls & bottomWall) && vy > .00001) hit |= bottomWall;
  if (!(hit & ~fish.wallTurn)) return;
  // Keep the turn until it finishes, and combine adjoining walls at a corner.
  if (hit & leftWall) fish.wallTurn &= ~rightWall;
  if (hit & rightWall) fish.wallTurn &= ~leftWall;
  if (hit & topWall) fish.wallTurn &= ~bottomWall;
  if (hit & bottomWall) fish.wallTurn &= ~topWall;
  fish.wallTurn |= hit;
  if (fish.wallTurn & leftWall) vx = Math.abs(vx);
  if (fish.wallTurn & rightWall) vx = -Math.abs(vx);
  if (fish.wallTurn & topWall) vy = Math.abs(vy);
  if (fish.wallTurn & bottomWall) vy = -Math.abs(vy);
  fish.target = Math.atan2(vy, vx);
  fish.turnFor = 2.2;
}

export function createSwimmingKoi(widths: number[], pond: PondSize): SwimmingKoi[] {
  const angles = [-.2, Math.PI + .25, -.4];
  return widths.map((width, index) => {
    const fish = {
      x: pond.width * (.2 + index * .3), y: pond.height * (index === 1 ? .56 : .46),
      angle: angles[index], target: angles[index], width, height: width * 11 / 24,
      speed: [22, 19, 25][index] * Math.min(1, pond.width / 600), wanderIn: 4 + index, turnFor: 0, contactFor: 0,
      wallTurn: 0, tailPhase: [0, .7, .4][index], tailDuration: [1.6, 1.9, 1.4][index], tailAngle: 0,
    };
    contain(fish, pond);
    return fish;
  });
}

export function resizeSwimmingKoi(fish: SwimmingKoi[], previous: PondSize, pond: PondSize, widths: number[]) {
  fish.forEach((item, index) => {
    item.x *= pond.width / previous.width;
    item.y *= pond.height / previous.height;
    item.width = widths[index];
    item.height = item.width * 11 / 24;
    item.speed = [22, 19, 25][index] * Math.min(1, pond.width / 600);
    contain(item, pond);
  });
}

export function advanceSwimmingKoi(fish: SwimmingKoi[], pond: PondSize, elapsed: number, random = Math.random) {
  const dt = Math.min(elapsed, .04);
  fish.forEach(item => {
    item.turnFor = Math.max(0, item.turnFor - dt);
    item.contactFor = Math.max(0, item.contactFor - dt);
    item.tailPhase += dt;
    item.tailAngle = -Math.PI / 20 * Math.cos(Math.PI * item.tailPhase / item.tailDuration);
    if (item.wallTurn && Math.abs(angleDifference(item.target, item.angle)) < .03) item.wallTurn = 0;
    item.wanderIn -= dt;
    if (item.wanderIn <= 0 && !item.wallTurn) {
      item.target += (random() - .5) * .7;
      item.wanderIn = 4 + random() * 3;
    }
  });

  // Predict approaching pairs so both fish have room to make a gentle turn.
  for (let i = 0; i < fish.length; i++) {
    for (let j = i + 1; j < fish.length; j++) {
      const a = fish[i], b = fish[j], dx = b.x - a.x, dy = b.y - a.y;
      if (a.turnFor > 0 || b.turnFor > 0 || a.wallTurn || b.wallTurn) continue;
      const vx = Math.cos(b.angle) * b.speed - Math.cos(a.angle) * a.speed;
      const vy = Math.sin(b.angle) * b.speed - Math.sin(a.angle) * a.speed;
      const closing = dx * vx + dy * vy;
      const time = clamp(-closing / (vx * vx + vy * vy || 1), 0, 1.8);
      const predicted = koiSeparation(a, b, time);
      if (closing < 0 && predicted.distance < predicted.clearance + 16 && Math.hypot(dx, dy) < (a.width + b.width) / 2 + 65) {
        const normal = Math.atan2(dy, dx);
        if (Math.cos(a.angle - b.angle) < -.4) {
          a.target = a.angle - .45;
          b.target = b.angle - .45;
        } else {
          a.target = normal + Math.PI - .65;
          b.target = normal - .65;
        }
        a.turnFor = b.turnFor = 2.2;
      }
    }
  }

  fish.forEach(item => {
    item.angle += clamp(angleDifference(item.target, item.angle), -1.7 * dt, 1.7 * dt);
    const travel = item.speed * dt * (item.contactFor > 0 ? .5 : 1);
    item.x += Math.cos(item.angle) * travel;
    item.y += Math.sin(item.angle) * travel;
    turnAtBoundary(item, pond);
  });

  // Resolve contact without exchanging velocities or repeatedly bouncing a pair.
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < fish.length; i++) {
      for (let j = i + 1; j < fish.length; j++) {
        const a = fish[i], b = fish[j];
        const { dx, dy, distance, clearance } = koiSeparation(a, b);
        if (distance >= clearance) continue;
        const nx = distance > .001 ? dx / distance : 1, ny = distance > .001 ? dy / distance : 0;
        const shift = Math.min((clearance - distance) / 2 + .01, 12 * dt);
        a.x -= nx * shift; a.y -= ny * shift;
        b.x += nx * shift; b.y += ny * shift;
        if (a.contactFor <= 0 && !a.wallTurn) { a.target = Math.atan2(-ny, -nx) - .65; a.turnFor = a.contactFor = 2.2; }
        if (b.contactFor <= 0 && !b.wallTurn) { b.target = Math.atan2(ny, nx) - .65; b.turnFor = b.contactFor = 2.2; }
        turnAtBoundary(a, pond); turnAtBoundary(b, pond);
      }
    }
  }
}
