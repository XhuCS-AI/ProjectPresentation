// ======== 数据加载 ========
async function loadData() {
  try {
    const res = await fetch('data.json', { cache: 'no-store' });
    const data = await res.json();
    const container = document.getElementById('departments');
    container.innerHTML = '';
    for (const dept in data) {
      const deptDiv = document.createElement('section');
      deptDiv.className = 'department';

      const deptTitle = document.createElement('h2');
      deptTitle.textContent = dept;
      deptDiv.appendChild(deptTitle);

      const projectList = document.createElement('div');
      projectList.className = 'project-list';

      data[dept].forEach(project => {
        const card = document.createElement('article');
        card.className = 'project-card';
        card.innerHTML = `
          <h3>${project.name}</h3>
          <hr class="divider" />
          <p><strong>介绍：</strong>${project.intro}</p>
          <p><strong>负责人：</strong>${project.leader}</p>
          <p><strong>参与成员：</strong>${Array.isArray(project.members) ? project.members.join('，') : project.members}</p>
        `;
        projectList.appendChild(card);
      });

      deptDiv.appendChild(projectList);
      container.appendChild(deptDiv);
    }
  } catch (e) {
    console.error('加载数据出错:', e);
  }
}

// 初次加载
loadData();

// ======== 背景粒子/线条系统 ========
(function() {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let W, H;

  const state = {
    particles: [],
    lines: [],
    mouse: { x: null, y: null, radius: 140 },
    maxParticles: 110,  // 可调：粒子数量
    linkDist: 120       // 可调：连线距离
  };

  function resize() {
    W = canvas.clientWidth = window.innerWidth;
    H = canvas.clientHeight = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function createParticle() {
    return {
      x: rand(0, W), y: rand(0, H),
      vx: rand(-0.6, 0.6), vy: rand(-0.6, 0.6),
      size: rand(1, 2.2),
      hue: Math.random() < 0.5 ? 186 : 276, // 青/紫
      alpha: rand(0.35, 0.75)
    };
  }

  function init(n = state.maxParticles) {
    state.particles = [];
    for (let i = 0; i < n; i++) state.particles.push(createParticle());
  }

  function drawParticle(p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue} 100% 60% / ${p.alpha})`;
    ctx.shadowBlur = 12; ctx.shadowColor = `hsla(${p.hue} 100% 60% / 0.7)`;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function step() {
    ctx.clearRect(0, 0, W, H);

    // 轻微网格性渐变背景（极淡）
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, 'rgba(0,229,255,0.04)');
    grad.addColorStop(1, 'rgba(168,85,247,0.04)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // 粒子移动
    for (const p of state.particles) {
      p.x += p.vx; p.y += p.vy;

      // 与边界轻柔反弹
      if (p.x <= 0 || p.x >= W) p.vx *= -1;
      if (p.y <= 0 || p.y >= H) p.vy *= -1;

      // 与鼠标的斥力/吸引
      if (state.mouse.x !== null) {
        const dx = p.x - state.mouse.x;
        const dy = p.y - state.mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < state.mouse.radius) {
          const force = (state.mouse.radius - dist) / state.mouse.radius;
          const angle = Math.atan2(dy, dx);
          // 轻吸+斥的混合，保证手感顺滑
          p.vx += Math.cos(angle) * 0.02 * force - dx * 0.00004;
          p.vy += Math.sin(angle) * 0.02 * force - dy * 0.00004;
        }
      }
    }

    // 连接线条
    for (let i = 0; i < state.particles.length; i++) {
      const a = state.particles[i];
      drawParticle(a);
      for (let j = i + 1; j < state.particles.length; j++) {
        const b = state.particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < state.linkDist) {
          const t = 1 - dist / state.linkDist; // 近距离更亮
          const hue = (a.hue + b.hue) / 2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `hsla(${hue} 100% 65% / ${t * 0.45})`;
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }
      }
    }

    // 鼠标光束（与附近粒子相连）
    if (state.mouse.x !== null) {
      for (const p of state.particles) {
        const dx = p.x - state.mouse.x; const dy = p.y - state.mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < state.linkDist * 0.9) {
          const t = 1 - dist / (state.linkDist * 0.9);
          ctx.beginPath();
          ctx.moveTo(state.mouse.x, state.mouse.y);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `hsla(${p.hue} 100% 65% / ${t * 0.55})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      // 发光鼠标节点
      ctx.beginPath();
      ctx.arc(state.mouse.x, state.mouse.y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.shadowBlur = 12; ctx.shadowColor = 'rgba(255,255,255,0.9)';
      ctx.fill(); ctx.shadowBlur = 0;
    }

    requestAnimationFrame(step);
  }

  // 事件
  window.addEventListener('resize', () => { resize(); init(); });
  window.addEventListener('mousemove', (e) => {
    state.mouse.x = e.clientX; state.mouse.y = e.clientY;
  });
  window.addEventListener('mouseleave', () => { state.mouse.x = null; state.mouse.y = null; });

  // 触摸兼容
  window.addEventListener('touchstart', (e) => {
    const t = e.touches[0]; state.mouse.x = t.clientX; state.mouse.y = t.clientY; 
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    const t = e.touches[0]; state.mouse.x = t.clientX; state.mouse.y = t.clientY; 
  }, { passive: true });
  window.addEventListener('touchend', () => { state.mouse.x = null; state.mouse.y = null; });

  // 启动
  resize(); init(); step();
})();
