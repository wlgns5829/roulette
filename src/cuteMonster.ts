const TAU = Math.PI * 2;

type MonsterPalette = {
  cap: string;
  capShade: string;
  body: string;
  bodyShade: string;
  accent: string;
  outline: string;
  cheek: string;
  detail: string;
  leaf: string;
  shadow: string;
  eye: string;
  label: string;
};

export type CuteMonsterOptions = {
  x: number;
  y: number;
  size: number;
  hue: number;
  seed: number;
  rotation?: number;
  bounce?: number;
  glow?: string;
};

const paletteFamilies = [
  { baseHue: 28, accentHue: 18, leafHue: 102, warmth: 1 },
  { baseHue: 346, accentHue: 14, leafHue: 108, warmth: 0.9 },
  { baseHue: 152, accentHue: 40, leafHue: 118, warmth: 0.82 },
  { baseHue: 48, accentHue: 30, leafHue: 104, warmth: 1.04 },
  { baseHue: 204, accentHue: 32, leafHue: 110, warmth: 0.8 },
];

function normalizeHue(value: number) {
  return ((value % 360) + 360) % 360;
}

function tone(hue: number, saturation: number, lightness: number, alpha = 1) {
  return `hsla(${Math.round(normalizeHue(hue))}, ${saturation}%, ${lightness}%, ${alpha})`;
}

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
}

function fillAndStroke(ctx: CanvasRenderingContext2D, fillStyle: string, strokeStyle: string, lineWidth: number) {
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

export function getCuteMonsterPalette(seed: number, hue: number): MonsterPalette {
  const family = paletteFamilies[Math.abs(seed) % paletteFamilies.length];
  const drift = ((normalizeHue(hue) % 60) - 30) * 0.18;
  const baseHue = normalizeHue(family.baseHue + drift);
  const accentHue = normalizeHue(family.accentHue + drift * 0.5);
  const leafHue = normalizeHue(family.leafHue + drift * 0.22);
  const warmth = family.warmth;

  return {
    cap: tone(baseHue, 84, 66 - warmth * 3),
    capShade: tone(baseHue + 6, 76, 53 - warmth * 2),
    body: tone(baseHue + 16, 72, 90),
    bodyShade: tone(baseHue + 10, 52, 81),
    accent: tone(accentHue, 86, 68),
    outline: tone(baseHue + 8, 42, 31),
    cheek: tone(accentHue - 10, 82, 78, 0.9),
    detail: tone(baseHue + 22, 92, 95, 0.95),
    leaf: tone(leafHue, 56, 58),
    shadow: tone(baseHue + 2, 30, 18, 0.18),
    eye: tone(baseHue + 18, 28, 20),
    label: tone(baseHue + 10, 62, 56),
  };
}

function drawFace(ctx: CanvasRenderingContext2D, size: number, palette: MonsterPalette, y = 0.02) {
  const eyeY = size * y;
  ctx.fillStyle = palette.eye;
  ellipse(ctx, -size * 0.14, eyeY, size * 0.038, size * 0.054);
  ctx.fill();
  ellipse(ctx, size * 0.14, eyeY, size * 0.038, size * 0.054);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ellipse(ctx, -size * 0.152, eyeY - size * 0.016, size * 0.012, size * 0.016);
  ctx.fill();
  ellipse(ctx, size * 0.128, eyeY - size * 0.016, size * 0.012, size * 0.016);
  ctx.fill();

  ctx.fillStyle = palette.cheek;
  ellipse(ctx, -size * 0.24, eyeY + size * 0.056, size * 0.052, size * 0.028);
  ctx.fill();
  ellipse(ctx, size * 0.24, eyeY + size * 0.056, size * 0.052, size * 0.028);
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = size * 0.026;
  ctx.lineCap = 'round';
  ctx.arc(0, eyeY + size * 0.07, size * 0.072, 0.1, Math.PI - 0.1);
  ctx.stroke();
}

function drawMushroomMonster(ctx: CanvasRenderingContext2D, size: number, palette: MonsterPalette) {
  const lineWidth = size * 0.042;

  ellipse(ctx, 0, size * 0.42, size * 0.34, size * 0.11);
  ctx.fillStyle = palette.shadow;
  ctx.fill();

  ellipse(ctx, 0, size * 0.18, size * 0.26, size * 0.26);
  fillAndStroke(ctx, palette.body, palette.outline, lineWidth);

  ellipse(ctx, 0, size * 0.24, size * 0.22, size * 0.16);
  ctx.fillStyle = palette.bodyShade;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-size * 0.46, size * 0.02);
  ctx.bezierCurveTo(-size * 0.44, -size * 0.34, -size * 0.18, -size * 0.5, 0, -size * 0.44);
  ctx.bezierCurveTo(size * 0.18, -size * 0.5, size * 0.44, -size * 0.34, size * 0.46, size * 0.02);
  ctx.quadraticCurveTo(0, size * 0.16, -size * 0.46, size * 0.02);
  ctx.closePath();
  fillAndStroke(ctx, palette.cap, palette.outline, lineWidth);

  ctx.beginPath();
  ctx.moveTo(-size * 0.4, 0);
  ctx.quadraticCurveTo(0, -size * 0.2, size * 0.4, 0);
  ctx.quadraticCurveTo(0, size * 0.08, -size * 0.4, 0);
  ctx.closePath();
  ctx.fillStyle = palette.capShade;
  ctx.fill();

  ctx.fillStyle = palette.detail;
  [
    { x: -0.18, y: -0.17, r: 0.085 },
    { x: 0.12, y: -0.2, r: 0.078 },
    { x: 0.02, y: -0.04, r: 0.064 },
  ].forEach((spot) => {
    ellipse(ctx, size * spot.x, size * spot.y, size * spot.r, size * spot.r);
    ctx.fill();
  });

  ctx.fillStyle = palette.bodyShade;
  ellipse(ctx, -size * 0.11, size * 0.44, size * 0.08, size * 0.05);
  ctx.fill();
  ellipse(ctx, size * 0.11, size * 0.44, size * 0.08, size * 0.05);
  ctx.fill();

  drawFace(ctx, size, palette, 0.1);
}

function drawSlimeMonster(ctx: CanvasRenderingContext2D, size: number, palette: MonsterPalette) {
  const lineWidth = size * 0.042;

  ellipse(ctx, 0, size * 0.4, size * 0.32, size * 0.1);
  ctx.fillStyle = palette.shadow;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-size * 0.34, size * 0.22);
  ctx.quadraticCurveTo(-size * 0.44, size * 0.12, -size * 0.32, -size * 0.12);
  ctx.quadraticCurveTo(-size * 0.28, -size * 0.38, -size * 0.08, -size * 0.42);
  ctx.quadraticCurveTo(0, -size * 0.52, size * 0.08, -size * 0.42);
  ctx.quadraticCurveTo(size * 0.28, -size * 0.38, size * 0.32, -size * 0.1);
  ctx.quadraticCurveTo(size * 0.44, size * 0.14, size * 0.3, size * 0.24);
  ctx.quadraticCurveTo(size * 0.14, size * 0.44, 0, size * 0.3);
  ctx.quadraticCurveTo(-size * 0.14, size * 0.44, -size * 0.34, size * 0.22);
  ctx.closePath();
  fillAndStroke(ctx, palette.cap, palette.outline, lineWidth);

  ctx.beginPath();
  ctx.moveTo(-size * 0.24, size * 0.06);
  ctx.quadraticCurveTo(-size * 0.08, -size * 0.14, 0, -size * 0.1);
  ctx.quadraticCurveTo(size * 0.16, -size * 0.12, size * 0.22, size * 0.04);
  ctx.quadraticCurveTo(0, size * 0.16, -size * 0.24, size * 0.06);
  ctx.closePath();
  ctx.fillStyle = palette.capShade;
  ctx.fill();

  ctx.fillStyle = palette.detail;
  ellipse(ctx, -size * 0.14, -size * 0.06, size * 0.06, size * 0.035);
  ctx.fill();
  ellipse(ctx, size * 0.13, -size * 0.14, size * 0.05, size * 0.03);
  ctx.fill();

  drawFace(ctx, size, palette, 0.08);
}

function drawMochiMonster(ctx: CanvasRenderingContext2D, size: number, palette: MonsterPalette) {
  const lineWidth = size * 0.04;

  ellipse(ctx, 0, size * 0.42, size * 0.32, size * 0.1);
  ctx.fillStyle = palette.shadow;
  ctx.fill();

  ellipse(ctx, 0, size * 0.08, size * 0.34, size * 0.32);
  fillAndStroke(ctx, palette.body, palette.outline, lineWidth);

  ctx.beginPath();
  ctx.moveTo(-size * 0.06, -size * 0.26);
  ctx.quadraticCurveTo(-size * 0.1, -size * 0.42, -size * 0.02, -size * 0.48);
  ctx.quadraticCurveTo(size * 0.06, -size * 0.34, size * 0.02, -size * 0.22);
  ctx.closePath();
  ctx.fillStyle = palette.leaf;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, -size * 0.24);
  ctx.quadraticCurveTo(size * 0.08, -size * 0.4, size * 0.18, -size * 0.32);
  ctx.quadraticCurveTo(size * 0.14, -size * 0.18, size * 0.02, -size * 0.12);
  ctx.closePath();
  ctx.fill();

  ellipse(ctx, 0, size * 0.02, size * 0.26, size * 0.2);
  ctx.fillStyle = palette.bodyShade;
  ctx.fill();

  ctx.fillStyle = palette.accent;
  ellipse(ctx, -size * 0.22, size * 0.18, size * 0.045, size * 0.022);
  ctx.fill();
  ellipse(ctx, size * 0.22, size * 0.18, size * 0.045, size * 0.022);
  ctx.fill();

  drawFace(ctx, size, palette, 0.02);
}

export function drawCuteLunchMonster(ctx: CanvasRenderingContext2D, options: CuteMonsterOptions) {
  const { x, y, size, seed, hue } = options;
  const palette = getCuteMonsterPalette(seed, hue);
  const variant = Math.abs(seed) % 3;
  const bounce = Math.min(1, options.bounce ?? 0);
  const bob = Math.sin((options.rotation ?? 0) * 3 + seed * 1.7) * size * 0.028;

  ctx.save();
  ctx.translate(x, y + bob);

  if (options.glow) {
    ctx.shadowColor = options.glow;
    ctx.shadowBlur = size * 0.24;
  }

  ctx.rotate((options.rotation ?? 0) * 0.12);
  ctx.scale(1 + bounce * 0.06, 1 - bounce * 0.04);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (variant === 0) {
    drawMushroomMonster(ctx, size, palette);
  } else if (variant === 1) {
    drawSlimeMonster(ctx, size, palette);
  } else {
    drawMochiMonster(ctx, size, palette);
  }

  ctx.restore();
}
