class ConvexHullAlgorithms {

  static orientation(p, q, r) {
    const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
    if (val === 0) return 0;
    return val > 0 ? 1 : 2;
  }

  static grahamScan(points) {
    if (points.length < 3) return { hull: [...points], steps: [] };
    const pts = points.map((p, i) => ({ x: p[0], y: p[1], i }));
    const start = pts.reduce((a, b) => (b.y < a.y || (b.y === a.y && b.x < a.x)) ? b : a);
    const sorted = pts.sort((a, b) => {
      const angleA = Math.atan2(a.y - start.y, a.x - start.x);
      const angleB = Math.atan2(b.y - start.y, b.x - start.x);
      if (angleA !== angleB) return angleA - angleB;
      const distA = (a.x - start.x) ** 2 + (a.y - start.y) ** 2;
      const distB = (b.x - start.x) ** 2 + (b.y - start.y) ** 2;
      return distA - distB;
    });
    const stack = [sorted[0], sorted[1]];
    const steps = [];
    steps.push({ type: 'init', stack: [[sorted[0].x, sorted[0].y], [sorted[1].x, sorted[1].y]], current: [sorted[1].x, sorted[1].y], desc: `Pick lowest point (${start.x.toFixed(1)}, ${start.y.toFixed(1)}), sort others by angle` });
    for (let i = 2; i < sorted.length; i++) {
      const p = sorted[i];
      let popped = false;
      while (stack.length > 1 && this.orientation(
        [stack[stack.length - 2].x, stack[stack.length - 2].y],
        [stack[stack.length - 1].x, stack[stack.length - 1].y],
        [p.x, p.y]) !== 2) {
        stack.pop();
        popped = true;
        steps.push({ type: 'pop', stack: stack.map(s => [s.x, s.y]), current: [p.x, p.y], desc: `Non-left turn — pop from stack` });
      }
      stack.push(p);
      if (!popped) {
        steps.push({ type: 'push', stack: stack.map(s => [s.x, s.y]), current: [p.x, p.y], desc: `Left turn — push (${p.x.toFixed(1)}, ${p.y.toFixed(1)}) onto stack` });
      }
    }
    steps.push({ type: 'done', stack: stack.map(s => [s.x, s.y]), desc: `✓ Stack has ${stack.length} hull points` });
    return { hull: stack.map(s => [s.x, s.y]), steps };
  }

  static giftWrapping(points) {
    if (points.length < 3) return { hull: [...points], steps: [] };
    const pts = points.map(p => ({ x: p[0], y: p[1] }));
    const start = pts.reduce((a, b) => (b.y < a.y || (b.y === a.y && b.x < a.x)) ? b : a);
    let pointOnHull = start;
    const hull = [start];
    const steps = [];
    steps.push({ type: 'init', hull: [[start.x, start.y]], current: [start.x, start.y], desc: `Start at lowest point (${start.x.toFixed(1)}, ${start.y.toFixed(1)})` });
    let iter = 0;
    do {
      let next = null;
      for (const p of pts) {
        if (p === pointOnHull) continue;
        if (next === null) { next = p; continue; }
        const o = this.orientation([pointOnHull.x, pointOnHull.y], [next.x, next.y], [p.x, p.y]);
        if (o === 1) next = p;
        else if (o === 0) {
          const dN = Math.hypot(next.x - pointOnHull.x, next.y - pointOnHull.y);
          const dP = Math.hypot(p.x - pointOnHull.x, p.y - pointOnHull.y);
          if (dP > dN) next = p;
        }
      }
      if (next === null || (next === start && hull.length > 1)) break;
      pointOnHull = next;
      hull.push(next);
      steps.push({ type: 'add', hull: hull.map(h => [h.x, h.y]), current: [next.x, next.y], desc: `Found next hull point (${next.x.toFixed(1)}, ${next.y.toFixed(1)}) — all others are to the left` });
      iter++;
      if (iter > 50) break;
    } while (pointOnHull !== start);
    steps.push({ type: 'done', hull: hull.map(h => [h.x, h.y]), desc: `✓ Back to start — hull has ${hull.length} points` });
    return { hull: hull.map(h => [h.x, h.y]), steps };
  }

  static andrewsMonotone(points) {
    if (points.length < 3) return { hull: [...points], steps: [] };
    const pts = points.map(p => ({ x: p[0], y: p[1] })).sort((a, b) => a.x - b.x || a.y - b.y);
    const lower = [];
    const upper = [];
    const steps = [];
    steps.push({ type: 'init', desc: `Sort points by x then y — start with lower hull` });
    for (const p of pts) {
      while (lower.length >= 2 && this.orientation(
        [lower[lower.length - 2].x, lower[lower.length - 2].y],
        [lower[lower.length - 1].x, lower[lower.length - 1].y],
        [p.x, p.y]) !== 2) lower.pop();
      lower.push(p);
      steps.push({ type: 'lower', lower: lower.map(l => [l.x, l.y]), upper: upper.map(u => [u.x, u.y]), current: [p.x, p.y], desc: `Building lower hull — added (${p.x.toFixed(1)}, ${p.y.toFixed(1)})` });
    }
    steps.push({ type: 'phase', lower: lower.map(l => [l.x, l.y]), upper: upper.map(u => [u.x, u.y]), desc: `Lower hull done (${lower.length} points) — building upper hull` });
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i];
      while (upper.length >= 2 && this.orientation(
        [upper[upper.length - 2].x, upper[upper.length - 2].y],
        [upper[upper.length - 1].x, upper[upper.length - 1].y],
        [p.x, p.y]) !== 2) upper.pop();
      upper.push(p);
      steps.push({ type: 'upper', lower: lower.map(l => [l.x, l.y]), upper: upper.map(u => [u.x, u.y]), current: [p.x, p.y], desc: `Building upper hull — added (${p.x.toFixed(1)}, ${p.y.toFixed(1)})` });
    }
    lower.pop(); upper.pop();
    const hull = [...lower, ...upper];
    steps.push({ type: 'done', hull: hull.map(h => [h.x, h.y]), desc: `✓ Merge complete — hull has ${hull.length} points` });
    return { hull, steps };
  }
}
