/**
 * THE PENGUIN: BEYOND THE DOOR
 * Procedural Texture Generator
 * Uses HTML5 2D Canvas to generate high-resolution, stylized realistic PBR textures
 * completely offline with zero network latency.
 */

class TextureGenerator {
  constructor() {
    this.cache = {};
  }

  createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  /**
   * Helper: Perlin/Value noise approximation on 2D canvas
   */
  addNoise(ctx, width, height, opacity = 0.08, mono = true) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 255 * opacity;
      if (mono) {
        data[i] = Math.min(255, Math.max(0, data[i] + n));
        data[i+1] = Math.min(255, Math.max(0, data[i+1] + n));
        data[i+2] = Math.min(255, Math.max(0, data[i+2] + n));
      } else {
        data[i] = Math.min(255, Math.max(0, data[i] + (Math.random() - 0.5) * 255 * opacity));
        data[i+1] = Math.min(255, Math.max(0, data[i+1] + (Math.random() - 0.5) * 255 * opacity));
        data[i+2] = Math.min(255, Math.max(0, data[i+2] + (Math.random() - 0.5) * 255 * opacity));
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // --- PENGUIN TEXTURES ---

  getFeatherTexture() {
    if (this.cache.feather) return this.cache.feather;
    const w = 512, h = 512;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Deep charcoal base
    ctx.fillStyle = '#181a1e';
    ctx.fillRect(0, 0, w, h);

    // Fine feather overlapping barbs
    ctx.strokeStyle = '#282b32';
    ctx.lineWidth = 1.2;
    for (let y = 0; y < h; y += 8) {
      for (let x = 0; x < w; x += 16) {
        ctx.beginPath();
        const offsetX = (y % 16 === 0) ? 0 : 8;
        ctx.ellipse(x + offsetX, y, 10, 5, 0.1, 0, Math.PI);
        ctx.stroke();
      }
    }

    // Specular feather fibers
    ctx.strokeStyle = '#323640';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 400; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + (Math.random() - 0.5) * 12, ry + Math.random() * 15);
      ctx.stroke();
    }

    this.addNoise(ctx, w, h, 0.05);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.feather = texture;
    return texture;
  }

  getBellyTexture() {
    if (this.cache.belly) return this.cache.belly;
    const w = 512, h = 512;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Soft ivory down plumage
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#f8fafc');
    grad.addColorStop(0.5, '#f1f5f9');
    grad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Downy feather crescents
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
    ctx.lineWidth = 1.0;
    for (let y = 0; y < h; y += 12) {
      for (let x = 0; x < w; x += 18) {
        const ox = (y % 24 === 0) ? 0 : 9;
        ctx.beginPath();
        ctx.arc(x + ox, y, 7, 0, Math.PI);
        ctx.stroke();
      }
    }

    this.addNoise(ctx, w, h, 0.04);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.belly = texture;
    return texture;
  }

  getBeakTexture() {
    if (this.cache.beak) return this.cache.beak;
    const w = 256, h = 256;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Orange-yellow keratin gradient
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(0.6, '#ea580c');
    grad.addColorStop(1, '#7c2d12'); // Dark tip
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Keratin striations
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 40; i++) {
      const y = Math.random() * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + (Math.random() - 0.5) * 8);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.beak = texture;
    return texture;
  }

  getEyeTexture() {
    if (this.cache.eye) return this.cache.eye;
    const w = 256, h = 256;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Sclera
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Iris (deep brown / amber ring)
    const irisGrad = ctx.createRadialGradient(128, 128, 20, 128, 128, 90);
    irisGrad.addColorStop(0, '#0f172a');
    irisGrad.addColorStop(0.7, '#78350f');
    irisGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(128, 128, 90, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#050508';
    ctx.beginPath();
    ctx.arc(128, 128, 55, 0, Math.PI * 2);
    ctx.fill();

    // Specular catchlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(100, 100, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(150, 145, 8, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.eye = texture;
    return texture;
  }

  // --- FOREST TEXTURES ---

  getBarkTexture() {
    if (this.cache.bark) return this.cache.bark;
    const w = 512, h = 512;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Deep woody brown
    ctx.fillStyle = '#2d1e14';
    ctx.fillRect(0, 0, w, h);

    // Vertical furrows & bark ridges
    for (let x = 0; x < w; x += 10) {
      const shade = Math.random() > 0.5 ? '#3e2a1b' : '#1f130b';
      ctx.fillStyle = shade;
      ctx.fillRect(x, 0, 6 + Math.random() * 6, h);

      // Grooves
      ctx.strokeStyle = '#120b06';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      let curX = x;
      for (let y = 0; y < h; y += 40) {
        curX += (Math.random() - 0.5) * 8;
        ctx.lineTo(curX, y);
      }
      ctx.stroke();
    }

    // Moss patches (dark green)
    ctx.fillStyle = 'rgba(46, 70, 36, 0.4)';
    for (let i = 0; i < 25; i++) {
      const mx = Math.random() * w;
      const my = Math.random() * h;
      ctx.beginPath();
      ctx.ellipse(mx, my, 20 + Math.random() * 30, 40 + Math.random() * 50, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    this.addNoise(ctx, w, h, 0.1);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.bark = texture;
    return texture;
  }

  getFoliageTexture() {
    if (this.cache.foliage) return this.cache.foliage;
    const w = 256, h = 256;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Pine needle / leaf cluster with alpha
    ctx.clearRect(0, 0, w, h);

    const colors = ['#1e3a1e', '#2d5a27', '#1b4d24', '#3c6e3b', '#132814'];
    for (let i = 0; i < 400; i++) {
      ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.lineWidth = 1.5 + Math.random() * 1.5;
      const cx = 128 + (Math.random() - 0.5) * 80;
      const cy = 128 + (Math.random() - 0.5) * 80;
      const angle = Math.random() * Math.PI * 2;
      const len = 20 + Math.random() * 35;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.foliage = texture;
    return texture;
  }

  getDirtPathTexture() {
    if (this.cache.dirtPath) return this.cache.dirtPath;
    const w = 512, h = 512;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Rich forest floor / soil
    ctx.fillStyle = '#2f241a';
    ctx.fillRect(0, 0, w, h);

    // Dirt variations & tyre/foot ruts
    ctx.fillStyle = '#3a2d21';
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, Math.random() * h, 30 + Math.random() * 60, 15 + Math.random() * 30, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Scattered dead leaves & pebbles
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = Math.random() > 0.6 ? '#654321' : (Math.random() > 0.5 ? '#1f1b14' : '#4a3b2c');
      const px = Math.random() * w;
      const py = Math.random() * h;
      const pr = 1.5 + Math.random() * 4;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Moss fringes
    ctx.fillStyle = 'rgba(34, 55, 27, 0.4)';
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 20 + Math.random() * 40, 0, Math.PI * 2);
      ctx.fill();
    }

    this.addNoise(ctx, w, h, 0.12);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.dirtPath = texture;
    return texture;
  }

  getRuneStoneTexture() {
    if (this.cache.runeStone) return this.cache.runeStone;
    const w = 512, h = 512;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Dark obsidian basalt
    ctx.fillStyle = '#0f1115';
    ctx.fillRect(0, 0, w, h);

    // Stone cracks
    ctx.strokeStyle = '#1a1d24';
    ctx.lineWidth = 2;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, Math.random() * h);
      ctx.lineTo(Math.random() * w, Math.random() * h);
      ctx.stroke();
    }

    // Glowing ancient geometric runes
    ctx.strokeStyle = '#06b6d4'; // Cyan magic
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;

    // Geometric circle & non-euclidean triangles
    ctx.beginPath();
    ctx.arc(256, 256, 140, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(256, 256, 90, 0, Math.PI * 2);
    ctx.stroke();

    // Sacred triangles
    for (let r = 0; r < 3; r++) {
      const angle = (r * Math.PI * 2) / 3 - Math.PI / 2;
      const x = 256 + Math.cos(angle) * 115;
      const y = 256 + Math.sin(angle) * 115;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Runes along border
    ctx.font = '24px monospace';
    ctx.fillStyle = '#67e8f9';
    const runes = ['ᚦ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᛃ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ'];
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI * 2) / 16;
      const rx = 256 + Math.cos(a) * 175;
      const ry = 256 + Math.sin(a) * 175;
      ctx.fillText(runes[i % runes.length], rx - 10, ry + 8);
    }

    ctx.shadowBlur = 0;
    this.addNoise(ctx, w, h, 0.08);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.runeStone = texture;
    return texture;
  }

  // --- BACKROOMS TEXTURES ---

  getBackroomsWallpaperTexture() {
    if (this.cache.wallpaper) return this.cache.wallpaper;
    const w = 512, h = 512;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Iconic mustard / dull yellow base
    ctx.fillStyle = '#c5a764';
    ctx.fillRect(0, 0, w, h);

    // Subtle vertical wallpaper stripes
    ctx.fillStyle = '#b79753';
    for (let x = 0; x < w; x += 32) {
      ctx.fillRect(x, 0, 16, h);
    }

    // Repeating vintage damask diamond motif
    ctx.strokeStyle = '#9d803e';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < h; y += 64) {
      for (let x = 0; x < w; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x + 32, y);
        ctx.lineTo(x + 64, y + 32);
        ctx.lineTo(x + 32, y + 64);
        ctx.lineTo(x, y + 32);
        ctx.closePath();
        ctx.stroke();

        // Inner floral dot
        ctx.beginPath();
        ctx.arc(x + 32, y + 32, 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Water stains / grime at bottom and corners
    ctx.fillStyle = 'rgba(70, 50, 20, 0.12)';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, h - Math.random() * 80, 50 + Math.random() * 80, 20 + Math.random() * 40, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    this.addNoise(ctx, w, h, 0.08);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.wallpaper = texture;
    return texture;
  }

  getCarpetTexture() {
    if (this.cache.carpet) return this.cache.carpet;
    const w = 512, h = 512;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Damp tan/olive office carpet
    ctx.fillStyle = '#8f815a';
    ctx.fillRect(0, 0, w, h);

    // Speckled weave
    this.addNoise(ctx, w, h, 0.22, false);

    // Dark damp patches (the "damp carpet" lore of Level 0)
    ctx.fillStyle = 'rgba(50, 45, 25, 0.25)';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, Math.random() * h, 60 + Math.random() * 100, 40 + Math.random() * 70, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.carpet = texture;
    return texture;
  }

  getCeilingTileTexture() {
    if (this.cache.ceiling) return this.cache.ceiling;
    const w = 256, h = 256;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Off-white acoustic tile
    ctx.fillStyle = '#dcdad1';
    ctx.fillRect(0, 0, w, h);

    // Metal grid border
    ctx.strokeStyle = '#8c8a81';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, w, h);

    // Acoustic perforations (small dark dots)
    ctx.fillStyle = '#a6a49c';
    for (let y = 16; y < h - 16; y += 12) {
      for (let x = 16; x < w - 16; x += 12) {
        if (Math.random() > 0.3) {
          ctx.beginPath();
          ctx.arc(x + (Math.random() - 0.5) * 4, y + (Math.random() - 0.5) * 4, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    this.addNoise(ctx, w, h, 0.05);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.ceiling = texture;
    return texture;
  }

  getExitSignTexture() {
    if (this.cache.exitSign) return this.cache.exitSign;
    const w = 256, h = 128;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Glowing green institutional exit sign
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, w - 12, h - 12);

    ctx.font = 'bold 44px monospace';
    ctx.fillStyle = '#6ee7b7';
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 14;
    ctx.fillText('EXIT ➔', 32, 78);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.exitSign = texture;
    return texture;
  }

  // --- POOLROOMS TEXTURES ---

  getPoolTileTexture() {
    if (this.cache.poolTile) return this.cache.poolTile;
    const w = 512, h = 512;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // White grout background
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, w, h);

    const tileSize = 32;
    const gap = 3;

    // Pale cyan/aquamarine ceramic tiles
    for (let y = 0; y < h; y += tileSize) {
      for (let x = 0; x < w; x += tileSize) {
        // Subtle variation in tile tone
        const hue = 180 + Math.random() * 15;
        const sat = 45 + Math.random() * 20;
        const lum = 72 + Math.random() * 12;
        ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lum}%)`;
        ctx.fillRect(x + gap, y + gap, tileSize - gap * 2, tileSize - gap * 2);

        // Tile bevel highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(x + gap, y + gap, tileSize - gap * 2, 2);
        ctx.fillRect(x + gap, y + gap, 2, tileSize - gap * 2);

        // Tile shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(x + tileSize - gap - 2, y + gap, 2, tileSize - gap * 2);
        ctx.fillRect(x + gap, y + tileSize - gap - 2, tileSize - gap * 2, 2);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.poolTile = texture;
    return texture;
  }

  getWaterNormalMap() {
    if (this.cache.waterNormal) return this.cache.waterNormal;
    const w = 256, h = 256;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Tangent space normal map (Default flat = RGB 128, 128, 255)
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const nx = Math.sin((x / w) * Math.PI * 8) * Math.cos((y / h) * Math.PI * 6);
        const ny = Math.cos((x / w) * Math.PI * 6) * Math.sin((y / h) * Math.PI * 8);

        data[idx] = Math.floor(128 + nx * 50);     // Red (X)
        data[idx+1] = Math.floor(128 + ny * 50);   // Green (Y)
        data[idx+2] = 255;                         // Blue (Z)
        data[idx+3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.waterNormal = texture;
    return texture;
  }

  // --- WEAPON & PROP TEXTURES ---

  getGunMetalTexture() {
    if (this.cache.gunMetal) return this.cache.gunMetal;
    const w = 256, h = 256;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Matte gunmetal grey
    ctx.fillStyle = '#1e2229';
    ctx.fillRect(0, 0, w, h);

    // Subtle brushed metal streaks
    ctx.strokeStyle = '#2d333e';
    ctx.lineWidth = 1;
    for (let i = 0; i < 150; i++) {
      const y = Math.random() * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Grip knurling texture area (bottom half)
    ctx.fillStyle = '#111317';
    ctx.fillRect(0, 128, w, 128);
    ctx.strokeStyle = '#323742';
    for (let y = 128; y < h; y += 8) {
      for (let x = 0; x < w; x += 8) {
        ctx.strokeRect(x, y, 6, 6);
      }
    }

    this.addNoise(ctx, w, h, 0.05);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.gunMetal = texture;
    return texture;
  }

  getCrateTexture() {
    if (this.cache.crate) return this.cache.crate;
    const w = 256, h = 256;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Olive drab military crate
    ctx.fillStyle = '#3a4a35';
    ctx.fillRect(0, 0, w, h);

    // Steel reinforcement corners
    ctx.fillStyle = '#222920';
    ctx.fillRect(0, 0, w, 24);
    ctx.fillRect(0, h - 24, w, 24);
    ctx.fillRect(0, 0, 24, h);
    ctx.fillRect(w - 24, 0, 24, h);

    // Stencil text
    ctx.font = 'bold 26px monospace';
    ctx.fillStyle = '#eab308'; // Warning yellow
    ctx.fillText('AMMO 9MM', 36, 120);
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#ca8a04';
    ctx.fillText('TACTICAL RES-01', 36, 150);

    this.addNoise(ctx, w, h, 0.1);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.crate = texture;
    return texture;
  }
}

// Global texture generator singleton
window.gameTextures = new TextureGenerator();
