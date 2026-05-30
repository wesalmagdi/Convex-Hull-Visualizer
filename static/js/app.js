class SoundManager {
  constructor() {
    this.enabled = true;
    this.musicEnabled = false;
    this.sounds = {};
    this.music = null;
    const files = {
      click: '/assets/bonk%20doge.mp3',
      reset: '/assets/spongebob-fail.mp3',
      pew: '/assets/pew.mp3',
      music: '/assets/background_music.mp3',
    };
    const on = (name) => {
      const a = new Audio(files[name]);
      a.load();
      return a;
    };
    this.sounds.click = on('click');
    this.sounds.reset = on('reset');
    this.sounds.pew = on('pew');
    this.music = on('music');
    this.music.loop = true;
  }

  play(name) {
    if (!this.enabled) return;
    const s = this.sounds[name];
    if (!s) return;
    s.currentTime = 0;
    s.play().catch(() => {});
  }

  toggleSound() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.music.play().catch(() => { this.musicEnabled = false; });
    } else {
      this.music.pause();
      this.music.currentTime = 0;
    }
    return this.musicEnabled;
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
        this.sound.play('click');
        this.selectAlgorithm(btn.dataset.algo);
      });
    });
    document.getElementById('btn-add').addEventListener('click', () => { this.sound.play('click'); this.addPoint(); });
    document.getElementById('point-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') { this.sound.play('click'); this.addPoint(); }
    });
    document.getElementById('btn-random').addEventListener('click', () => { this.sound.play('click'); this.randomPoints(); });
    document.getElementById('btn-remove').addEventListener('click', () => { this.sound.play('click'); this.removeLast(); });
    document.getElementById('btn-reset').addEventListener('click', () => { this.sound.play('reset'); this.reset(); });
    document.getElementById('btn-start').addEventListener('click', () => { this.sound.play('click'); this.start(); });
    document.getElementById('btn-stop').addEventListener('click', () => { this.sound.play('click'); this.stop(); });
    document.getElementById('btn-back').addEventListener('click', () => { this.sound.play('click'); this.goBack(); });
    document.getElementById('btn-sound').addEventListener('click', () => {
      const on = this.sound.toggleSound();
      document.getElementById('btn-sound').classList.toggle('muted', !on);
    });
    document.getElementById('btn-music').addEventListener('click', () => {
      const on = this.sound.toggleMusic();
      document.getElementById('btn-music').classList.toggle('muted', !on);
    });
    this.canvas.addEventListener('click', e => {
      const p = this.viz.getCanvasPoint(e, this.points);
      if (isFinite(p[0]) && isFinite(p[1])) {
        this.sound.play('click');
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
      this.points.push([Math.random() * 18 - 9, Math.random() * 18 - 9]);
    }
    this.steps = [];
    this.stepIndex = 0;
    this.hullResult = null;
    this.running = false;
    this.updateUI();
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
    this.sound.musicEnabled = false;
    this.sound.toggleMusic();
    this.animate();
  }

  animate() {
    if (!this.running || this.stepIndex >= this.steps.length) {
      if (this.stepIndex >= this.steps.length && this.hullResult) {
        this.renderFinal();
        this.setStatus('Complete!', '#4CAF50');
        this.sound.play('pew');
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
      highlightPoints: step.lower || step.upper ? [...(step.lower || []), ...(step.upper || [])] : null,
    });
  }

  renderFinal() {
    const hull = this.hullResult || [];
    this.viz.render({ points: this.points, hullPoints: hull, currentPoint: null, highlightPoints: null });
  }

  stop() {
    this.running = false;
    if (this.animId) { clearTimeout(this.animId); this.animId = null; }
    this.sound.musicEnabled = true;
    this.sound.toggleMusic();
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
      this.viz.render({ points: this.points, hullPoints: null, currentPoint: null, highlightPoints: null });
    } else {
      this.viz.clear();
    }
    if (this.points.length < 3) {
      this.setStatus(`Need ${3 - this.points.length} more point${this.points.length === 2 ? '' : 's'}`, '#888');
    } else {
      this.setStatus('Ready — click Start', '#4CAF50');
    }
  }

  setStatus(msg, color = '#888') {
    const el = document.getElementById('status');
    el.textContent = msg;
    el.style.color = color;
  }
}

document.addEventListener('DOMContentLoaded', () => { new App(); });
