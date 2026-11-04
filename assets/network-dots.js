/* Point texture sampled once from the site's existing country outlines.
   Canvas draws the texture; the original SVG geometry retains precise hit targets. */
(() => {
  'use strict';
  class AysenDotGlobe {
    constructor(canvas, root, countries, markets) {
      this.canvas = canvas;
      this.context = canvas?.getContext('2d');
      this.ready = false;
      this.points = [];
      this.state = [[62, 25, 0], 1, null, null];
      if (!this.context || !window.Path2D) return;
      const style = getComputedStyle(root);
      const color = name => style.getPropertyValue(name).trim();
      this.colors = [color('--network-dot-land'), color('--network-dot-market'), color('--network-dot-selected')];
      this.ocean = [color('--network-dot-light'), color('--network-dot-ocean'), color('--network-dot-edge')];
      this.sample(countries, markets);
      this.ready = true;
      canvas.dataset.points = String(this.points.length);
      if ('ResizeObserver' in window) {
        this.observer = new ResizeObserver(() => this.render(...this.state));
        this.observer.observe(canvas.parentElement);
      }
    }
    sample(countries, markets) {
      const mask = document.createElement('canvas');
      mask.width = 1800;
      mask.height = 1000;
      const context = mask.getContext('2d', {willReadFrequently: true});
      context.scale(2, 2);
      countries.forEach((country, index) => {
        context.fillStyle = `rgb(0,0,${index + 1})`;
        context.fill(new Path2D(country.d), 'evenodd');
      });
      const pixels = context.getImageData(0, 0, mask.width, mask.height).data;
      // A Fibonacci distribution gives even surface spacing, including near the poles.
      const count = 60000;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      for (let index = 0; index < count; index++) {
        const z = 1 - 2 * (index + .5) / count;
        const latitude = Math.asin(z);
        const longitude = (index * goldenAngle) % (2 * Math.PI) - Math.PI;
        const x = Math.floor((longitude * 180 / Math.PI + 180) * 5);
        const y = Math.floor((85 - latitude * 180 / Math.PI) * 5.6);
        if (y < 0 || y >= mask.height) continue;
        const offset = (y * mask.width + x) * 4;
        if (pixels[offset + 3] < 250) continue;
        const country = countries[pixels[offset + 2] - 1];
        if (!country) continue;
        const cosLatitude = Math.cos(latitude);
        this.points.push({x: cosLatitude * Math.cos(longitude), y: cosLatitude * Math.sin(longitude), z, id: country.id, market: markets.has(country.id)});
      }
    }
    render(rotation, zoom, selected, hovered) {
      if (!this.ready) return;
      this.state = [rotation.slice(), zoom, selected, hovered];
      const canvas = this.canvas;
      const width = canvas.parentElement.clientWidth;
      const height = canvas.parentElement.clientHeight;
      if (!width || !height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(width * ratio), pixelHeight = Math.round(height * ratio);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      const context = this.context;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      const unit = Math.min(width, height) / 600;
      const radius = 258 * unit;
      const centerX = width / 2, centerY = height / 2;
      context.save();
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.clip();
      const gradient = context.createRadialGradient(centerX - radius * .3, centerY - radius * .4, radius * .05, centerX - radius * .2, centerY - radius * .25, radius * 1.45);
      gradient.addColorStop(0, this.ocean[0]);
      gradient.addColorStop(.65, this.ocean[1]);
      gradient.addColorStop(1, this.ocean[2]);
      context.fillStyle = gradient;
      context.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
      const lambda = rotation[0] * Math.PI / 180, phi = rotation[1] * Math.PI / 180;
      const cosLambda = Math.cos(lambda), sinLambda = Math.sin(lambda), cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);
      const scale = radius * zoom;
      const batches = [[], [], []];
      for (const point of this.points) {
        const rotatedX = point.x * cosLambda - point.y * sinLambda;
        const depth = rotatedX * cosPhi - point.z * sinPhi;
        if (depth <= 0) continue;
        const x = centerX + (point.x * sinLambda + point.y * cosLambda) * scale;
        const y = centerY - (rotatedX * sinPhi + point.z * cosPhi) * scale;
        const active = point.id === selected || point.id === hovered;
        const batch = active ? 2 : point.market ? 1 : 0;
        const dotRadius = (.62 + .65 * Math.sqrt(depth)) * unit * Math.sqrt(zoom) * (active ? 1.12 : 1);
        batches[batch].push(x, y, dotRadius);
      }
      batches.forEach((batch, index) => {
        context.fillStyle = this.colors[index];
        context.beginPath();
        for (let offset = 0; offset < batch.length; offset += 3) {
          context.moveTo(batch[offset] + batch[offset + 2], batch[offset + 1]);
          context.arc(batch[offset], batch[offset + 1], batch[offset + 2], 0, Math.PI * 2);
        }
        context.fill();
      });
      context.restore();
    }
  }
  window.AysenDotGlobe = AysenDotGlobe;
})();
