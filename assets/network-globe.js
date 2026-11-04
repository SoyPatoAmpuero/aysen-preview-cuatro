/* Horizonte austral. Local geometry + d3-geo orthographic clipping; no remote map service.
   Market content lives in network-data.js. This component owns only #credenciales. */
(() => {
  'use strict';
  const root = document.querySelector('.network-section');
  if (!root) return;
  const svg = root.querySelector('.network-globe');
  const layer = root.querySelector('.network-land');
  const nav = root.querySelector('.network-markets');
  const panel = root.querySelector('#network-panel');
  const title = root.querySelector('#network-country');
  const agencies = root.querySelector('#network-agencies');
  const preview = root.querySelector('.network-hover');
  const status = root.querySelector('.network-status');
  const configuration = window.AYSEN_NETWORK_DATA || {};
  const {t, locale} = window.AysenI18n;
  const isDemo = configuration.demoMode === true;
  root.querySelector('.network-demo-note').hidden = !isDemo;
  const geometry = window.AYSEN_WORLD_COUNTRIES || [];
  const geoIds = new Set(geometry.map(country => country.id));
  const markets = ((isDemo ? configuration.demoMarkets : configuration.confirmedMarkets) || []).map(market => ({
    ...market,
    country: market.translations?.[locale]?.country || t(market.country),
    region: market.translations?.[locale]?.region || t(market.region || ''),
    agencies: (market.agencies || []).map(agency => ({
      ...agency,
      city: agency.translations?.[locale]?.city || t(agency.city || ''),
      description: agency.translations?.[locale]?.description || t(agency.description || '')
    }))
  }));
  const agencyCount = count => t(count === 1 ? 'agencia' : 'agencias');
  const validMarkets = markets.filter(market => geoIds.has(market.id) && market.country && Array.isArray(market.center) && market.center.every(Number.isFinite) && Array.isArray(market.agencies) && market.agencies.length);
  const byId = new Map(validMarkets.map(market => [market.id, market]));
  const mobileQuery = matchMedia('(max-width: 700px)');
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const ns = 'http://www.w3.org/2000/svg';
  const buttons = new Map();
  const paths = new Map();
  const features = new Map();
  const zoomIn = root.querySelector('[data-globe-action=in]');
  const zoomOut = root.querySelector('[data-globe-action=out]');
  const move = root.querySelector('[data-globe-action=move]');
  const minZoom = 1;
  const maxZoom = 1.85;
  let selected = null;
  let zoom = minZoom;
  let rotation = home();
  let projection;
  let geoPath;
  let initialized = false;
  let frame = 0;
  let drag = null;
  let suppressClickUntil = 0;
  let returnFocus = null;
  let announceTimer;
  let dotGlobe;
  let hovered = null;
  let graticule;
  let autoFrame = 0;
  let autoVisible = false;
  let autoLastTime = 0;
  let globeHovered = false;
  let transitioning = false;
  const equator = {type: 'LineString', coordinates: Array.from({length: 181}, (_, index) => [-180 + index * 2, 0])};

  function home() { return [62, 25, 0]; }
  function cancelTransition() {
    cancelAnimationFrame(frame);
    transitioning = false;
  }
  function updateAutoRotation() {
    cancelAnimationFrame(autoFrame);
    autoFrame = 0;
    autoLastTime = 0;
    if (initialized && autoVisible && !document.hidden && !reducedQuery.matches) {
      autoFrame = requestAnimationFrame(rotateAutomatically);
    }
  }
  function rotateAutomatically(time) {
    autoFrame = 0;
    if (!autoVisible || document.hidden || reducedQuery.matches) { autoLastTime = 0; return; }
    // Render at most 30 times per second. Timestamp-based travel stays consistent
    // across devices, without jumping forward after a backgrounded tab.
    if (!autoLastTime) autoLastTime = time;
    const elapsed = time - autoLastTime;
    if (elapsed >= 1000 / 30) {
      if (!drag && !globeHovered && !transitioning) {
        rotation[0] = ((rotation[0] + Math.min(elapsed, 100) * .004 + 180) % 360) - 180;
        render();
      }
      autoLastTime = time;
    }
    autoFrame = requestAnimationFrame(rotateAutomatically);
  }
  function announce(message) {
    clearTimeout(announceTimer);
    // Selection is announced once; hovering, dragging and animation frames stay silent.
    announceTimer = setTimeout(() => { status.textContent = message; }, 30);
  }
  function node(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text) item.textContent = text;
    return item;
  }
  function previewMarket(market) {
    const next = market?.id || null;
    if (hovered !== next) { hovered = next; dotGlobe?.render(rotation, zoom, selected, hovered); }
    preview.textContent = market ? t('{country} · {count} {agencies} · Selecciona para conocerlas', {country: market.country, count: market.agencies.length, agencies: agencyCount(market.agencies.length)}) : '';
  }
  function focusReturn() {
    const alternative = selected && buttons.get(selected);
    const target = returnFocus?.isConnected && returnFocus.getBoundingClientRect().width ? returnFocus : alternative;
    target?.focus({ preventScroll: true });
  }
  function close(restoreFocus = true) {
    if (panel.hidden) return;
    if (restoreFocus) focusReturn();
    selected = null;
    panel.hidden = true;
    root.classList.remove('has-selection');
    buttons.forEach(button => button.setAttribute('aria-pressed', 'false'));
    paths.forEach(path => { path.classList.remove('is-selected'); if (path.hasAttribute('aria-pressed')) path.setAttribute('aria-pressed', 'false'); });
    dotGlobe?.render(rotation, zoom, selected, hovered);
    announce(t('Ficha cerrada. Puedes explorar otro mercado.'));
  }
  function select(id, source, focusPanel = false) {
    const market = byId.get(id);
    if (!market || performance.now() < suppressClickUntil) return;
    if (selected === id && !panel.hidden) {
      if (focusPanel) title.focus({ preventScroll: true });
      return;
    }
    returnFocus = source || buttons.get(id);
    selected = id;
    root.classList.add('has-selection');
    root.querySelector('.network-region').textContent = `${market.region || ''} · ${market.agencies.length} ${agencyCount(market.agencies.length)}`;
    title.textContent = market.country;
    agencies.replaceChildren();
    market.agencies.forEach(agency => {
      const article = node('article', 'network-agency-entry');
      article.append(node('h4', '', agency.name || t('Agencia colaboradora')));
      if (agency.city) article.append(node('p', 'network-agency-entry__city', agency.city));
      if (agency.description) article.append(node('p', 'network-agency-entry__description', agency.description));
      agencies.append(article);
    });
    panel.hidden = false;
    panel.scrollTop = 0;
    agencies.scrollTop = 0;
    panel.classList.remove('is-revealing');
    void panel.offsetWidth;
    panel.classList.add('is-revealing');
    buttons.forEach((button, key) => button.setAttribute('aria-pressed', String(key === id)));
    paths.forEach((path, key) => { path.classList.toggle('is-selected', key === id); if (path.hasAttribute('aria-pressed')) path.setAttribute('aria-pressed', String(key === id)); });
    previewMarket(null);
    animateTo([-market.center[0], -market.center[1], 0], zoom);
    if (!mobileQuery.matches) panel.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    if (mobileQuery.matches || focusPanel) title.focus({ preventScroll: true });
    announce(t('{count} {agencies}. Información actualizada.', {count: market.agencies.length, agencies: t(market.agencies.length === 1 ? 'agencia disponible' : 'agencias disponibles')}));
  }

  validMarkets.forEach(market => {
    const button = node('button', '', market.country);
    button.type = 'button';
    button.dataset.market = market.id;
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-controls', 'network-panel');
    button.setAttribute('aria-label', t('{country}, {count} {agencies}', {country: market.country, count: market.agencies.length, agencies: agencyCount(market.agencies.length)}));
    button.addEventListener('click', event => select(market.id, button, event.detail === 0));
    button.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') previewMarket(market); });
    button.addEventListener('pointerleave', () => previewMarket(null));
    buttons.set(market.id, button);
    nav.append(button);
  });
  if (!validMarkets.length) {
    nav.append(node('p', 'network-no-data', t('Estamos preparando la información de nuestra red comercial.')));
  }

  function initialize() {
    if (initialized) return;
    if (!window.d3?.geoOrthographic || !geometry.length) {
      preview.textContent = t('Selecciona un país en el índice para consultar las agencias.');
      root.querySelectorAll('.network-controls button').forEach(button => button.disabled = true);
      return;
    }
    initialized = true;
    projection = d3.geoOrthographic().translate([300, 300]).scale(258).precision(.35).clipAngle(90);
    geoPath = d3.geoPath(projection).digits(2);
    graticule = d3.geoGraticule().step([30, 30])();
    geometry.forEach(country => {
      // Recover spherical coordinates from the existing 900-unit world geometry.
      // Keep islands and holes; normalize winding for d3's spherical clipping.
      const rings = (country.d.match(/M[^Z]+Z/g) || []).map(ring => [...ring.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)].map(point => [Number(point[1]) / 2.5 - 180, 85 - Number(point[2]) / 2.8]));
      const signedArea = ring => ring.reduce((sum, point, index) => { const next = ring[(index + 1) % ring.length]; return sum + point[0] * next[1] - next[0] * point[1]; }, 0);
      const outerSign = Math.sign(signedArea(rings[0] || []));
      const polygons = [];
      rings.forEach(ring => {
        if (ring.length < 3) return;
        if (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1]) ring.push(ring[0].slice());
        if (polygons.length && Math.sign(signedArea(ring)) !== outerSign) polygons.at(-1).push(ring);
        else polygons.push([ring]);
      });
      polygons.forEach(polygon => { if (d3.geoArea({type: 'Polygon', coordinates: polygon}) > Math.PI * 2) polygon.forEach(ring => ring.reverse()); });
      const feature = {type: 'MultiPolygon', coordinates: polygons};
      features.set(country.id, feature);
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('class', 'globe-country' + (byId.has(country.id) ? ' is-available' : ''));
      path.dataset.country = country.id;
      const market = byId.get(country.id);
      if (market) {
        path.setAttribute('role', 'button');
        path.setAttribute('aria-label', t('{country}: ver {count} {agencies}', {country: market.country, count: market.agencies.length, agencies: agencyCount(market.agencies.length)}));
        path.setAttribute('aria-pressed', 'false');
        path.setAttribute('aria-controls', 'network-panel');
        path.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch' && !drag) previewMarket(market); });
        path.addEventListener('pointerleave', () => previewMarket(null));
        path.addEventListener('click', event => select(market.id, path, event.detail === 0));
        path.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); select(market.id, path, true); } });
      } else path.setAttribute('aria-hidden', 'true');
      paths.set(country.id, path);
      layer.append(path);
    });
    if (window.AysenDotGlobe) {
      dotGlobe = new AysenDotGlobe(root.querySelector('.network-dot-canvas'), root, geometry, byId);
      if (dotGlobe.ready) root.classList.add('is-dotted');
    }
    render();
    root.dataset.globeReady = 'true';
    updateAutoRotation();
  }
  function render() {
    if (!initialized) return;
    projection.rotate(rotation).scale(258 * zoom);
    paths.forEach((path, id) => {
      const shape = geoPath(features.get(id)) || '';
      path.setAttribute('d', shape);
      if (byId.has(id)) { path.setAttribute('tabindex', shape ? '0' : '-1'); path.setAttribute('aria-hidden', String(!shape)); }
    });
    root.querySelectorAll('.network-ocean,.network-shade').forEach(circle => circle.setAttribute('r', 258));
    root.querySelector('.network-grid-lines').setAttribute('d', geoPath(graticule) || '');
    root.querySelector('.network-equator').setAttribute('d', geoPath(equator) || '');
    dotGlobe?.render(rotation, zoom, selected, hovered);
    svg.dataset.zoom = zoom.toFixed(2);
    svg.dataset.rotation = rotation.slice(0, 2).map(value => value.toFixed(2)).join(',');
    zoomOut.disabled = zoom <= minZoom;
    zoomIn.disabled = zoom >= maxZoom;
  }
  function animateTo(target, targetZoom) {
    initialize();
    cancelTransition();
    const from = rotation.slice();
    const startZoom = zoom;
    // Follow the shortest longitude, including across the antimeridian.
    const delta = (((target[0] - from[0] + 180) % 360 + 360) % 360) - 180;
    const start = performance.now();
    if (reducedQuery.matches) { rotation = target.slice(); zoom = targetZoom; render(); return; }
    transitioning = true;
    const tick = now => {
      const progress = Math.min(1, (now - start) / 480);
      const t = 1 - Math.pow(1 - progress, 3);
      rotation = [from[0] + delta * t, from[1] + (target[1] - from[1]) * t, 0];
      zoom = startZoom + (targetZoom - startZoom) * t;
      render();
      if (progress < 1 && !reducedQuery.matches) frame = requestAnimationFrame(tick);
      else { rotation = target.slice(); zoom = targetZoom; render(); frame = 0; transitioning = false; }
    };
    frame = requestAnimationFrame(tick);
  }
  function reset() {
    close(false);
    previewMarket(null);
    move.setAttribute('aria-pressed', 'false');
    svg.classList.remove('is-moving');
    animateTo(home(), minZoom);
    announce(t('Globo restablecido a la vista inicial.'));
  }
  root.querySelector('.network-close').addEventListener('click', () => close());
  root.querySelectorAll('[data-globe-action]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.globeAction;
    if (action === 'reset') return reset();
    if (action === 'move') {
      const enabled = move.getAttribute('aria-pressed') !== 'true';
      move.setAttribute('aria-pressed', String(enabled));
      svg.classList.toggle('is-moving', enabled);
      announce(t(enabled ? 'Puedes arrastrar el globo. Desactiva Mover globo para desplazar la página sobre él.' : 'Giro táctil desactivado. Puedes desplazar la página.'));
      return;
    }
    cancelTransition();
    zoom = Math.max(minZoom, Math.min(maxZoom, zoom + (action === 'in' ? .25 : -.25)));
    initialize(); render();
    announce(t('Ampliación: {percent} por ciento.', {percent: Math.round(zoom * 100)}));
  }));
  svg.addEventListener('pointerdown', event => {
    if (event.button !== 0 || (event.pointerType === 'touch' && !svg.classList.contains('is-moving'))) return;
    cancelTransition();
    drag = {id: event.pointerId, x: event.clientX, y: event.clientY, rotation: rotation.slice(), moved: false};
  });
  svg.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true;
    svg.setPointerCapture(event.pointerId);
    svg.classList.add('is-dragging');
    previewMarket(null);
    const sensitivity = 70 / Math.max(200, svg.getBoundingClientRect().width) / zoom;
    rotation = [drag.rotation[0] + dx * sensitivity * 2.5, Math.max(-80, Math.min(80, drag.rotation[1] - dy * sensitivity * 2.5)), 0];
    cancelTransition();
    frame = requestAnimationFrame(render);
  });
  const endDrag = event => {
    if (!drag || drag.id !== event.pointerId) return;
    if (drag.moved) suppressClickUntil = performance.now() + 150;
    drag = null;
    svg.classList.remove('is-dragging');
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
  };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);
  svg.addEventListener('lostpointercapture', endDrag);
  const trackGlobeHover = event => {
    if (event.pointerType !== 'mouse') return;
    const rect = svg.getBoundingClientRect();
    const radius = Math.min(rect.width, rect.height) * 258 / 600;
    globeHovered = Math.hypot(event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2) <= radius;
  };
  svg.addEventListener('pointerenter', trackGlobeHover);
  svg.addEventListener('pointermove', trackGlobeHover);
  svg.addEventListener('pointerleave', () => { globeHovered = false; });
  svg.addEventListener('wheel', event => {
    // Plain wheel/trackpad scrolling always belongs to the page.
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    initialize(); cancelTransition();
    zoom = Math.max(minZoom, Math.min(maxZoom, zoom - event.deltaY * .008));
    render();
  }, {passive: false});
  svg.addEventListener('keydown', event => {
    const directions = {ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -10], ArrowDown: [0, 10]};
    if (directions[event.key]) {
      event.preventDefault(); cancelTransition();
      rotation = [rotation[0] + directions[event.key][0], Math.max(-80, Math.min(80, rotation[1] + directions[event.key][1])), 0];
      initialize(); render();
    } else if (event.key === 'Home') { event.preventDefault(); reset(); }
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); close(); } });
  mobileQuery.addEventListener('change', () => {
    cancelTransition();
    if (!selected) rotation = home();
    move.setAttribute('aria-pressed', 'false');
    svg.classList.remove('is-moving');
    render();
  });
  reducedQuery.addEventListener('change', updateAutoRotation);
  document.addEventListener('visibilitychange', updateAutoRotation);
  if ('IntersectionObserver' in window) {
    const initObserver = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { initialize(); initObserver.disconnect(); } }, {rootMargin: '350px'});
    initObserver.observe(root);
    const panelObserver = new IntersectionObserver(entries => { if (!entries[0].isIntersecting && mobileQuery.matches && !panel.hidden) close(false); });
    panelObserver.observe(root);
    const rotationObserver = new IntersectionObserver(entries => {
      autoVisible = entries[0].isIntersecting;
      updateAutoRotation();
    });
    rotationObserver.observe(root);
  } else { autoVisible = true; initialize(); }
  updateAutoRotation();
})();
