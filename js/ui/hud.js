const NAMES = ['阿岚', '老穆', '小满', '茶茶', '苇子', '安禾', '林渡', '阿穗', '沐白', '苏叶', '余弦', '南枝'];
const JOBS = ['面包师', '灯塔看守', '花匠', '邮差', '钟表匠', '织布工', '拾云人', '旧书店老板', '修伞匠', '风车管理员'];
const LINES = [
  '说今晚的云会低到屋檐。',
  '窗台上的薄荷该浇水了。',
  '灯塔的灯芯换过了，能亮一整夜。',
  '面团的第三次发酵还差一刻钟。',
  '从这儿看，云像一层融化的奶。',
  '钟慢了半拍，可没人介意。',
  '第一班邮船要等日头落尽。',
  '昨天的风把晾着的布吹跑了。',
];

export function buildHUD(handlers) {
  const root = document.getElementById('ui');

  // ---------- 标题 ----------
  const title = document.createElement('div');
  title.className = 'panel title';
  title.innerHTML = `<h1>云海小镇</h1><p>Cloud Town · 三渲二 / Toon Shaded</p>`;
  root.appendChild(title);

  // ---------- 状态 ----------
  const status = document.createElement('div');
  status.className = 'panel status';
  status.innerHTML = `
    <div class="row"><span class="lbl">时刻</span><span id="clock">10:30</span></div>
    <div class="row"><span class="lbl">时段</span><span id="phase">上午</span></div>
    <div class="row"><span class="lbl">FPS</span><span id="fps">–</span></div>`;
  root.appendChild(status);

  // ---------- 控制面板 ----------
  const panel = document.createElement('div');
  panel.className = 'panel controls';
  panel.innerHTML = `
    <div class="group">
      <div class="group-title">时间</div>
      <div class="btns">
        <button data-hour="10.5">白天</button>
        <button data-hour="18.45">黄昏</button>
        <button data-hour="21.6">夜晚</button>
      </div>
      <input id="slider" type="range" min="0" max="24" step="0.05" value="10.5">
    </div>
    <div class="group">
      <div class="group-title">镜头</div>
      <div class="btns">
        <button data-view="overview">全景</button>
        <button data-view="street">街道</button>
        <button data-view="plaza">广场</button>
        <button data-view="hero">英雄镜头</button>
      </div>
    </div>
    <div class="group">
      <div class="group-title">演出</div>
      <div class="btns">
        <button id="btn-replay">重播生长</button>
        <button id="btn-lamps">路灯开关</button>
        <button id="btn-outline">描边 on</button>
        <button id="btn-rotate">自动环绕</button>
      </div>
    </div>`;
  root.appendChild(panel);

  // ---------- 提示 ----------
  const help = document.createElement('div');
  help.className = 'help';
  help.innerHTML = `<b>拖拽</b>旋转 · <b>滚轮</b>缩放 · <b>点房屋</b>推近+生长 · <b>点路灯</b>开关<br>
    <b>1-4</b> 视角 · <b>D/N/G</b> 时间 · <b>空格</b> 重播 · <b>R</b> 复位 · <b>H</b> 隐藏 UI`;
  root.appendChild(help);

  // ---------- 房屋信息卡 ----------
  const card = document.createElement('div');
  card.className = 'panel card hidden';
  root.appendChild(card);

  const clockEl = status.querySelector('#clock');
  const phaseEl = status.querySelector('#phase');
  const fpsEl = status.querySelector('#fps');
  const slider = panel.querySelector('#slider');

  const phaseOf = (h) => {
    if (h >= 6.9 && h < 16.5) return '白天';
    if (h >= 16.5 && h < 20.3) return '黄昏';
    return '夜晚';
  };

  const info = new Map();
  let seed = 0;
  function houseInfo(rec) {
    if (info.has(rec)) return info.get(rec);
    seed += 1;
    const n = NAMES[seed % NAMES.length];
    const j = JOBS[(seed * 3) % JOBS.length];
    const l = LINES[(seed * 5) % LINES.length];
    const d = { name: n, job: j, line: l };
    info.set(rec, d);
    return d;
  }

  // 事件
  panel.querySelectorAll('button[data-hour]').forEach((b) => {
    b.addEventListener('click', () => handlers.onHour(parseFloat(b.dataset.hour)));
  });
  panel.querySelectorAll('button[data-view]').forEach((b) => {
    b.addEventListener('click', () => handlers.onView(b.dataset.view));
  });
  slider.addEventListener('input', () => handlers.onHour(parseFloat(slider.value), true));

  panel.querySelector('#btn-replay').addEventListener('click', handlers.onReplay);
  panel.querySelector('#btn-lamps').addEventListener('click', handlers.onLamps);
  const outlineBtn = panel.querySelector('#btn-outline');
  outlineBtn.addEventListener('click', () => {
    const on = handlers.onOutline();
    outlineBtn.textContent = on ? '描边 on' : '描边 off';
  });
  const rotBtn = panel.querySelector('#btn-rotate');
  rotBtn.addEventListener('click', () => {
    const on = handlers.onRotate();
    rotBtn.classList.toggle('active', on);
  });

  // 点击面板时不触发场景点击
  root.addEventListener('pointerdown', (e) => e.stopPropagation());

  let hidden = false;
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'h') {
      hidden = !hidden;
      root.classList.toggle('hidden', hidden);
    } else if (k === ' ') {
      e.preventDefault();
      handlers.onReplay();
    } else if (k === 'r') handlers.onView('overview');
    else if (k === 'd') handlers.onHour(10.5);
    else if (k === 'g') handlers.onHour(18.45);
    else if (k === 'n') handlers.onHour(21.6);
    else if (k === '1') handlers.onView('overview');
    else if (k === '2') handlers.onView('street');
    else if (k === '3') handlers.onView('plaza');
    else if (k === '4') handlers.onView('hero');
  });

  return {
    setTime(hour) {
      const hh = Math.floor(hour);
      const mm = Math.floor((hour - hh) * 60);
      clockEl.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      phaseEl.textContent = phaseOf(hour);
      if (document.activeElement !== slider) slider.value = String(hour);
    },
    setFPS(v) { fpsEl.textContent = String(Math.round(v)); },
    showCard(rec) {
      if (!rec) {
        card.classList.add('hidden');
        return;
      }
      const d = rec.owner
        ? { name: rec.owner.name, job: rec.owner.profession.name, line: rec.owner.line }
        : houseInfo(rec);
      card.innerHTML = `<div class="card-name">${d.name}</div>
        <div class="card-job">${d.job}</div>
        <div class="card-line">“${d.line}”</div>
        <div class="card-tip">点击 · 推近并重新生长</div>`;
      card.classList.remove('hidden');
    },
    hideCard() { card.classList.add('hidden'); },
    setLoading(text) {
      const el = document.getElementById('loading');
      if (!el) return;
      if (text === null) el.classList.add('hidden');
      else el.textContent = text;
    },
  };
}
