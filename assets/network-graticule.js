/* Dark-green navigation lines follow scroll on all devices, with a local mouse ripple. */
(() => {
  const section = document.querySelector('.network-section');
  if (!section) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'network-graticule-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d');
  if (!context) return;
  section.prepend(canvas);

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const horizontal = [[95,310],[265,395],[450,470],[635,535],[805,620]];
  const vertical = [[240,-40],[500,280],[760,650],[1020,1020],[1280,1390],[1540,1760]];
  let width = 0, height = 0, bounds;
  let targetX = 0, targetY = 0, x = 0, y = 0;
  let strength = 0, targetStrength = 0, frame = 0, lastTime = 0;
  let phase = 0;
  let scrollOffset = 0, targetScroll = 0, inView = false;

  const updateScroll = () => {
    bounds = section.getBoundingClientRect();
    inView = bounds.bottom > 0 && bounds.top < innerHeight;
    targetScroll = Math.max(-140, Math.min(140, (innerHeight / 2 - bounds.top - bounds.height / 2) * .18));
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);
    // Overscan keeps the curves covering the section throughout their scroll travel.
    const scale = Math.max((width + 160) / 1600, (height + 280) / 900);
    const offsetX = (width - 1600 * scale) / 2 + scrollOffset * .16;
    const offsetY = (height - 900 * scale) / 2 + scrollOffset;
    const ink = context.createLinearGradient(offsetX + 200 * scale, 0, offsetX + 1600 * scale, 0);
    ink.addColorStop(0, 'rgba(8,46,43,.045)');
    ink.addColorStop(.6, 'rgba(8,46,43,.12)');
    ink.addColorStop(1, 'rgba(8,46,43,.08)');
    context.strokeStyle = ink;
    context.lineWidth = .75 * scale;

    const curve = (start, control, end) => {
      context.beginPath();
      for (let i = 0; i <= 90; i++) {
        const t = i / 90, u = 1 - t;
        let px = (u*u*start[0] + 2*u*t*control[0] + t*t*end[0]) * scale + offsetX;
        let py = (u*u*start[1] + 2*u*t*control[1] + t*t*end[1]) * scale + offsetY;
        const dx = px - x, dy = py - y;
        const influence = Math.exp(-(dx*dx + dy*dy) / (2 * 240 * 240)) * strength;
        // Traveling waves, rather than a static bend, make the liquid response perceptible.
        px += Math.sin(dy / 100 + dx / 170 - phase) * influence * 6;
        py += Math.cos(dx / 110 - dy / 190 - phase) * influence * 7;
        if (i === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
      }
      context.stroke();
    };
    horizontal.forEach(([edge, middle]) => curve([-100,edge],[850,middle],[1700,edge]));
    vertical.forEach(([edge, middle]) => curve([edge,-100],[middle,450],[edge,1000]));
  };

  const animate = time => {
    const elapsed = Math.min(50, lastTime ? time - lastTime : 16.7);
    lastTime = time;
    const ease = 1 - Math.exp(-elapsed / 240);
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    strength += (targetStrength - strength) * ease;
    scrollOffset += (targetScroll - scrollOffset) * ease;
    phase += elapsed * .0016;
    draw();
    if (inView && !document.hidden && !motion.matches && (targetStrength > 0 || Math.abs(targetX-x) + Math.abs(targetY-y) > .1 || Math.abs(targetStrength-strength) > .001 || Math.abs(targetScroll-scrollOffset) > .05)) {
      frame = requestAnimationFrame(animate);
    } else {
      frame = 0;
      lastTime = 0;
    }
  };
  const requestDraw = () => {
    if (!frame && inView && !document.hidden && !motion.matches) frame = requestAnimationFrame(animate);
  };
  const reset = () => { targetStrength = 0; requestDraw(); };
  const resize = () => {
    bounds = section.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    updateScroll();
    draw();
    requestDraw();
  };
  const setMotion = () => {
    const enabled = !motion.matches;
    section.classList.toggle('has-fluid-graticule', enabled);
    if (!enabled) {
      cancelAnimationFrame(frame);
      frame = 0;
      strength = targetStrength = 0;
      lastTime = 0;
    } else resize();
  };

  section.addEventListener('pointerenter', event => {
    if (!pointer.matches || motion.matches || event.pointerType !== 'mouse') return;
    bounds = section.getBoundingClientRect();
    x = targetX = event.clientX - bounds.left;
    y = targetY = event.clientY - bounds.top;
    targetStrength = 1;
    requestDraw();
  });
  section.addEventListener('pointermove', event => {
    if (!pointer.matches || motion.matches || event.pointerType !== 'mouse') return;
    targetX = event.clientX - bounds.left;
    targetY = event.clientY - bounds.top;
    targetStrength = 1;
    requestDraw();
  });
  section.addEventListener('pointerleave', reset);
  window.addEventListener('scroll', () => {
    if (motion.matches) return;
    updateScroll();
    targetStrength = 0;
    requestDraw();
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    } else { updateScroll(); requestDraw(); }
  });
  new ResizeObserver(() => { if (!motion.matches) resize(); }).observe(section);
  motion.addEventListener('change', setMotion);
  pointer.addEventListener('change', setMotion);
  setMotion();
})();
