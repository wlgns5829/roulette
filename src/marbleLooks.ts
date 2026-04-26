import { drawCuteLunchMonster, getCuteMonsterPalette } from './cuteMonster';
import { drawReferenceHeroLook } from './referenceHeroMarbleLook';
import type { MarbleStyle } from './types/MarbleStyle.type';

type MarbleLookOptions = {
  x: number;
  y: number;
  size: number;
  hue: number;
  seed: number;
  rotation?: number;
  bounce?: number;
  glow?: string;
  flipY?: boolean;
};

function drawClassicMarble(
  ctx: CanvasRenderingContext2D,
  { x, y, size, hue, rotation = 0, bounce = 0, glow, flipY = false }: MarbleLookOptions
) {
  const radius = size * 0.64;
  const stretch = 1 + Math.min(1, bounce) * 0.05;

  ctx.save();
  ctx.translate(x, y);
  if (flipY) {
    ctx.scale(1, -1);
  }
  ctx.rotate(rotation * 0.1);
  ctx.scale(stretch, 1 - Math.min(1, bounce) * 0.04);

  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = radius * 0.34;
  }

  const gradient = ctx.createRadialGradient(-radius * 0.35, -radius * 0.45, radius * 0.16, 0, 0, radius * 1.15);
  gradient.addColorStop(0, 'rgba(255,255,255,0.96)');
  gradient.addColorStop(0.24, `hsl(${Math.round(hue)} 88% 80%)`);
  gradient.addColorStop(0.62, `hsl(${Math.round(hue + 6)} 82% 62%)`);
  gradient.addColorStop(1, `hsl(${Math.round(hue + 12)} 74% 40%)`);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = `hsla(${Math.round(hue + 14)}, 46%, 28%, 0.55)`;
  ctx.lineWidth = size * 0.05;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(-radius * 0.28, -radius * 0.36, radius * 0.2, radius * 0.13, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRetroBuddy(
  ctx: CanvasRenderingContext2D,
  size: number,
  palette: ReturnType<typeof getCuteMonsterPalette>,
  seed: number
) {
  const variant = Math.abs(seed) % 3;
  const lineWidth = size * 0.045;
  const outline = palette.outline;

  ctx.fillStyle = palette.shadow;
  ctx.beginPath();
  ctx.ellipse(0, size * 0.42, size * 0.34, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  if (variant === 0) {
    ctx.fillStyle = palette.body;
    ctx.beginPath();
    ctx.roundRect(-size * 0.3, -size * 0.12, size * 0.6, size * 0.68, size * 0.22);
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.roundRect(-size * 0.34, -size * 0.34, size * 0.68, size * 0.34, size * 0.18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.roundRect(-size * 0.21, -size * 0.21, size * 0.42, size * 0.12, size * 0.08);
    ctx.fill();
  } else if (variant === 1) {
    ctx.fillStyle = palette.cap;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.lineTo(size * 0.18, -size * 0.1);
    ctx.lineTo(size * 0.5, -size * 0.08);
    ctx.lineTo(size * 0.24, size * 0.1);
    ctx.lineTo(size * 0.32, size * 0.42);
    ctx.lineTo(0, size * 0.24);
    ctx.lineTo(-size * 0.32, size * 0.42);
    ctx.lineTo(-size * 0.24, size * 0.1);
    ctx.lineTo(-size * 0.5, -size * 0.08);
    ctx.lineTo(-size * 0.18, -size * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    ctx.fillStyle = palette.detail;
    ctx.beginPath();
    ctx.arc(0, -size * 0.08, size * 0.13, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = palette.body;
    ctx.beginPath();
    ctx.roundRect(-size * 0.34, -size * 0.18, size * 0.68, size * 0.6, size * 0.26);
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    ctx.fillStyle = palette.leaf;
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, -size * 0.18);
    ctx.quadraticCurveTo(-size * 0.28, -size * 0.44, -size * 0.04, -size * 0.42);
    ctx.quadraticCurveTo(0, -size * 0.26, -size * 0.2, -size * 0.18);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(size * 0.06, -size * 0.18);
    ctx.quadraticCurveTo(size * 0.28, -size * 0.44, size * 0.2, -size * 0.16);
    ctx.quadraticCurveTo(size * 0.04, -size * 0.08, size * 0.06, -size * 0.18);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = palette.eye;
  ctx.beginPath();
  ctx.ellipse(-size * 0.12, size * 0.04, size * 0.038, size * 0.054, 0, 0, Math.PI * 2);
  ctx.ellipse(size * 0.12, size * 0.04, size * 0.038, size * 0.054, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = outline;
  ctx.lineWidth = size * 0.026;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, size * 0.12, size * 0.08, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

function drawRetroParody(
  ctx: CanvasRenderingContext2D,
  { x, y, size, hue, seed, rotation = 0, bounce = 0, glow, flipY = false }: MarbleLookOptions
) {
  const palette = getCuteMonsterPalette(seed + 7, hue + 24);

  ctx.save();
  ctx.translate(x, y);
  if (flipY) {
    ctx.scale(1, -1);
  }
  ctx.rotate(rotation * 0.08);
  ctx.scale(1 + Math.min(1, bounce) * 0.05, 1 - Math.min(1, bounce) * 0.04);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = size * 0.24;
  }

  drawRetroBuddy(ctx, size * 1.02, palette, seed);
  ctx.restore();
}

function drawMushroomRunner(
  ctx: CanvasRenderingContext2D,
  { x, y, size, hue, seed, rotation = 0, bounce = 0, glow, flipY = false }: MarbleLookOptions
) {
  const capHue = Math.round(hue + (seed % 3) * 14);
  const capLight = `hsl(${capHue} 92% 66%)`;
  const capBase = `hsl(${capHue} 84% 54%)`;
  const capShadow = `hsl(${capHue} 72% 38%)`;
  const stem = 'rgba(255, 246, 228, 0.98)';
  const stemShade = 'rgba(237, 221, 196, 0.98)';
  const outline = 'rgba(60, 34, 18, 0.72)';
  const spot = `hsla(${capHue + 8}, 96%, 94%, 0.96)`;
  const shoe = `hsl(${capHue + 18} 42% 28%)`;
  const squash = Math.min(1, bounce);

  ctx.save();
  ctx.translate(x, y);
  if (flipY) {
    ctx.scale(1, -1);
  }
  ctx.rotate(rotation * 0.05);
  ctx.scale(1 + squash * 0.06, 1 - squash * 0.05);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = size * 0.22;
  }

  ctx.fillStyle = 'rgba(24, 18, 12, 0.18)';
  ctx.beginPath();
  ctx.ellipse(0, size * 0.45, size * 0.36, size * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = shoe;
  ctx.beginPath();
  ctx.ellipse(-size * 0.16, size * 0.35, size * 0.12, size * 0.08, -0.18, 0, Math.PI * 2);
  ctx.ellipse(size * 0.16, size * 0.35, size * 0.12, size * 0.08, 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = stem;
  ctx.strokeStyle = outline;
  ctx.lineWidth = size * 0.045;
  ctx.beginPath();
  ctx.roundRect(-size * 0.18, -size * 0.02, size * 0.36, size * 0.42, size * 0.18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = stemShade;
  ctx.beginPath();
  ctx.roundRect(-size * 0.04, 0, size * 0.08, size * 0.36, size * 0.05);
  ctx.fill();

  const capGradient = ctx.createLinearGradient(0, -size * 0.54, 0, size * 0.02);
  capGradient.addColorStop(0, capLight);
  capGradient.addColorStop(0.52, capBase);
  capGradient.addColorStop(1, capShadow);
  ctx.fillStyle = capGradient;
  ctx.beginPath();
  ctx.moveTo(-size * 0.48, -size * 0.02);
  ctx.quadraticCurveTo(-size * 0.44, -size * 0.52, 0, -size * 0.56);
  ctx.quadraticCurveTo(size * 0.44, -size * 0.52, size * 0.48, -size * 0.02);
  ctx.quadraticCurveTo(size * 0.18, size * 0.08, 0, size * 0.06);
  ctx.quadraticCurveTo(-size * 0.18, size * 0.08, -size * 0.48, -size * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = spot;
  [
    [-0.22, -0.28, 0.1],
    [0, -0.36, 0.12],
    [0.22, -0.22, 0.09],
  ].forEach(([sx, sy, r]) => {
    ctx.beginPath();
    ctx.arc(size * sx, size * sy, size * r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = 'rgba(32, 20, 12, 0.92)';
  ctx.beginPath();
  ctx.ellipse(-size * 0.08, size * 0.12, size * 0.032, size * 0.05, 0, 0, Math.PI * 2);
  ctx.ellipse(size * 0.08, size * 0.12, size * 0.032, size * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(92, 58, 38, 0.82)';
  ctx.lineWidth = size * 0.022;
  ctx.beginPath();
  ctx.arc(0, size * 0.19, size * 0.07, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.restore();
}

function drawMeteorCore(
  ctx: CanvasRenderingContext2D,
  { x, y, size, hue, seed, rotation = 0, bounce = 0, glow, flipY = false }: MarbleLookOptions
) {
  const radius = size * 0.42;
  const impact = Math.min(1, bounce);
  const flameHue = Math.round(18 + (seed % 3) * 12);

  ctx.save();
  ctx.translate(x, y);
  if (flipY) ctx.scale(1, -1);
  ctx.rotate(rotation * 0.18);
  ctx.scale(1 + impact * 0.08, 1 - impact * 0.04);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = size * 0.28;
  }

  const tailLength = size * (0.72 + impact * 0.18);
  const tail = ctx.createLinearGradient(-tailLength, 0, radius * 0.4, 0);
  tail.addColorStop(0, 'rgba(255, 70, 12, 0)');
  tail.addColorStop(0.3, `hsla(${flameHue} 100% 55% / 0.38)`);
  tail.addColorStop(0.68, 'rgba(255, 219, 96, 0.82)');
  tail.addColorStop(1, 'rgba(255, 255, 238, 0.96)');
  ctx.fillStyle = tail;
  ctx.beginPath();
  ctx.moveTo(-tailLength, 0);
  ctx.quadraticCurveTo(-size * 0.54, -size * 0.34, radius * 0.36, -radius * 0.42);
  ctx.quadraticCurveTo(-size * 0.08, 0, radius * 0.36, radius * 0.42);
  ctx.quadraticCurveTo(-size * 0.54, size * 0.34, -tailLength, 0);
  ctx.fill();

  const glowGradient = ctx.createRadialGradient(0, 0, radius * 0.18, 0, 0, radius * 1.9);
  glowGradient.addColorStop(0, 'rgba(255, 255, 245, 0.84)');
  glowGradient.addColorStop(0.28, 'rgba(255, 180, 57, 0.58)');
  glowGradient.addColorStop(1, 'rgba(255, 91, 23, 0)');
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.9, 0, Math.PI * 2);
  ctx.fill();

  const rock = ctx.createRadialGradient(-radius * 0.2, -radius * 0.28, radius * 0.16, 0, 0, radius);
  rock.addColorStop(0, '#fff1c6');
  rock.addColorStop(0.28, `hsl(${Math.round(hue + 28)} 82% 50%)`);
  rock.addColorStop(0.66, '#6a2b16');
  rock.addColorStop(1, '#28110c');
  ctx.fillStyle = rock;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12;
    const jag = radius * (0.82 + ((i + seed) % 4) * 0.06);
    const px = Math.cos(angle) * jag;
    const py = Math.sin(angle) * jag;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 220, 137, 0.82)';
  ctx.lineWidth = size * 0.045;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 120, 42, 0.72)';
  ctx.lineWidth = size * 0.028;
  for (let i = 0; i < 4; i++) {
    const angle = i * 1.55 + seed * 0.18;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * radius * 0.12, Math.sin(angle) * radius * 0.12);
    ctx.lineTo(Math.cos(angle) * radius * 0.56, Math.sin(angle) * radius * 0.48);
    ctx.stroke();
  }

  ctx.restore();
}

function drawGalaxyCore(
  ctx: CanvasRenderingContext2D,
  { x, y, size, hue, seed, rotation = 0, bounce = 0, glow, flipY = false }: MarbleLookOptions
) {
  const radius = size * 0.46;
  const impact = Math.min(1, bounce);

  ctx.save();
  ctx.translate(x, y);
  if (flipY) ctx.scale(1, -1);
  ctx.rotate(rotation * 0.12);
  ctx.scale(1 + impact * 0.04, 1 - impact * 0.03);

  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = size * 0.3;
  }

  const aura = ctx.createRadialGradient(0, 0, radius * 0.15, 0, 0, radius * 1.78);
  aura.addColorStop(0, 'rgba(255, 255, 255, 0.86)');
  aura.addColorStop(0.18, `hsla(${Math.round(hue + 55)} 100% 78% / 0.82)`);
  aura.addColorStop(0.54, `hsla(${Math.round(hue + 190)} 94% 58% / 0.45)`);
  aura.addColorStop(1, 'rgba(20, 8, 60, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.78, 0, Math.PI * 2);
  ctx.fill();

  const core = ctx.createRadialGradient(-radius * 0.22, -radius * 0.24, radius * 0.12, 0, 0, radius);
  core.addColorStop(0, '#ffffff');
  core.addColorStop(0.2, `hsl(${Math.round(hue + 84)} 100% 76%)`);
  core.addColorStop(0.58, `hsl(${Math.round(hue + 190)} 88% 40%)`);
  core.addColorStop(1, '#07081f');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.58)';
  ctx.lineWidth = size * 0.035;
  for (let ring = 0; ring < 3; ring++) {
    ctx.save();
    ctx.rotate(rotation * (0.16 + ring * 0.04) + ring * 0.72);
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * (1.22 + ring * 0.18), radius * (0.32 + ring * 0.04), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for (let i = 0; i < 8; i++) {
    const angle = seed * 0.4 + i * 1.7;
    const starRadius = radius * (0.24 + ((i + seed) % 5) * 0.12);
    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : `hsl(${Math.round(hue + 120)} 100% 82%)`;
    ctx.beginPath();
    ctx.arc(
      Math.cos(angle) * starRadius,
      Math.sin(angle) * starRadius,
      size * (0.018 + (i % 3) * 0.004),
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.restore();
}

function drawCrystalDrone(
  ctx: CanvasRenderingContext2D,
  { x, y, size, hue, seed, rotation = 0, bounce = 0, glow, flipY = false }: MarbleLookOptions
) {
  const radius = size * 0.5;
  const impact = Math.min(1, bounce);
  const baseHue = Math.round(hue + 160 + (seed % 3) * 18);

  ctx.save();
  ctx.translate(x, y);
  if (flipY) ctx.scale(1, -1);
  ctx.rotate(rotation * 0.08);
  ctx.scale(1 + impact * 0.03, 1 - impact * 0.05);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = size * 0.24;
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.ellipse(0, radius * 0.76, radius * 0.68, radius * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  const points: Array<[number, number]> = [
    [0, -radius],
    [radius * 0.68, -radius * 0.2],
    [radius * 0.42, radius * 0.72],
    [0, radius * 1.02],
    [-radius * 0.42, radius * 0.72],
    [-radius * 0.68, -radius * 0.2],
  ];

  const crystal = ctx.createLinearGradient(-radius, -radius, radius, radius);
  crystal.addColorStop(0, '#ffffff');
  crystal.addColorStop(0.26, `hsl(${baseHue} 100% 82%)`);
  crystal.addColorStop(0.62, `hsl(${baseHue + 36} 92% 55%)`);
  crystal.addColorStop(1, '#172554');
  ctx.fillStyle = crystal;
  ctx.beginPath();
  points.forEach(([px, py], index) => {
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(232, 248, 255, 0.92)';
  ctx.lineWidth = size * 0.045;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.62)';
  ctx.lineWidth = size * 0.022;
  [
    [0, -radius],
    [radius * 0.42, radius * 0.72],
    [-radius * 0.42, radius * 0.72],
  ].forEach(([px, py]) => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(px, py);
    ctx.stroke();
  });

  ctx.strokeStyle = `hsla(${baseHue + 20} 100% 78% / 0.72)`;
  ctx.lineWidth = size * 0.03;
  ctx.beginPath();
  ctx.arc(-radius * 0.92, -radius * 0.05, radius * 0.26, -0.8, 0.82);
  ctx.arc(radius * 0.92, -radius * 0.05, radius * 0.26, Math.PI - 0.82, Math.PI + 0.8);
  ctx.stroke();

  ctx.restore();
}

function drawRuneSpirit(
  ctx: CanvasRenderingContext2D,
  { x, y, size, hue, seed, rotation = 0, bounce = 0, glow, flipY = false }: MarbleLookOptions
) {
  const radius = size * 0.46;
  const impact = Math.min(1, bounce);
  const baseHue = Math.round(hue + 34);

  ctx.save();
  ctx.translate(x, y);
  if (flipY) ctx.scale(1, -1);
  ctx.rotate(rotation * 0.05);
  ctx.scale(1 + impact * 0.04, 1 - impact * 0.04);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = size * 0.3;
  }

  ctx.strokeStyle = `hsla(${baseHue} 100% 76% / 0.76)`;
  ctx.lineWidth = size * 0.032;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.08, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6 + rotation * 0.1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * radius * 0.78, Math.sin(angle) * radius * 0.78);
    ctx.lineTo(Math.cos(angle) * radius * 1.28, Math.sin(angle) * radius * 1.28);
    ctx.stroke();
  }

  const spirit = ctx.createRadialGradient(0, -radius * 0.12, radius * 0.08, 0, 0, radius * 1.05);
  spirit.addColorStop(0, '#ffffff');
  spirit.addColorStop(0.24, `hsl(${baseHue} 100% 78%)`);
  spirit.addColorStop(0.7, `hsl(${baseHue + 54} 86% 52%)`);
  spirit.addColorStop(1, 'rgba(31, 41, 55, 0.9)');
  ctx.fillStyle = spirit;
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.96);
  ctx.bezierCurveTo(radius * 0.64, -radius * 0.62, radius * 0.56, radius * 0.24, radius * 0.14, radius * 0.76);
  ctx.quadraticCurveTo(0, radius * 1.02, -radius * 0.14, radius * 0.76);
  ctx.bezierCurveTo(-radius * 0.56, radius * 0.24, -radius * 0.64, -radius * 0.62, 0, -radius * 0.96);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.74)';
  ctx.lineWidth = size * 0.035;
  ctx.stroke();

  ctx.fillStyle = 'rgba(18, 24, 38, 0.92)';
  ctx.beginPath();
  ctx.ellipse(-radius * 0.18, -radius * 0.14, radius * 0.06, radius * 0.09, 0, 0, Math.PI * 2);
  ctx.ellipse(radius * 0.18, -radius * 0.14, radius * 0.06, radius * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(18, 24, 38, 0.82)';
  ctx.lineWidth = size * 0.025;
  ctx.beginPath();
  ctx.arc(0, radius * 0.05, radius * 0.14, 0.18, Math.PI - 0.18);
  ctx.stroke();

  for (let i = 0; i < 5; i++) {
    const angle = seed * 0.27 + i * 1.42;
    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : `hsl(${baseHue + 42} 100% 78%)`;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * radius * 1.35, Math.sin(angle) * radius * 0.9, size * 0.025, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawMarbleLook(ctx: CanvasRenderingContext2D, options: MarbleLookOptions, style: MarbleStyle) {
  switch (style) {
    case 'classic':
      drawClassicMarble(ctx, options);
      break;
    case 'mushroom':
      drawMushroomRunner(ctx, options);
      break;
    case 'boss':
      drawReferenceHeroLook(ctx, options);
      break;
    case 'retro':
      drawRetroParody(ctx, options);
      break;
    case 'meteor':
      drawMeteorCore(ctx, options);
      break;
    case 'galaxy':
      drawGalaxyCore(ctx, options);
      break;
    case 'crystal':
      drawCrystalDrone(ctx, options);
      break;
    case 'rune':
      drawRuneSpirit(ctx, options);
      break;
    case 'sprite':
      drawClassicMarble(ctx, options);
      break;
    default:
      drawCuteLunchMonster(ctx, options);
      break;
  }
}
