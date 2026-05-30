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

  drawGrid(tr) {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255,64,129,0.05)';
    ctx.lineWidth = 1;
    const step = this._niceStep(tr.scale);
    const [x0, y0] = this.toCanvas([0, 0], tr);
    const nw = Math.ceil(this.canvas.width / (step * tr.scale)) + 1;
    const nh = Math.ceil(this.canvas.height / (step * tr.scale)) + 1;
    for (let i = -nw; i <= nw; i++) {
      const px = x0 + i * step * tr.scale;
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, this.canvas.height); ctx.stroke();
    }
    for (let i = -nh; i <= nh; i++) {
      const py = y0 - i * step * tr.scale;
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(this.canvas.width, py); ctx.stroke();
    }
  }

  _niceStep(scale) {
    const raw = 60 / scale;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    if (norm < 1.5) return mag;
    if (norm < 3.5) return 2 * mag;
    if (norm < 7.5) return 5 * mag;
    return 10 * mag;
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
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawGrid(tr);
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

    if (state.stepDesc) this._drawStepDesc(state.stepDesc);

    if (state.overlay) this._drawOverlay(state.overlay);
  }

  _drawStepDesc(text) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const pad = 24;
    const labelW = Math.min(w - pad * 2, 560);
    const labelH = 44;
    const cx = w / 2;

    ctx.save();
    // pill background
    const x = cx - labelW / 2, y = 18;
    ctx.shadowColor = 'rgba(255,64,129,0.2)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.roundRect(x, y, labelW, labelH, 22);
    ctx.fill();
    ctx.shadowBlur = 0;

    // hairline border
    ctx.strokeStyle = 'rgba(255,64,129,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, labelW, labelH, 22);
    ctx.stroke();

    // current-step dot
    ctx.fillStyle = '#ff4081';
    ctx.beginPath();
    ctx.arc(x + 18, y + labelH / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '13px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(text, cx, y + labelH / 2);
    ctx.restore();
  }

  _drawOverlay(o) {
    const ctx = this.ctx;
    const w = this.canvas.width, h = this.canvas.height;

    // dim background
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, w, h);

    // decorative border glow
    const pad = 60;
    ctx.shadowColor = 'rgba(255,64,129,0.15)';
    ctx.shadowBlur = 40;
    ctx.strokeStyle = 'rgba(255,64,129,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
    ctx.shadowBlur = 0;

    // checkmark + main message
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = w / 2, cy = h / 2 - 20;

    ctx.shadowColor = 'rgba(46,204,113,0.6)';
    ctx.shadowBlur = 30;
    ctx.font = 'bold 52px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#2ecc71';
    ctx.fillText('✓', cx, cy - 44);
    ctx.shadowBlur = 0;

    ctx.shadowColor = 'rgba(255,64,129,0.5)';
    ctx.shadowBlur = 24;
    ctx.font = 'bold 36px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('Convex Hull Complete', cx, cy + 16);
    ctx.shadowBlur = 0;

    // stats line
    ctx.font = '15px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    const stats = [`${o.points} points`, `${o.hullPoints} hull vertices`, o.algo].filter(Boolean).join('  ·  ');
    ctx.fillText(stats, cx, cy + 66);

    // subtle prompt
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillText('press Stop to explore · Export to save', cx, cy + 106);
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
