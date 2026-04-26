type ReferenceHeroLookOptions = {
  x: number;
  y: number;
  size: number;
  seed: number;
  rotation?: number;
  bounce?: number;
  glow?: string;
  flipY?: boolean;
};

type ReferenceHeroVariant = {
  name: string;
  kind:
    | 'angel-mage'
    | 'scarf-warrior'
    | 'blue-swordsman'
    | 'red-jacket'
    | 'turban-monk'
    | 'goggle-worker'
    | 'cane-elder';
  skin: string;
  hair: string;
  outfitPrimary: string;
  outfitSecondary: string;
  accent: string;
  outline: string;
  glow: string;
};

const referenceHeroes: ReferenceHeroVariant[] = [
  {
    name: 'angel-mage',
    kind: 'angel-mage',
    skin: '#f5d7c2',
    hair: '#e8ecef',
    outfitPrimary: '#f7f3ff',
    outfitSecondary: '#8b5cf6',
    accent: '#facc15',
    outline: '#4c1d95',
    glow: 'rgba(168, 85, 247, 0.42)',
  },
  {
    name: 'scarf-warrior',
    kind: 'scarf-warrior',
    skin: '#efcfb3',
    hair: '#5b2d16',
    outfitPrimary: '#456b2f',
    outfitSecondary: '#efe3bf',
    accent: '#f97316',
    outline: '#422006',
    glow: 'rgba(249, 115, 22, 0.42)',
  },
  {
    name: 'blue-swordsman',
    kind: 'blue-swordsman',
    skin: '#f1d1bc',
    hair: '#7c2d12',
    outfitPrimary: '#2f66c7',
    outfitSecondary: '#173a75',
    accent: '#fde68a',
    outline: '#1e3a8a',
    glow: 'rgba(59, 130, 246, 0.4)',
  },
  {
    name: 'red-jacket',
    kind: 'red-jacket',
    skin: '#f2d3bf',
    hair: '#25161c',
    outfitPrimary: '#bf2f39',
    outfitSecondary: '#1f2937',
    accent: '#fca5a5',
    outline: '#4c0519',
    glow: 'rgba(248, 113, 113, 0.38)',
  },
  {
    name: 'turban-monk',
    kind: 'turban-monk',
    skin: '#d5b28e',
    hair: '#be4d18',
    outfitPrimary: '#d9d6cb',
    outfitSecondary: '#8b5e3c',
    accent: '#f59e0b',
    outline: '#7c2d12',
    glow: 'rgba(245, 158, 11, 0.38)',
  },
  {
    name: 'goggle-worker',
    kind: 'goggle-worker',
    skin: '#cda882',
    hair: '#1f2937',
    outfitPrimary: '#d8c59f',
    outfitSecondary: '#73624a',
    accent: '#facc15',
    outline: '#1f2937',
    glow: 'rgba(250, 204, 21, 0.34)',
  },
  {
    name: 'cane-elder',
    kind: 'cane-elder',
    skin: '#e0c4a3',
    hair: '#d5d5d5',
    outfitPrimary: '#efe5d2',
    outfitSecondary: '#8b7a5d',
    accent: '#94a3b8',
    outline: '#475569',
    glow: 'rgba(226, 232, 240, 0.34)',
  },
];

function drawShadow(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = 'rgba(18, 12, 9, 0.18)';
  ctx.beginPath();
  ctx.ellipse(0, size * 0.48, size * 0.28, size * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHead(ctx: CanvasRenderingContext2D, size: number, fill: string, outline: string) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = outline;
  ctx.lineWidth = size * 0.038;
  ctx.beginPath();
  ctx.arc(0, -size * 0.17, size * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawEyes(ctx: CanvasRenderingContext2D, size: number, outline: string) {
  ctx.fillStyle = outline;
  ctx.beginPath();
  ctx.arc(-size * 0.045, -size * 0.18, size * 0.014, 0, Math.PI * 2);
  ctx.arc(size * 0.045, -size * 0.18, size * 0.014, 0, Math.PI * 2);
  ctx.fill();
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  size: number,
  fill: string,
  outline: string,
  width = 0.22,
  height = 0.34
) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = outline;
  ctx.lineWidth = size * 0.038;
  ctx.beginPath();
  ctx.roundRect(-size * width, -size * 0.03, size * width * 2, size * height, size * 0.08);
  ctx.fill();
  ctx.stroke();
}

function drawLegs(ctx: CanvasRenderingContext2D, size: number, color: string, outline: string, spread = 0.07) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.055;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-size * 0.04, size * 0.18);
  ctx.lineTo(-size * spread, size * 0.42);
  ctx.moveTo(size * 0.04, size * 0.18);
  ctx.lineTo(size * spread, size * 0.42);
  ctx.stroke();

  ctx.strokeStyle = outline;
  ctx.lineWidth = size * 0.016;
  ctx.beginPath();
  ctx.moveTo(-size * 0.04, size * 0.18);
  ctx.lineTo(-size * spread, size * 0.42);
  ctx.moveTo(size * 0.04, size * 0.18);
  ctx.lineTo(size * spread, size * 0.42);
  ctx.stroke();
}

function drawArms(ctx: CanvasRenderingContext2D, size: number, color: string, outline: string, pose = 0) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.048;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-size * 0.16, size * (0.02 + pose * 0.03));
  ctx.lineTo(-size * 0.03, size * 0.08);
  ctx.moveTo(size * 0.16, size * (0.02 - pose * 0.03));
  ctx.lineTo(size * 0.03, size * 0.08);
  ctx.stroke();

  ctx.strokeStyle = outline;
  ctx.lineWidth = size * 0.014;
  ctx.beginPath();
  ctx.moveTo(-size * 0.16, size * (0.02 + pose * 0.03));
  ctx.lineTo(-size * 0.03, size * 0.08);
  ctx.moveTo(size * 0.16, size * (0.02 - pose * 0.03));
  ctx.lineTo(size * 0.03, size * 0.08);
  ctx.stroke();
}

function drawBlade(
  ctx: CanvasRenderingContext2D,
  size: number,
  x: number,
  y: number,
  length: number,
  angle: number,
  shaft: string,
  blade: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = shaft;
  ctx.lineWidth = size * 0.022;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, length);
  ctx.stroke();

  ctx.fillStyle = blade;
  ctx.beginPath();
  ctx.moveTo(-size * 0.028, length * 0.08);
  ctx.lineTo(0, -size * 0.16);
  ctx.lineTo(size * 0.028, length * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawStaff(
  ctx: CanvasRenderingContext2D,
  size: number,
  x: number,
  y: number,
  length: number,
  shaft: string,
  gem: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = shaft;
  ctx.lineWidth = size * 0.026;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -length * 0.56);
  ctx.lineTo(0, length * 0.32);
  ctx.stroke();

  ctx.fillStyle = gem;
  ctx.beginPath();
  ctx.moveTo(0, -length * 0.72);
  ctx.lineTo(size * 0.06, -length * 0.6);
  ctx.lineTo(0, -length * 0.48);
  ctx.lineTo(-size * 0.06, -length * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHalo(ctx: CanvasRenderingContext2D, size: number, color: string, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.028;
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.34, size * 0.14, size * 0.05, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawWing(ctx: CanvasRenderingContext2D, size: number, side: -1 | 1, fill: string, outline: string) {
  ctx.save();
  ctx.scale(side, 1);
  ctx.fillStyle = fill;
  ctx.strokeStyle = outline;
  ctx.lineWidth = size * 0.02;
  ctx.beginPath();
  ctx.moveTo(size * 0.05, -size * 0.06);
  ctx.quadraticCurveTo(size * 0.34, -size * 0.22, size * 0.3, size * 0.12);
  ctx.quadraticCurveTo(size * 0.18, 0, size * 0.05, size * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawReferenceHeroShape(ctx: CanvasRenderingContext2D, size: number, hero: ReferenceHeroVariant, bounce = 0) {
  const sway = Math.sin(bounce * Math.PI) * size * 0.01;

  switch (hero.kind) {
    case 'angel-mage':
      drawWing(ctx, size, -1, 'rgba(255,255,255,0.7)', hero.outline);
      drawWing(ctx, size, 1, 'rgba(255,255,255,0.7)', hero.outline);
      drawHalo(ctx, size, hero.accent, 0.9);
      drawBody(ctx, size, hero.outfitPrimary, hero.outline, 0.2, 0.4);
      drawHead(ctx, size, hero.skin, hero.outline);
      ctx.fillStyle = hero.hair;
      ctx.beginPath();
      ctx.arc(0, -size * 0.22, size * 0.1, Math.PI, Math.PI * 2);
      ctx.fill();
      drawEyes(ctx, size, hero.outline);
      drawArms(ctx, size, hero.skin, hero.outline, 0.2);
      drawLegs(ctx, size, hero.outfitSecondary, hero.outline, 0.05);
      drawStaff(ctx, size, -size * 0.18, size * 0.04, size * 0.82, '#8b5cf6', hero.accent);
      break;
    case 'scarf-warrior':
      drawBody(ctx, size, hero.outfitPrimary, hero.outline, 0.18, 0.28);
      drawHead(ctx, size, hero.skin, hero.outline);
      ctx.fillStyle = hero.hair;
      ctx.beginPath();
      ctx.arc(0, -size * 0.24, size * 0.09, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hero.accent;
      ctx.beginPath();
      ctx.moveTo(-size * 0.16, -size * 0.08);
      ctx.lineTo(size * 0.04, -size * 0.16);
      ctx.lineTo(size * 0.18, -size * 0.02);
      ctx.lineTo(size * 0.02, size * 0.04);
      ctx.closePath();
      ctx.fill();
      drawEyes(ctx, size, hero.outline);
      drawArms(ctx, size, hero.skin, hero.outline, 0.35);
      drawLegs(ctx, size, hero.outfitSecondary, hero.outline, 0.09);
      drawBlade(ctx, size, size * 0.14, -size * 0.02, size * 0.34, 1.08, '#7c2d12', '#f8fafc');
      break;
    case 'blue-swordsman':
      drawBody(ctx, size, hero.outfitPrimary, hero.outline, 0.19, 0.31);
      ctx.fillStyle = hero.outfitSecondary;
      ctx.beginPath();
      ctx.moveTo(-size * 0.15, -size * 0.06);
      ctx.lineTo(size * 0.15, -size * 0.06);
      ctx.lineTo(size * 0.08, size * 0.13);
      ctx.lineTo(-size * 0.08, size * 0.13);
      ctx.closePath();
      ctx.fill();
      drawHead(ctx, size, hero.skin, hero.outline);
      ctx.fillStyle = hero.hair;
      ctx.beginPath();
      ctx.moveTo(-size * 0.11, -size * 0.23);
      ctx.quadraticCurveTo(0, -size * 0.34, size * 0.11, -size * 0.23);
      ctx.lineTo(size * 0.09, -size * 0.11);
      ctx.lineTo(-size * 0.09, -size * 0.11);
      ctx.closePath();
      ctx.fill();
      drawEyes(ctx, size, hero.outline);
      drawArms(ctx, size, hero.skin, hero.outline, -0.12);
      drawLegs(ctx, size, hero.outfitSecondary, hero.outline, 0.07);
      drawBlade(ctx, size, -size * 0.16, size * 0.02, size * 0.44, -0.46, '#7c2d12', '#dbeafe');
      break;
    case 'red-jacket':
      drawBody(ctx, size, hero.outfitPrimary, hero.outline, 0.17, 0.3);
      ctx.fillStyle = hero.outfitSecondary;
      ctx.fillRect(-size * 0.05, -size * 0.02, size * 0.1, size * 0.2);
      drawHead(ctx, size, hero.skin, hero.outline);
      ctx.fillStyle = hero.hair;
      ctx.beginPath();
      ctx.moveTo(-size * 0.1, -size * 0.23);
      ctx.quadraticCurveTo(0, -size * 0.32, size * 0.1, -size * 0.2);
      ctx.lineTo(size * 0.08, -size * 0.06);
      ctx.lineTo(-size * 0.1, -size * 0.1);
      ctx.closePath();
      ctx.fill();
      drawEyes(ctx, size, hero.outline);
      drawArms(ctx, size, hero.skin, hero.outline, 0.06);
      drawLegs(ctx, size, hero.outfitSecondary, hero.outline, 0.05);
      break;
    case 'turban-monk':
      drawBody(ctx, size, hero.outfitPrimary, hero.outline, 0.17, 0.34);
      drawHead(ctx, size, hero.skin, hero.outline);
      ctx.fillStyle = hero.hair;
      ctx.beginPath();
      ctx.arc(0, -size * 0.3, size * 0.11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hero.accent;
      ctx.beginPath();
      ctx.arc(0, -size * 0.3, size * 0.1, Math.PI * 1.08, Math.PI * 1.92);
      ctx.lineTo(size * 0.1, -size * 0.3);
      ctx.closePath();
      ctx.fill();
      drawEyes(ctx, size, hero.outline);
      drawArms(ctx, size, hero.skin, hero.outline, 0.12);
      drawLegs(ctx, size, hero.outfitSecondary, hero.outline, 0.05);
      break;
    case 'goggle-worker':
      drawBody(ctx, size, hero.outfitPrimary, hero.outline, 0.18, 0.3);
      drawHead(ctx, size, hero.skin, hero.outline);
      ctx.fillStyle = hero.hair;
      ctx.beginPath();
      ctx.moveTo(-size * 0.1, -size * 0.23);
      ctx.lineTo(size * 0.1, -size * 0.23);
      ctx.lineTo(size * 0.08, -size * 0.08);
      ctx.lineTo(-size * 0.08, -size * 0.08);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = hero.outline;
      ctx.lineWidth = size * 0.024;
      ctx.beginPath();
      ctx.arc(-size * 0.05, -size * 0.18, size * 0.03, 0, Math.PI * 2);
      ctx.arc(size * 0.05, -size * 0.18, size * 0.03, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-size * 0.02, -size * 0.18);
      ctx.lineTo(size * 0.02, -size * 0.18);
      ctx.stroke();
      drawArms(ctx, size, hero.skin, hero.outline, -0.04);
      drawLegs(ctx, size, hero.outfitSecondary, hero.outline, 0.06);
      break;
    case 'cane-elder':
      drawBody(ctx, size, hero.outfitPrimary, hero.outline, 0.16, 0.34);
      drawHead(ctx, size, hero.skin, hero.outline);
      ctx.fillStyle = hero.hair;
      ctx.beginPath();
      ctx.arc(0, -size * 0.24, size * 0.09, Math.PI, Math.PI * 2);
      ctx.fill();
      drawEyes(ctx, size, hero.outline);
      drawArms(ctx, size, hero.skin, hero.outline, 0.06);
      drawLegs(ctx, size, hero.outfitSecondary, hero.outline, 0.04);
      drawStaff(ctx, size, size * 0.16, size * 0.06, size * 0.76, '#7c5a3b', hero.accent);
      break;
  }

  ctx.strokeStyle = hero.outline;
  ctx.lineWidth = size * 0.017;
  ctx.beginPath();
  ctx.arc(0, size * 0.01 + sway, size * 0.022, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

export function drawReferenceHeroLook(
  ctx: CanvasRenderingContext2D,
  { x, y, size, seed, rotation = 0, bounce = 0, glow, flipY = false }: ReferenceHeroLookOptions
) {
  const hero = referenceHeroes[Math.abs(seed) % referenceHeroes.length] ?? referenceHeroes[0];
  const squash = Math.min(1, bounce);

  ctx.save();
  ctx.translate(x, y);
  if (flipY) {
    ctx.scale(1, -1);
  }
  ctx.rotate(rotation * 0.05);
  ctx.scale(1 + squash * 0.03, 1 - squash * 0.04);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const appliedGlow = glow ?? hero.glow;
  if (appliedGlow) {
    ctx.shadowColor = appliedGlow;
    ctx.shadowBlur = size * 0.18;
  }

  drawShadow(ctx, size);
  drawReferenceHeroShape(ctx, size * 1.04, hero, bounce);
  ctx.restore();
}
