class SoundManager {
  constructor() {
    this.sfxOn = true;
    this.musicOn = false;
    this.musicPlaying = false;
    this.musicEl = null;
    this._initMusic();
  }

  _initMusic() {
    const m = new Audio('/assets/na%20na%20na.mp3');
    m.loop = true;
    m.volume = 0.3;
    m.preload = 'auto';
    this.musicEl = m;
  }

  sfx(name) {
    if (!this.sfxOn) return;
    const paths = {
      click: '/assets/bonk%20doge.mp3',
      pew: '/assets/bonk%20doge.mp3',
      reset: '/assets/spongebob-fail.mp3',
    };
    const path = paths[name];
    if (!path) return;
    try {
      const a = new Audio(path);
      a.volume = 0.5;
      a.play().catch(() => {});
    } catch {}
  }

  musicStart() {
    if (!this.musicOn || !this.musicEl) return;
    this.musicEl.currentTime = 0;
    this.musicEl.play().then(() => {
      this.musicPlaying = true;
    }).catch(() => {});
  }

  musicStop() {
    if (!this.musicEl) return;
    this.musicEl.pause();
    this.musicEl.currentTime = 0;
    this.musicPlaying = false;
  }

  toggleSfx() {
    this.sfxOn = !this.sfxOn;
    return this.sfxOn;
  }

  toggleMusic() {
    this.musicOn = !this.musicOn;
    if (this.musicOn) {
      this.musicEl.play().then(() => {
        this.musicPlaying = true;
      }).catch(() => { this.musicOn = false; });
    } else {
      this.musicStop();
    }
    return this.musicOn;
  }
}

class App {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.viz = new Visualizer(this.canvas);
    this.sound = new SoundManager();
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
      btn.addEventListener('click', () => {
        this.sound.sfx('click');
        this.selectAlgorithm(btn.dataset.algo);
      });
    });
    document.getElementById('btn-add').addEventListener('click', () => {
      this.sound.sfx('click'); this.addPoint();
    });
    document.getElementById('point-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') { this.sound.sfx('click'); this.addPoint(); }
    });
    document.getElementById('btn-random').addEventListener('click', () => {
      this.sound.sfx('click'); this.randomPoints();
    });
    document.getElementById('btn-remove').addEventListener('click', () => {
      this.sound.sfx('click'); this.removeLast();
    });
    document.getElementById('btn-reset').addEventListener('click', () => {
      this.sound.sfx('reset'); this.reset();
    });
    document.getElementById('btn-start').addEventListener('click', () => {
      this.sound.sfx('click'); this.start();
    });
    document.getElementById('btn-stop').addEventListener('click', () => {
      this.sound.sfx('click'); this.stop();
    });
    document.getElementById('btn-back').addEventListener('click', () => {
      this.sound.sfx('click'); this.goBack();
    });
    document.getElementById('btn-sound').addEventListener('click', () => {
      const on = this.sound.toggleSfx();
      document.getElementById('btn-sound').classList.toggle('muted', !on);
    });
    document.getElementById('btn-music').addEventListener('click', () => {
      const on = this.sound.toggleMusic();
      document.getElementById('btn-music').classList.toggle('muted', !on);
    });
    this.canvas.addEventListener('click', e => {
      const p = this.viz.getCanvasPoint(e, this.points);
      if (isFinite(p[0]) && isFinite(p[1])) {
        this.sound.sfx('click');
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

  randomPoints() {
    const count = parseInt(document.getElementById('rand-count').value) || 10;
    const n = Math.max(3, Math.min(100, count));
    this.points = [];
    for (let i = 0; i < n; i++) {
      this.points.push([+(Math.random() * 18 - 9).toFixed(2), +(Math.random() * 18 - 9).toFixed(2)]);
    }
    this.steps = [];
    this.stepIndex = 0;
    this.hullResult = null;
    this.running = false;
    this.updateUI();
  }

  removeLast() {
    this.points.pop();
    this.steps = []; this.stepIndex = 0;
    this.hullResult = null; this.running = false;
    this.updateUI();
  }

  reset() {
    this.points = [];
    this.steps = []; this.stepIndex = 0;
    this.hullResult = null; this.running = false;
    this.updateUI();
  }

  start() {
    if (this.points.length < 3) {
      this.setStatus('Need at least 3 points', '#e74c3c');
      return;
    }
    this.running = true;
    this.stepIndex = 0;
    this.hullResult = null;
    const algo = this.algorithm;
    let result;
    if (algo === 'graham') result = ConvexHullAlgorithms.grahamScan(this.points);
    else if (algo === 'giftwrap') result = ConvexHullAlgorithms.giftWrapping(this.points);
    else result = ConvexHullAlgorithms.andrewsMonotone(this.points);
    this.steps = result.steps;
    this.hullResult = result.hull;
    this.setStatus('Running...', '#6c63ff');
    this.sound.musicStart();
    this.animate();
  }

  animate() {
    if (!this.running || this.stepIndex >= this.steps.length) {
      if (this.stepIndex >= this.steps.length && this.hullResult) {
        this.renderFinal();
        this.setStatus('Complete!', '#2ecc71');
        this.sound.sfx('pew');
        this.sound.musicStop();
      }
      this.running = false;
      return;
    }
    this.renderStep(this.steps[this.stepIndex]);
    this.stepIndex++;
    if (this.running) {
      this.animId = setTimeout(() => this.animate(), 350);
    }
  }

  renderStep(step) {
    const hull = step.hull || step.stack || [];
    this.viz.render({
      points: this.points,
      hullPoints: hull,
      currentPoint: step.current || null,
      highlightPoints: step.lower || step.upper ? [...(step.lower || []), ...(step.upper || [])] : null,
    });
  }

  renderFinal() {
    this.viz.render({
      points: this.points,
      hullPoints: this.hullResult || [],
      currentPoint: null,
      highlightPoints: null,
    });
  }

  stop() {
    this.running = false;
    if (this.animId) { clearTimeout(this.animId); this.animId = null; }
    this.sound.musicStop();
    this.setStatus('Stopped', '#f39c12');
  }

  goBack() {
    this.stop();
    this.running = false;
    this.steps = []; this.stepIndex = 0; this.hullResult = null;
    document.getElementById('algo-name').textContent = '';
    this.showScreen('menu-screen');
  }

  updateUI() {
    document.getElementById('point-count').textContent = `Points: ${this.points.length}`;
    if (this.points.length > 0) {
      this.viz.render({ points: this.points, hullPoints: null, currentPoint: null, highlightPoints: null });
    } else {
      this.viz.clear();
    }
    if (this.points.length < 3) {
      this.setStatus(`Need ${3 - this.points.length} more`, '#888');
    } else {
      this.setStatus('Ready', '#2ecc71');
    }
  }

  setStatus(msg, color) {
    const el = document.getElementById('status');
    el.textContent = msg;
    el.style.color = color;
  }
}

document.addEventListener('DOMContentLoaded', () => { new App(); });
