type Curve = [number, number, number, number, number, number];
type OutlinePart = { start: [number, number]; curves: Curve[] };

function outline(parts: OutlinePart[], stroke: number, closed = false, tail = false) {
  const points: { x: number; y: number; radius: number; tail: boolean }[] = [];
  const d = parts.map(part => {
    let [x, y] = part.start;
    for (const [ax, ay, bx, by, endX, endY] of part.curves) {
      for (let step = 0; step <= 24; step++) {
        const t = step / 24, u = 1 - t;
        points.push({
          x: u ** 3 * x + 3 * u ** 2 * t * ax + 3 * u * t ** 2 * bx + t ** 3 * endX,
          y: u ** 3 * y + 3 * u ** 2 * t * ay + 3 * u * t ** 2 * by + t ** 3 * endY,
          radius: stroke / 2 + .2, tail,
        });
      }
      x = endX; y = endY;
    }
    return `M${part.start.join(' ')}${part.curves.map(curve => `C${curve.join(' ')}`).join('')}${closed ? 'Z' : ''}`;
  }).join('');
  return { d, points };
}

// Rendering and collision detection share the same curves; transparent SVG space is excluded.
export const koiOutline = {
  tail: outline([{ start: [48, 55], curves: [
    [31, 51, 19, 35, 6, 22], [10, 39, 17, 49, 27, 55],
    [17, 62, 10, 73, 6, 89], [21, 76, 32, 60, 48, 55],
  ] }], 1.5, true, true),
  rearFins: outline([
    { start: [91, 40], curves: [[82, 23, 66, 16, 53, 17], [61, 31, 68, 41, 84, 48]] },
    { start: [88, 65], curves: [[79, 83, 65, 91, 52, 92], [59, 77, 68, 67, 85, 59]] },
  ], 1.5),
  frontFins: outline([
    { start: [168, 38], curves: [[158, 24, 155, 14, 162, 8], [173, 17, 179, 27, 180, 41]] },
    { start: [169, 73], curves: [[158, 86, 156, 97, 163, 103], [174, 93, 180, 83, 181, 69]] },
  ], 1.5),
  body: outline([{ start: [39, 55], curves: [
    [54, 36, 90, 24, 130, 27], [168, 29, 198, 39, 215, 49], [223, 54, 223, 59, 215, 64],
    [196, 75, 166, 81, 130, 83], [89, 86, 54, 74, 39, 55],
  ] }], 2, true),
};

export const koiContour = Object.values(koiOutline).flatMap(part => part.points);
