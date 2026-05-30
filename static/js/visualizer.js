class Visualizer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.padding = 50;
    const display = getComputedStyle(this.canvas.parentElement).display;
    if (display === 'none') return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.canvas.width = this.canvas.clientWidth || rect.width;
    this.canvas.height = this.canvas.clientHeight || rect.height;
  }

  clear() { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }

  getTransform(points) {
    const w = this.canvas.width - 2 * this.padding;
    const h = this.canvas.height - 2 * this.padding;
    if (points.length === 0) return { ox: this.padding + w / 2, oy: this.padding + h / 2, scale: 1 };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
    }
    const margin = 1;
    minX -= margin; maxX += margin; minY -= margin; maxY += margin;
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const scale = Math.min(w / rangeX, h / rangeY);
    const ox = this.padding + (w - rangeX * scale) / 2 - minX * scale;
    const oy = this.padding + (h - rangeY * scale) / 2 + maxY * scale;
    return { ox, oy, scale };
  }

  toCanvas(p, tr) { return [(p[0] * tr.scale + tr.ox), (tr.oy - p[1] * tr.scale)]; }

  drawPoint(p, tr, color = '#2196F3', radius = 6) {
    const [cx, cy] = this.toCanvas(p, tr);
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  drawLine(a, b, tr, color = '#FFC107', width = 2, dash = []) {
    const [ax, ay] = this.toCanvas(a, tr);
    const [bx, by] = this.toCanvas(b, tr);
    this.ctx.beginPath();
    this.ctx.moveTo(ax, ay);
    this.ctx.lineTo(bx, by);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.setLineDash(dash);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  drawPolygon(pts, tr, color = '#4CAF50', width = 2) {
    if (pts.length < 2) return;
    for (let i = 0; i < pts.length; i++) {
      this.drawLine(pts[i], pts[(i + 1) % pts.length], tr, color, width);
    }
  }

  render(state) {
    if (this.canvas.width === 0 || this.canvas.height === 0) return;
    this.clear();
    const tr = this.getTransform(state.points);
    this.ctx.fillStyle = '#2D2D2D';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (const p of state.points) this.drawPoint(p, tr);

    if (state.hullPoints && state.hullPoints.length > 0) {
      for (const p of state.hullPoints) this.drawPoint(p, tr, '#FFC107', 7);
      if (state.hullPoints.length > 1) {
        this.drawPolygon(state.hullPoints, tr, '#4CAF50', 2);
        this.drawLine(state.hullPoints[state.hullPoints.length - 1], state.hullPoints[0], tr, '#4CAF50', 2);
      }
    }

    if (state.currentPoint) {
      this.drawPoint(state.currentPoint, tr, '#4CAF50', 10);
      const [cx, cy] = this.toCanvas(state.currentPoint, tr);
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#4CAF50';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([4, 4]);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    if (state.highlightPoints) {
      for (const p of state.highlightPoints) this.drawPoint(p, tr, '#FF9800', 8);
    }
  }

  getCanvasPoint(e, points) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const tr = this.getTransform(points);
    const px = (x - tr.ox) / tr.scale;
    const py = (tr.oy - y) / tr.scale;
    return [Math.round(px * 100) / 100, Math.round(py * 100) / 100];
  }
}
