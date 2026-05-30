class App {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.viz = new Visualizer(this.canvas);
    this.points = [];
    this.algorithm = null;
    this.steps = [];
    this.stepIndex = 0;
    this.animId = null;
    this.running = false;
    this.hullResult = null;
    this.bindUI();
  }

  bindUI() {
    document.querySelectorAll('.menu-btn').forEach(btn => {
      btn.addEventListener('click', () => this.selectAlgorithm(btn.dataset.algo));
    });
    document.getElementById('btn-add').addEventListener('click', () => this.addPoint());
    document.getElementById('point-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.addPoint();
    });
    document.getElementById('btn-remove').addEventListener('click', () => this.removeLast());
    document.getElementById('btn-reset').addEventListener('click', () => this.reset());
    document.getElementById('btn-start').addEventListener('click', () => this.start());
    document.getElementById('btn-stop').addEventListener('click', () => this.stop());
    document.getElementById('btn-back').addEventListener('click', () => this.goBack());
    this.canvas.addEventListener('click', e => {
      const p = this.viz.getCanvasPoint(e, this.points);
      if (isFinite(p[0]) && isFinite(p[1])) {
        this.points.push(p);
        this.updateUI();
      }
    });
  }

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  selectAlgorithm(algo) {
    this.algorithm = algo;
    this.steps = [];
    this.stepIndex = 0;
    this.hullResult = null;
    this.running = false;
    const names = { graham: "Graham's Scan", giftwrap: 'Gift Wrapping', andrews: "Andrew's Monotone" };
    document.getElementById('algo-name').textContent = names[algo];
    this.showScreen('viz-screen');
    requestAnimationFrame(() => {
      this.viz.resize();
      this.updateUI();
    });
  }

  addPoint() {
    const input = document.getElementById('point-input');
    const parts = input.value.trim().split(/\s+/);
    if (parts.length === 2) {
      const x = parseFloat(parts[0]), y = parseFloat(parts[1]);
      if (!isNaN(x) && !isNaN(y)) {
        this.points.push([x, y]);
        input.value = '';
        this.updateUI();
      }
    }
  }

  removeLast() {
    this.points.pop();
    this.steps = [];
    this.stepIndex = 0;
    this.hullResult = null;
    this.running = false;
    this.updateUI();
  }

  reset() {
    this.points = [];
    this.steps = [];
    this.stepIndex = 0;
    this.hullResult = null;
    this.running = false;
    this.updateUI();
  }

  start() {
    if (this.points.length < 3) {
      this.setStatus('Need at least 3 points', '#F44336');
      return;
    }
    this.running = true;
    this.stepIndex = 0;
    this.hullResult = null;
    const algo = this.algorithm;
    let result;
    if (algo === 'graham') result = ConvexHullAlgorithms.grahamScan(this.points);
    else if (algo === 'giftwrap') result = ConvexHullAlgorithms.giftWrapping(this.points);
    else if (algo === 'andrews') result = ConvexHullAlgorithms.andrewsMonotone(this.points);
    this.steps = result.steps;
    this.hullResult = result.hull;
    this.setStatus('Running...', '#4CAF50');
    this.animate();
  }

  animate() {
    if (!this.running || this.stepIndex >= this.steps.length) {
      if (this.stepIndex >= this.steps.length && this.hullResult) {
        this.renderFinal();
        this.setStatus('Complete!', '#4CAF50');
      }
      this.running = false;
      return;
    }
    this.renderStep(this.steps[this.stepIndex]);
    this.stepIndex++;
    if (this.running) {
      this.animId = setTimeout(() => this.animate(), 400);
    }
  }

  renderStep(step) {
    const hull = step.hull || step.stack || [];
    this.viz.render({
      points: this.points,
      hullPoints: hull,
      currentPoint: step.current || null,
      highlightPoints: step.lower || step.upper ? [...(step.lower || []), ...(step.upper || [])] : null
    });
  }

  renderFinal() {
    const hull = this.hullResult || [];
    let state = { points: this.points, hullPoints: hull, currentPoint: null, highlightPoints: null };
    if (this.algorithm === 'andrews') {
      state.highlightPoints = null;
    }
    this.viz.render(state);
  }

  stop() {
    this.running = false;
    if (this.animId) { clearTimeout(this.animId); this.animId = null; }
    this.setStatus('Stopped', '#FF9800');
  }

  goBack() {
    this.stop();
    this.running = false;
    this.steps = [];
    this.stepIndex = 0;
    this.hullResult = null;
    document.getElementById('algo-name').textContent = '';
    this.showScreen('menu-screen');
  }

  updateUI() {
    document.getElementById('point-count').textContent = `Points: ${this.points.length}`;
    if (this.points.length > 0) {
      this.viz.render({ points: this.points, hullPoints: null, currentPoint: null });
    } else {
      this.viz.clear();
    }
    if (this.points.length < 3) {
      this.setStatus(`Add ${3 - this.points.length} more point${this.points.length === 2 ? '' : 's'}`, '#888');
    }
  }

  setStatus(msg, color = '#888') {
    const el = document.getElementById('status');
    el.textContent = msg;
    el.style.color = color;
  }
}

document.addEventListener('DOMContentLoaded', () => { new App(); });
