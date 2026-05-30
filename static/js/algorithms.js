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
    for (let i = 2; i < sorted.length; i++) {
      const p = sorted[i];
      while (stack.length > 1 && this.orientation(
        [stack[stack.length - 2].x, stack[stack.length - 2].y],
        [stack[stack.length - 1].x, stack[stack.length - 1].y],
        [p.x, p.y]) !== 2) {
        stack.pop();
        steps.push({ type: 'pop', stack: stack.map(s => [s.x, s.y]) });
      }
      stack.push(p);
      steps.push({ type: 'push', stack: stack.map(s => [s.x, s.y]), current: [p.x, p.y] });
    }
    return { hull: stack.map(s => [s.x, s.y]), steps };
  }

  static giftWrapping(points) {
    if (points.length < 3) return { hull: [...points], steps: [] };
    const pts = points.map(p => ({ x: p[0], y: p[1] }));
    const start = pts.reduce((a, b) => (b.y < a.y || (b.y === a.y && b.x < a.x)) ? b : a);
    let pointOnHull = start;
    const hull = [start];
    const steps = [];
    do {
      let next = null;
      for (const p of pts) {
        if (p === pointOnHull) continue;
        if (next === null) { next = p; continue; }
        const o = this.orientation([pointOnHull.x, pointOnHull.y], [next.x, next.y], [p.x, p.y]);
        if (o === 1) next = p;
        else if (o === 0) {
          const dNext = Math.hypot(next.x - pointOnHull.x, next.y - pointOnHull.y);
          const dP = Math.hypot(p.x - pointOnHull.x, p.y - pointOnHull.y);
          if (dP > dNext) next = p;
        }
      }
      if (next === null || (next === start && hull.length > 1)) break;
      pointOnHull = next;
      hull.push(next);
      steps.push({ type: 'add', hull: hull.map(h => [h.x, h.y]) });
    } while (pointOnHull !== start);
    return { hull: hull.map(h => [h.x, h.y]), steps };
  }

  static andrewsMonotone(points) {
    if (points.length < 3) return { hull: [...points], steps: [] };
    const pts = points.map(p => ({ x: p[0], y: p[1] })).sort((a, b) => a.x - b.x || a.y - b.y);
    const lower = [];
    const upper = [];
    const steps = [];
    for (const p of pts) {
      while (lower.length >= 2 && this.orientation(
        [lower[lower.length - 2].x, lower[lower.length - 2].y],
        [lower[lower.length - 1].x, lower[lower.length - 1].y],
        [p.x, p.y]) !== 2) lower.pop();
      lower.push(p);
      steps.push({ type: 'lower', lower: lower.map(l => [l.x, l.y]), upper: upper.map(u => [u.x, u.y]) });
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i];
      while (upper.length >= 2 && this.orientation(
        [upper[upper.length - 2].x, upper[upper.length - 2].y],
        [upper[upper.length - 1].x, upper[upper.length - 1].y],
        [p.x, p.y]) !== 2) upper.pop();
      upper.push(p);
      steps.push({ type: 'upper', lower: lower.map(l => [l.x, l.y]), upper: upper.map(u => [u.x, u.y]) });
    }
    lower.pop();
    upper.pop();
    const hull = [...lower, ...upper];
    return { hull, steps };
  }
}
