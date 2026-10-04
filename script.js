/* ============================================
   ACHMAD MUZAMMIL — PORTFOLIO ENGINE v3.0
   Semua fitur premium dalam satu file
============================================ */

'use strict';

/* ============================================
   1. INIT LUCIDE
============================================ */
lucide.createIcons();

/* ============================================
   2. STATE GLOBAL
============================================ */
const STATE = {
  soundEnabled: localStorage.getItem('sound') === 'true',
  theme: localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'),
  prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  isTouch: window.matchMedia('(pointer: coarse)').matches,
};

/* ============================================
   3. SOUND ENGINE — Web Audio API (subtle SFX)
============================================ */
const Sound = {
  ctx: null,

  init() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { /* silent */ }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  play(frequency = 800, duration = 0.05, type = 'sine', gain = 0.03) {
    if (!STATE.soundEnabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      g.gain.setValueAtTime(0, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(gain, this.ctx.currentTime + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + duration + 0.02);
    } catch (e) { /* silent */ }
  },

  click() { this.play(1200, 0.04, 'sine', 0.025); },
  toggle() { this.play(880, 0.06, 'sine', 0.03); },
  success() {
    this.play(880, 0.08, 'sine', 0.03);
    setTimeout(() => this.play(1320, 0.1, 'sine', 0.03), 60);
  }
};

/* ============================================
   4. PRELOADER
============================================ */
(function preloader() {
  const pre = document.getElementById('preloader');
  const bar = document.getElementById('plBar');
  const pct = document.getElementById('plPercent');
  if (!pre) return;

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 10 + 4;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(() => {
        pre.classList.add('loaded');
        document.dispatchEvent(new CustomEvent('preloader:done'));
      }, 400);
    }
    bar.style.width = progress + '%';
    pct.textContent = Math.floor(progress) + '%';
  }, 130);
})();

/* ============================================
   5. THEME MANAGEMENT
============================================ */
const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;

root.setAttribute('data-theme', STATE.theme);

function setTheme(theme) {
  STATE.theme = theme;
  root.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const metaDark = document.querySelector('meta[name="theme-color"][media*="dark"]');
  const metaLight = document.querySelector('meta[name="theme-color"][media*="light"]');
  if (metaDark) metaDark.content = theme === 'dark' ? '#0A0E14' : '#FCFCFE';
  if (metaLight) metaLight.content = theme === 'dark' ? '#0A0E14' : '#FCFCFE';
  Sound.toggle();
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    setTheme(STATE.theme === 'dark' ? 'light' : 'dark');
  });
}

// Listen to system theme changes
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    setTheme(e.matches ? 'light' : 'dark');
  }
});

/* ============================================
   6. SOUND TOGGLE
============================================ */
const soundToggle = document.getElementById('soundToggle');
if (soundToggle) {
  if (!STATE.soundEnabled) soundToggle.classList.add('muted');
  soundToggle.addEventListener('click', () => {
    STATE.soundEnabled = !STATE.soundEnabled;
    localStorage.setItem('sound', STATE.soundEnabled);
    soundToggle.classList.toggle('muted', !STATE.soundEnabled);
    if (STATE.soundEnabled) {
      Sound.init();
      Sound.success();
    }
  });
}

// Init sound on first user interaction
document.addEventListener('pointerdown', () => Sound.init(), { once: true });

/* ============================================
   7. UNIFIED RAF LOOP — performance
============================================ */
const RAF = {
  tasks: new Set(),
  running: false,

  add(fn) {
    this.tasks.add(fn);
    if (!this.running) this.start();
    return () => this.tasks.delete(fn);
  },

  start() {
    this.running = true;
    const loop = () => {
      this.tasks.forEach((fn) => fn());
      if (this.tasks.size > 0) {
        requestAnimationFrame(loop);
      } else {
        this.running = false;
      }
    };
    requestAnimationFrame(loop);
  }
};

/* ============================================
   8. CUSTOM CURSOR
============================================ */
(function customCursor() {
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring || STATE.isTouch) return;

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
  }, { passive: true });

  RAF.add(() => {
    const dx = mx - rx;
    const dy = my - ry;
    if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) return;
    rx += dx * 0.16;
    ry += dy * 0.16;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
  });

  // Hover detection with event delegation
  const hoverSelectors = 'a, button, .skill-card, .bento-card, .social-card, .contact-item, .timeline-content, .badge-card, .chip, input';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverSelectors)) {
      ring.classList.add('hover');
      dot.classList.add('hover');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverSelectors)) {
      ring.classList.remove('hover');
      dot.classList.remove('hover');
    }
  });

  // Drag state for badge
  const badge = document.getElementById('badgeCard');
  if (badge) {
    badge.addEventListener('mousedown', () => ring.classList.add('drag'));
    document.addEventListener('mouseup', () => ring.classList.remove('drag'));
  }
})();

/* ============================================
   9. TILT — unified smooth engine
============================================ */
function createTilt(el, options = {}) {
  const {
    max = 8,
    scale = 1.015,
    perspective = 1100,
    damping = 0.14,
  } = options;

  let targetRX = 0, targetRY = 0;
  let currentRX = 0, currentRY = 0;
  let scaleCurrent = 1;
  let scaleTarget = 1;
  let active = false;
  let removeRAF = null;

  function loop() {
    const dx = targetRX - currentRX;
    const dy = targetRY - currentRY;
    const ds = scaleTarget - scaleCurrent;

    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01 && Math.abs(ds) < 0.001) {
      currentRX = targetRX;
      currentRY = targetRY;
      scaleCurrent = scaleTarget;
      el.style.transform = `perspective(${perspective}px) rotateX(${currentRX}deg) rotateY(${currentRY}deg) scale(${scaleCurrent})`;
      if (removeRAF) { removeRAF(); removeRAF = null; }
      return;
    }

    currentRX += dx * damping;
    currentRY += dy * damping;
    scaleCurrent += ds * damping;

    el.style.transform = `perspective(${perspective}px) rotateX(${currentRX.toFixed(3)}deg) rotateY(${currentRY.toFixed(3)}deg) scale(${scaleCurrent.toFixed(4)})`;
  }

  function start() {
    if (!removeRAF) removeRAF = RAF.add(loop);
  }

  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    targetRX = ((y - cy) / cy) * -max;
    targetRY = ((x - cx) / cx) * max;
    scaleTarget = scale;
    el.style.setProperty('--mx', `${(x / rect.width) * 100}%`);
    el.style.setProperty('--my', `${(y / rect.height) * 100}%`);
    active = true;
    start();
  });

  el.addEventListener('mouseleave', () => {
    targetRX = 0;
    targetRY = 0;
    scaleTarget = 1;
    active = false;
    start();
  });
}

document.querySelectorAll('[data-tilt]').forEach((el) => createTilt(el, { max: 8, scale: 1.02 }));
document.querySelectorAll('[data-tilt-3d]').forEach((el) => createTilt(el, { max: 6, scale: 1.01, perspective: 1200 }));

/* ============================================
   10. MAGNETIC BUTTON
============================================ */
document.querySelectorAll('.magnetic').forEach((btn) => {
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let removeRAF = null;

  function loop() {
    const dx = targetX - currentX;
    const dy = targetY - currentY;

    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
      currentX = targetX;
      currentY = targetY;
      btn.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      if (removeRAF) { removeRAF(); removeRAF = null; }
      return;
    }

    currentX += dx * 0.2;
    currentY += dy * 0.2;
    btn.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
  }

  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    targetX = (e.clientX - rect.left - rect.width / 2) * 0.3;
    targetY = (e.clientY - rect.top - rect.height / 2) * 0.4;
    if (!removeRAF) removeRAF = RAF.add(loop);
  });

  btn.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
    if (!removeRAF) removeRAF = RAF.add(loop);
  });
});

/* ============================================
   11. RIPPLE EFFECT
============================================ */
document.querySelectorAll('[data-ripple]').forEach((el) => {
  el.addEventListener('click', (e) => {
    const rect = el.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
    Sound.click();
  });
});

/* ============================================
   12. REVEAL ON SCROLL
============================================ */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
);

document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

/* ============================================
   13. SKILL RADIAL PROGRESS
============================================ */
const skillObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const ring = entry.target.querySelector('.skill-ring');
        if (ring) {
          const p = parseFloat(ring.style.getPropertyValue('--p')) || 0;
          const circumference = 2 * Math.PI * 42;
          const offset = circumference * (1 - p / 100);
          const fg = ring.querySelector('.ring-fg');
          if (fg) fg.style.strokeDashoffset = offset;
        }
        skillObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 }
);

document.querySelectorAll('.skill-card').forEach((c) => skillObserver.observe(c));

/* ============================================
   14. ANIMATED COUNTER
============================================ */
const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = 'true';
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll('[data-count]').forEach((el) => counterObserver.observe(el));

function animateCounter(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimal || '0');
  const suffix = el.dataset.suffix || '';
  const duration = 2000;
  const start = performance.now();

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    const value = (target * eased).toFixed(decimals);
    el.textContent = value + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

/* ============================================
   15. NAVBAR — pill + spy + clock + progress
============================================ */
(function navbar() {
  const navbarEl = document.querySelector('.navbar');
  const navLinksEl = document.querySelectorAll('.nav-link');
  const navPill = document.querySelector('.nav-pill');
  const navLinksContainer = document.querySelector('.nav-links');

  function movePill(targetLink) {
    if (!navPill || !targetLink || window.innerWidth <= 720) return;
    const containerRect = navLinksContainer.getBoundingClientRect();
    const linkRect = targetLink.getBoundingClientRect();
    const left = linkRect.left - containerRect.left;
    navPill.style.width = linkRect.width + 'px';
    navPill.style.transform = `translate3d(${left}px, 0, 0)`;
  }

  function setActiveLink(link) {
    navLinksEl.forEach((l) => l.classList.remove('active'));
    link.classList.add('active');
    movePill(link);
  }

  window.addEventListener('load', () => {
    const activeLink = document.querySelector('.nav-link.active') || navLinksEl[0];
    if (activeLink) setTimeout(() => movePill(activeLink), 250);
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const activeLink = document.querySelector('.nav-link.active');
      if (activeLink) movePill(activeLink);
      const dockActive = document.querySelector('.dock-item.active');
      if (dockActive) moveDockPill(dockActive);
    }, 150);
  }, { passive: true });

  navLinksEl.forEach((link) => {
    link.addEventListener('mouseenter', () => {
      if (window.innerWidth <= 720) return;
      movePill(link);
    });
    link.addEventListener('click', () => {
      setActiveLink(link);
      Sound.click();
    });
  });

  if (navLinksContainer) {
    navLinksContainer.addEventListener('mouseleave', () => {
      const activeLink = document.querySelector('.nav-link.active');
      if (activeLink) movePill(activeLink);
    });
  }

  window.addEventListener('scroll', () => {
    navbarEl.style.transform = window.scrollY > 50
      ? 'translateX(-50%) translate3d(0, -4px, 0)'
      : 'translateX(-50%) translate3d(0, 0, 0)';
  }, { passive: true });

  // Scroll spy
  const sections = document.querySelectorAll('section[id]');
  const spyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          const link = document.querySelector(`.nav-link[href="#${id}"]`);
          if (link && !link.classList.contains('active')) setActiveLink(link);

          document.querySelectorAll('.dock-item').forEach((d) => {
            d.classList.toggle('active', d.getAttribute('href') === `#${id}`);
          });

          const dockActive = document.querySelector('.dock-item.active');
          if (dockActive) moveDockPill(dockActive);
        }
      });
    },
    { threshold: 0.35, rootMargin: '-20% 0px -40% 0px' }
  );

  sections.forEach((sec) => spyObserver.observe(sec));

  // Scroll progress
  const scrollBar = document.getElementById('scrollBar');
  function updateProgress() {
    if (!scrollBar) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollBar.style.width = progress + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('load', updateProgress);

  // Clock WIB
  const clockTime = document.getElementById('clockTime');
  function updateClock() {
    if (!clockTime) return;
    const now = new Date();
    const wib = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (7 * 3600000));
    clockTime.textContent = `${String(wib.getHours()).padStart(2, '0')}:${String(wib.getMinutes()).padStart(2, '0')}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // Mobile menu
  const menuToggle = document.getElementById('menuToggle');
  const navLinksMenu = document.getElementById('navLinks');

  if (menuToggle && navLinksMenu) {
    menuToggle.addEventListener('click', () => {
      const open = menuToggle.classList.toggle('open');
      navLinksMenu.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', open);
      Sound.toggle();
    });

    navLinksMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('open');
        navLinksMenu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();

/* ============================================
   16. MOBILE DOCK
============================================ */
const dockItems = document.querySelectorAll('.dock-item');
const dockPill = document.querySelector('.dock-pill');
const mobileDock = document.getElementById('mobileDock');

function moveDockPill(target) {
  if (!dockPill || !mobileDock || !target) return;
  const containerRect = mobileDock.getBoundingClientRect();
  const itemRect = target.getBoundingClientRect();
  const left = itemRect.left - containerRect.left;
  dockPill.style.width = itemRect.width + 'px';
  dockPill.style.transform = `translate3d(${left}px, 0, 0)`;
}

if (mobileDock) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const active = document.querySelector('.dock-item.active') || dockItems[0];
      if (active) moveDockPill(active);
    }, 300);
  });

  dockItems.forEach((item) => {
    item.addEventListener('click', () => {
      dockItems.forEach((d) => d.classList.remove('active'));
      item.classList.add('active');
      moveDockPill(item);
      Sound.click();
    });
  });
}

/* ============================================
   17. SMOOTH SCROLL
============================================ */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      const offset = window.innerWidth < 720 ? 70 : 40;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ============================================
   18. LANYARD BADGE — advanced physics
============================================ */
(function lanyard() {
  const scene = document.getElementById('lanyardScene');
  const badge = document.getElementById('badgeCard');
  const visual = document.querySelector('.hero-visual');
  const rimLight = document.querySelector('.badge-rim-light');
  if (!scene || !badge || !visual || STATE.isTouch) return;

  let targetRX = 0, targetRY = 0;
  let currentRX = 0, currentRY = 0;
  let velocityX = 0, velocityY = 0;
  let isDragging = false;
  let dragStartX = 0, dragStartY = 0;
  let dragBaseRX = 0, dragBaseRY = 0;
  let lastMouseX = 0, lastMouseY = 0;
  let lastTime = performance.now();
  let removeRAF = null;

  visual.addEventListener('mousemove', (e) => {
    if (isDragging) return;
    const rect = visual.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    targetRY = ((e.clientX - cx) / rect.width) * 18;
    targetRX = -((e.clientY - cy) / rect.height) * 18;

    if (rimLight) {
      const br = badge.getBoundingClientRect();
      rimLight.style.setProperty('--rx', `${((e.clientX - br.left) / br.width) * 100}%`);
      rimLight.style.setProperty('--ry', `${((e.clientY - br.top) / br.height) * 100}%`);
    }
    if (!removeRAF) removeRAF = RAF.add(loop);
  });

  visual.addEventListener('mouseleave', () => {
    if (!isDragging) {
      targetRX = 0;
      targetRY = 0;
      if (!removeRAF) removeRAF = RAF.add(loop);
    }
  });

  badge.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragBaseRX = currentRX;
    dragBaseRY = currentRY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    lastTime = performance.now();
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const now = performance.now();
    const dt = Math.max(now - lastTime, 1);
    targetRY = dragBaseRY + (e.clientX - dragStartX) * 0.4;
    targetRX = dragBaseRX - (e.clientY - dragStartY) * 0.4;
    velocityX = ((e.clientX - lastMouseX) / dt) * 16;
    velocityY = ((e.clientY - lastMouseY) / dt) * 16;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    lastTime = now;
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      targetRY += velocityX * 3;
      targetRX -= velocityY * 3;
    }
    isDragging = false;
  });

  function loop() {
    if (!isDragging) {
      targetRX *= 0.94;
      targetRY *= 0.94;
    }
    const dx = targetRX - currentRX;
    const dy = targetRY - currentRY;

    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
      currentRX = targetRX;
      currentRY = targetRY;
      if (removeRAF) { removeRAF(); removeRAF = null; }
      return;
    }

    currentRX += dx * 0.12;
    currentRY += dy * 0.12;
    badge.style.transform = `rotateX(${currentRX.toFixed(3)}deg) rotateY(${currentRY.toFixed(3)}deg)`;
    scene.style.transform = `rotate(${(currentRY * 0.12).toFixed(3)}deg) translateZ(0)`;
  }

  removeRAF = RAF.add(loop);
})();

/* ============================================
   19. TEXT SCRAMBLE
============================================ */
document.addEventListener('preloader:done', () => {
  const els = document.querySelectorAll('[data-scramble]');
  const chars = '!<>-_\\/[]{}—=+*^?#________ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  els.forEach((el, idx) => {
    const finalText = el.textContent.trim();
    let frame = 0;
    const queue = [];
    for (let i = 0; i < finalText.length; i++) {
      const from = finalText[i];
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      queue.push({ from, to: from, start, end, char: '' });
    }

    function update() {
      let output = '';
      let complete = 0;
      for (let i = 0; i < queue.length; i++) {
        const q = queue[i];
        if (frame >= q.end) {
          complete++;
          output += q.to;
        } else if (frame >= q.start) {
          if (!q.char || Math.random() < 0.28) q.char = chars[Math.floor(Math.random() * chars.length)];
          output += `<span style="opacity:0.5">${q.char}</span>`;
        }
      }
      el.innerHTML = output;
      if (complete === queue.length) return;
      frame++;
      requestAnimationFrame(update);
    }
    setTimeout(update, idx * 200);
  });
});

/* ============================================
   20. COMMAND PALETTE
============================================ */
(function commandPalette() {
  const palette = document.getElementById('cmdPalette');
  const input = document.getElementById('cmdInput');
  const list = document.getElementById('cmdList');
  const backdrop = document.getElementById('cmdBackdrop');
  const cmdToggle = document.getElementById('cmdToggle');
  if (!palette) return;

  let isOpen = false;
  let focusedIndex = 0;
  let items = [];

  function openPalette() {
    isOpen = true;
    palette.classList.add('open');
    setTimeout(() => input.focus(), 100);
    filterItems('');
    focusedIndex = 0;
    updateFocus();
    Sound.click();
  }

  function closePalette() {
    isOpen = false;
    palette.classList.remove('open');
    input.value = '';
    Sound.click();
  }

  function getItems() {
    return Array.from(list.querySelectorAll('.cmd-item'));
  }

  function filterItems(query) {
    const q = query.toLowerCase().trim();
    items = getItems();
    items.forEach((item) => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(q) ? 'flex' : 'none';
    });
  }

  function updateFocus() {
    items = getItems().filter((i) => i.style.display !== 'none');
    items.forEach((item, i) => item.classList.toggle('focused', i === focusedIndex));
    if (items[focusedIndex]) items[focusedIndex].scrollIntoView({ block: 'nearest' });
  }

  function executeAction(action) {
    switch (action) {
      case 'go-home': location.hash = '#home'; break;
      case 'go-about': location.hash = '#about'; break;
      case 'go-skills': location.hash = '#skills'; break;
      case 'go-projects': location.hash = '#projects'; break;
      case 'go-contact': location.hash = '#contact'; break;
      case 'theme': setTheme(STATE.theme === 'dark' ? 'light' : 'dark'); break;
      case 'sound':
        STATE.soundEnabled = !STATE.soundEnabled;
        localStorage.setItem('sound', STATE.soundEnabled);
        if (soundToggle) soundToggle.classList.toggle('muted', !STATE.soundEnabled);
        if (STATE.soundEnabled) { Sound.init(); Sound.success(); }
        break;
      case 'fullscreen':
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
        break;
      case 'email': location.href = 'mailto:achmadmuzammil.id@gmail.com'; break;
      case 'github': window.open('https://github.com/AchmadMuzammil-pixel', '_blank'); break;
      case 'linkedin': window.open('https://linkedin.com/in/achmad-muzammil-057109411', '_blank'); break;
    }
    closePalette();
  }

  if (cmdToggle) cmdToggle.addEventListener('click', openPalette);
  if (backdrop) backdrop.addEventListener('click', closePalette);

  input?.addEventListener('input', (e) => {
    filterItems(e.target.value);
    focusedIndex = 0;
    updateFocus();
  });

  list?.addEventListener('click', (e) => {
    const item = e.target.closest('.cmd-item');
    if (item) executeAction(item.dataset.action);
  });

  document.addEventListener('keydown', (e) => {
    // Global shortcut: Ctrl/Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      isOpen ? closePalette() : openPalette();
      return;
    }

    if (!isOpen) return;

    if (e.key === 'Escape') { closePalette(); }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      items = getItems().filter((i) => i.style.display !== 'none');
      focusedIndex = (focusedIndex + 1) % items.length;
      updateFocus();
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items = getItems().filter((i) => i.style.display !== 'none');
      focusedIndex = (focusedIndex - 1 + items.length) % items.length;
      updateFocus();
    }
    else if (e.key === 'Enter') {
      e.preventDefault();
      items = getItems().filter((i) => i.style.display !== 'none');
      if (items[focusedIndex]) executeAction(items[focusedIndex].dataset.action);
    }
  });
})();

/* ============================================
   21. KEYBOARD SHORTCUTS (1-5 navigation)
============================================ */
document.addEventListener('keydown', (e) => {
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const map = { '1': '#home', '2': '#about', '3': '#skills', '4': '#projects', '5': '#contact' };
  if (map[e.key]) {
    const link = document.querySelector(`.nav-link[href="${map[e.key]}"]`);
    if (link) link.click();
  }

  // Ctrl+T theme, Ctrl+S sound, Ctrl+F fullscreen handled in cmdPalette
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
    e.preventDefault();
    setTheme(STATE.theme === 'dark' ? 'light' : 'dark');
  }
});

/* ============================================
   22. KONAMI CODE EASTER EGG
============================================ */
(function konami() {
  const code = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let idx = 0;

  document.addEventListener('keydown', (e) => {
    if (e.key === code[idx]) {
      idx++;
      if (idx === code.length) {
        triggerKonami();
        idx = 0;
      }
    } else {
      idx = 0;
    }
  });

  function triggerKonami() {
    const toast = document.getElementById('konamiToast');
    if (!toast) return;
    toast.classList.add('show');
    Sound.success();
    setTimeout(() => Sound.success(), 200);
    setTimeout(() => Sound.success(), 400);

    // Rainbow effect
    document.body.style.transition = 'filter 0.5s';
    const hueInterval = setInterval(() => {
      const hue = Math.random() * 360;
      document.body.style.filter = `hue-rotate(${hue}deg)`;
    }, 80);

    setTimeout(() => {
      clearInterval(hueInterval);
      document.body.style.filter = '';
      toast.classList.remove('show');
    }, 3000);
  }
})();

/* ============================================
   23. VISIBILITY API — pause animations when hidden
============================================ */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    document.body.style.animationPlayState = 'paused';
  } else {
    document.body.style.animationPlayState = 'running';
  }
});

/* ============================================
   24. PAGE READY
============================================ */
window.addEventListener('load', () => {
  document.body.style.opacity = '1';
});

/* ============================================
   25. LOG SIGNATURE
============================================ */
console.log(
  '%c👋 Achmad Muzammil Portfolio %c v3.0 ',
  'background: linear-gradient(135deg, #7DD3FC, #C4B5FD); color: #0A0E14; padding: 6px 12px; border-radius: 6px 0 0 6px; font-weight: 700;',
  'background: #0F141C; color: #7DD3FC; padding: 6px 12px; border-radius: 0 6px 6px 0; font-weight: 600;'
);
console.log(
  '%c💡 Tips: Tekan %cCtrl/Cmd+K%c untuk Command Palette · %c1-5%c untuk navigasi · %c↑↑↓↓←→←→BA%c untuk kejutan 🎉',
  'color: #98A2B6; font-size: 12px;',
  'color: #7DD3FC; font-weight: 700;',
  'color: #98A2B6;',
  'color: #7DD3FC; font-weight: 700;',
  'color: #98A2B6;',
  'color: #C4B5FD; font-weight: 700;',
  'color: #98A2B6;'
);