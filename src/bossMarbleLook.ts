type BossMarbleLookOptions = {
  x: number;
  y: number;
  size: number;
  seed: number;
  rotation?: number;
  bounce?: number;
  glow?: string;
  flipY?: boolean;
};

type BossChampion = {
  title: string;
  kind:
    | 'hooded-mage'
    | 'spirit-maiden'
    | 'water-elemental'
    | 'shadow-demon'
    | 'lava-golem'
    | 'storm-monk'
    | 'oni-warrior'
    | 'bone-brute'
    | 'frost-beast'
    | 'worker-bee'
    | 'ghost-captain'
    | 'flame-wraith'
    | 'tribal-chief'
    | 'bug-queen'
    | 'bat-serpent'
    | 'azure-reaper'
    | 'ogre-general'
    | 'scarlet-sorceress'
    | 'torch-bee'
    | 'samurai-demon';
  primary: string;
  secondary: string;
  accent: string;
  aura: string;
  eye: string;
  outline: string;
  shadow: string;
};

const bossChampions: BossChampion[] = [
  { title: '흑치명', kind: 'hooded-mage', primary: '#221739', secondary: '#0f172a', accent: '#3b82f6', aura: 'rgba(96, 165, 250, 0.55)', eye: '#c4f1ff', outline: '#09090f', shadow: 'rgba(16, 12, 29, 0.4)' },
  { title: '아랑', kind: 'spirit-maiden', primary: '#f4f8f2', secondary: '#111827', accent: '#86efac', aura: 'rgba(187, 247, 208, 0.5)', eye: '#0f172a', outline: '#20312d', shadow: 'rgba(25, 34, 33, 0.34)' },
  { title: '물의정령', kind: 'water-elemental', primary: '#9bdcff', secondary: '#3b82f6', accent: '#dff7ff', aura: 'rgba(125, 211, 252, 0.56)', eye: '#effbff', outline: '#0f3b66', shadow: 'rgba(21, 68, 102, 0.36)' },
  { title: '불개', kind: 'shadow-demon', primary: '#320808', secondary: '#7f1d1d', accent: '#ef4444', aura: 'rgba(248, 113, 113, 0.48)', eye: '#ffb4b4', outline: '#170707', shadow: 'rgba(34, 8, 8, 0.42)' },
  { title: '화염거인', kind: 'lava-golem', primary: '#3f2618', secondary: '#0f0f12', accent: '#fb923c', aura: 'rgba(251, 146, 60, 0.5)', eye: '#ffedd5', outline: '#130d0a', shadow: 'rgba(34, 20, 12, 0.42)' },
  { title: '마르투스', kind: 'storm-monk', primary: '#535361', secondary: '#a855f7', accent: '#c4b5fd', aura: 'rgba(192, 132, 252, 0.48)', eye: '#f8fafc', outline: '#14141c', shadow: 'rgba(18, 18, 28, 0.38)' },
  { title: '라후', kind: 'oni-warrior', primary: '#8a2c10', secondary: '#2f0f0b', accent: '#fb923c', aura: 'rgba(249, 115, 22, 0.5)', eye: '#fff0d6', outline: '#1b0e0d', shadow: 'rgba(35, 17, 12, 0.38)' },
  { title: '바리', kind: 'bone-brute', primary: '#ddd2c4', secondary: '#7c2d12', accent: '#f59e0b', aura: 'rgba(251, 191, 36, 0.44)', eye: '#fff7ed', outline: '#231815', shadow: 'rgba(38, 26, 21, 0.36)' },
  { title: '카르타비리아', kind: 'frost-beast', primary: '#f8fafc', secondary: '#cbd5e1', accent: '#e2e8f0', aura: 'rgba(226, 232, 240, 0.48)', eye: '#111827', outline: '#6b7280', shadow: 'rgba(71, 85, 105, 0.32)' },
  { title: '수리벌', kind: 'worker-bee', primary: '#facc15', secondary: '#1f2937', accent: '#fef08a', aura: 'rgba(250, 204, 21, 0.44)', eye: '#ffffff', outline: '#422006', shadow: 'rgba(56, 29, 4, 0.34)' },
  { title: '배전선장망령', kind: 'ghost-captain', primary: '#475569', secondary: '#0f172a', accent: '#38bdf8', aura: 'rgba(56, 189, 248, 0.44)', eye: '#eff6ff', outline: '#111827', shadow: 'rgba(15, 23, 42, 0.4)' },
  { title: '폭염왕', kind: 'flame-wraith', primary: '#f97316', secondary: '#7c2d12', accent: '#fff7ed', aura: 'rgba(251, 146, 60, 0.52)', eye: '#fff7ed', outline: '#431407', shadow: 'rgba(67, 20, 7, 0.36)' },
  { title: '식인종추장', kind: 'tribal-chief', primary: '#9a5b34', secondary: '#f97316', accent: '#fde68a', aura: 'rgba(251, 146, 60, 0.4)', eye: '#fef3c7', outline: '#231815', shadow: 'rgba(37, 24, 21, 0.36)' },
  { title: '초성인성충', kind: 'bug-queen', primary: '#7cb342', secondary: '#4d7c0f', accent: '#ef4444', aura: 'rgba(163, 230, 53, 0.44)', eye: '#fefce8', outline: '#365314', shadow: 'rgba(54, 83, 20, 0.34)' },
  { title: '날수괴', kind: 'bat-serpent', primary: '#8b6d5c', secondary: '#64748b', accent: '#4ade80', aura: 'rgba(74, 222, 128, 0.42)', eye: '#ecfeff', outline: '#1f2937', shadow: 'rgba(31, 41, 55, 0.36)' },
  { title: '청의태자', kind: 'azure-reaper', primary: '#1e3a8a', secondary: '#0f172a', accent: '#bfdbfe', aura: 'rgba(147, 197, 253, 0.42)', eye: '#ffffff', outline: '#0f172a', shadow: 'rgba(15, 23, 42, 0.38)' },
  { title: '아귀장군', kind: 'ogre-general', primary: '#84cc16', secondary: '#4d7c0f', accent: '#d9f99d', aura: 'rgba(163, 230, 53, 0.4)', eye: '#f8fafc', outline: '#365314', shadow: 'rgba(54, 83, 20, 0.32)' },
  { title: '청의태자비', kind: 'scarlet-sorceress', primary: '#b91c1c', secondary: '#1f1729', accent: '#fca5a5', aura: 'rgba(252, 165, 165, 0.42)', eye: '#fff1f2', outline: '#2d0b18', shadow: 'rgba(45, 11, 24, 0.34)' },
  { title: '백제벌', kind: 'torch-bee', primary: '#fcd34d', secondary: '#5b3716', accent: '#fff7ed', aura: 'rgba(250, 204, 21, 0.38)', eye: '#ffffff', outline: '#422006', shadow: 'rgba(66, 32, 6, 0.34)' },
  { title: '기요마사', kind: 'samurai-demon', primary: '#b91c1c', secondary: '#111827', accent: '#fde68a', aura: 'rgba(248, 113, 113, 0.4)', eye: '#fff7ed', outline: '#1f1110', shadow: 'rgba(31, 17, 16, 0.38)' },
];

function drawAura(ctx: CanvasRenderingContext2D, size: number, color: string) {
  const glow = ctx.createRadialGradient(0, -size * 0.05, size * 0.08, 0, 0, size * 0.84);
  glow.addColorStop(0, 'rgba(255,255,255,0.72)');
  glow.addColorStop(0.26, color);
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.84, 0, Math.PI * 2);
  ctx.fill();
}

function drawShadow(ctx: CanvasRenderingContext2D, size: number, shadow: string) {
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(0, size * 0.48, size * 0.34, size * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawEyes(ctx: CanvasRenderingContext2D, size: number, color: string, angry = false) {
  ctx.save();
  ctx.fillStyle = color;
  if (angry) {
    ctx.beginPath();
    ctx.moveTo(-size * 0.16, -size * 0.04);
    ctx.lineTo(-size * 0.04, -size * 0.09);
    ctx.lineTo(-size * 0.06, size * 0.01);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(size * 0.16, -size * 0.04);
    ctx.lineTo(size * 0.04, -size * 0.09);
    ctx.lineTo(size * 0.06, size * 0.01);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(-size * 0.12, -size * 0.02, size * 0.04, size * 0.06, 0, 0, Math.PI * 2);
    ctx.ellipse(size * 0.12, -size * 0.02, size * 0.04, size * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCape(ctx: CanvasRenderingContext2D, size: number, primary: string, outline: string) {
  ctx.fillStyle = primary;
  ctx.strokeStyle = outline;
  ctx.lineWidth = size * 0.04;
  ctx.beginPath();
  ctx.moveTo(-size * 0.32, size * 0.02);
  ctx.quadraticCurveTo(-size * 0.52, size * 0.18, -size * 0.3, size * 0.46);
  ctx.quadraticCurveTo(0, size * 0.68, size * 0.3, size * 0.46);
  ctx.quadraticCurveTo(size * 0.52, size * 0.18, size * 0.32, size * 0.02);
  ctx.quadraticCurveTo(0, size * 0.22, -size * 0.32, size * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawHorns(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-size * 0.16, -size * 0.24);
  ctx.quadraticCurveTo(-size * 0.34, -size * 0.46, -size * 0.1, -size * 0.46);
  ctx.quadraticCurveTo(-size * 0.06, -size * 0.32, -size * 0.16, -size * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size * 0.16, -size * 0.24);
  ctx.quadraticCurveTo(size * 0.34, -size * 0.46, size * 0.1, -size * 0.46);
  ctx.quadraticCurveTo(size * 0.06, -size * 0.32, size * 0.16, -size * 0.24);
  ctx.closePath();
  ctx.fill();
}

function drawWings(ctx: CanvasRenderingContext2D, size: number, color: string, alpha = 0.9) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-size * 0.18, -size * 0.04);
  ctx.quadraticCurveTo(-size * 0.62, -size * 0.18, -size * 0.56, size * 0.2);
  ctx.quadraticCurveTo(-size * 0.44, size * 0.04, -size * 0.18, size * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size * 0.18, -size * 0.04);
  ctx.quadraticCurveTo(size * 0.62, -size * 0.18, size * 0.56, size * 0.2);
  ctx.quadraticCurveTo(size * 0.44, size * 0.04, size * 0.18, size * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBody(ctx: CanvasRenderingContext2D, size: number, fill: string, outline: string, round = 0.22) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = outline;
  ctx.lineWidth = size * 0.04;
  ctx.beginPath();
  ctx.roundRect(-size * 0.22, -size * 0.02, size * 0.44, size * 0.5, size * round);
  ctx.fill();
  ctx.stroke();
}

function drawHead(ctx: CanvasRenderingContext2D, size: number, fill: string, outline: string) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = outline;
  ctx.lineWidth = size * 0.04;
  ctx.beginPath();
  ctx.arc(0, -size * 0.12, size * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawWeapon(ctx: CanvasRenderingContext2D, size: number, shaft: string, blade: string, side: -1 | 1, kind: 'scythe' | 'sword' | 'staff' | 'torch') {
  ctx.save();
  ctx.translate(side * size * 0.28, size * 0.02);
  ctx.rotate(side * (kind === 'sword' ? 0.6 : 0.3));
  ctx.strokeStyle = shaft;
  ctx.lineWidth = size * 0.04;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.14);
  ctx.lineTo(0, size * 0.32);
  ctx.stroke();

  ctx.fillStyle = blade;
  if (kind === 'scythe') {
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.16);
    ctx.quadraticCurveTo(side * size * 0.28, -size * 0.22, side * size * 0.2, -size * 0.02);
    ctx.quadraticCurveTo(side * size * 0.06, -size * 0.02, 0, -size * 0.16);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'torch') {
    ctx.beginPath();
    ctx.arc(0, -size * 0.2, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff7ed';
    ctx.beginPath();
    ctx.arc(0, -size * 0.24, size * 0.034, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.2);
    ctx.lineTo(side * size * 0.08, -size * 0.02);
    ctx.lineTo(0, size * 0.02);
    ctx.lineTo(side * -size * 0.08, -size * 0.02);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawBossShape(ctx: CanvasRenderingContext2D, size: number, champion: BossChampion) {
  switch (champion.kind) {
    case 'hooded-mage':
      drawCape(ctx, size, champion.primary, champion.outline);
      ctx.fillStyle = champion.secondary;
      ctx.beginPath();
      ctx.moveTo(-size * 0.22, -size * 0.04);
      ctx.quadraticCurveTo(0, -size * 0.4, size * 0.22, -size * 0.04);
      ctx.lineTo(size * 0.12, size * 0.2);
      ctx.quadraticCurveTo(0, size * 0.04, -size * 0.12, size * 0.2);
      ctx.closePath();
      ctx.fill();
      drawEyes(ctx, size, champion.eye, true);
      drawWeapon(ctx, size, '#1f2937', champion.accent, 1, 'staff');
      break;
    case 'spirit-maiden':
      drawWings(ctx, size, 'rgba(255,255,255,0.22)', 0.6);
      ctx.fillStyle = champion.secondary;
      ctx.beginPath();
      ctx.arc(0, -size * 0.08, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = champion.primary;
      ctx.beginPath();
      ctx.moveTo(-size * 0.18, -size * 0.02);
      ctx.quadraticCurveTo(0, size * 0.3, 0, size * 0.48);
      ctx.quadraticCurveTo(0, size * 0.3, size * 0.18, -size * 0.02);
      ctx.quadraticCurveTo(0, -size * 0.16, -size * 0.18, -size * 0.02);
      ctx.closePath();
      ctx.fill();
      drawEyes(ctx, size, champion.eye);
      break;
    case 'water-elemental':
      ctx.fillStyle = champion.primary;
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.4);
      ctx.quadraticCurveTo(size * 0.3, -size * 0.22, size * 0.26, size * 0.1);
      ctx.quadraticCurveTo(size * 0.14, size * 0.42, 0, size * 0.48);
      ctx.quadraticCurveTo(-size * 0.14, size * 0.42, -size * 0.26, size * 0.1);
      ctx.quadraticCurveTo(-size * 0.3, -size * 0.22, 0, -size * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = champion.outline;
      ctx.lineWidth = size * 0.03;
      ctx.stroke();
      drawEyes(ctx, size, champion.eye);
      break;
    case 'shadow-demon':
      drawHorns(ctx, size, champion.accent);
      drawCape(ctx, size, champion.primary, champion.outline);
      ctx.fillStyle = champion.secondary;
      ctx.beginPath();
      ctx.arc(0, -size * 0.1, size * 0.18, 0, Math.PI * 2);
      ctx.fill();
      drawEyes(ctx, size, champion.eye, true);
      break;
    case 'lava-golem':
      ctx.fillStyle = champion.primary;
      ctx.beginPath();
      ctx.roundRect(-size * 0.26, -size * 0.18, size * 0.52, size * 0.68, size * 0.1);
      ctx.fill();
      ctx.strokeStyle = champion.outline;
      ctx.lineWidth = size * 0.05;
      ctx.stroke();
      ctx.strokeStyle = champion.accent;
      ctx.lineWidth = size * 0.03;
      ctx.beginPath();
      ctx.moveTo(-size * 0.1, -size * 0.14);
      ctx.lineTo(-size * 0.02, size * 0.12);
      ctx.lineTo(-size * 0.08, size * 0.28);
      ctx.moveTo(size * 0.08, -size * 0.08);
      ctx.lineTo(size * 0.04, size * 0.08);
      ctx.lineTo(size * 0.12, size * 0.28);
      ctx.stroke();
      drawEyes(ctx, size, champion.eye, true);
      break;
    case 'storm-monk':
      ctx.fillStyle = champion.primary;
      ctx.beginPath();
      ctx.arc(0, -size * 0.04, size * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = champion.secondary;
      ctx.beginPath();
      ctx.arc(0, size * 0.34, size * 0.12, 0, Math.PI * 2);
      ctx.fill();
      drawEyes(ctx, size, champion.eye);
      break;
    case 'oni-warrior':
      drawHorns(ctx, size, champion.accent);
      drawBody(ctx, size, champion.primary, champion.outline);
      drawHead(ctx, size, champion.secondary, champion.outline);
      drawEyes(ctx, size, champion.eye, true);
      drawWeapon(ctx, size, '#422006', champion.accent, 1, 'sword');
      drawWeapon(ctx, size, '#422006', champion.accent, -1, 'sword');
      break;
    case 'bone-brute':
      drawBody(ctx, size, champion.secondary, champion.outline, 0.16);
      drawHead(ctx, size, champion.primary, champion.outline);
      ctx.fillStyle = champion.primary;
      ctx.beginPath();
      ctx.rect(-size * 0.34, size * 0.1, size * 0.1, size * 0.06);
      ctx.rect(size * 0.24, size * 0.1, size * 0.1, size * 0.06);
      ctx.fill();
      drawEyes(ctx, size, champion.eye, true);
      break;
    case 'frost-beast':
      drawWings(ctx, size, 'rgba(255,255,255,0.18)', 0.5);
      ctx.fillStyle = champion.primary;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.26, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-size * 0.18, size * 0.06, size * 0.1, 0, Math.PI * 2);
      ctx.arc(size * 0.18, size * 0.06, size * 0.1, 0, Math.PI * 2);
      ctx.fill();
      drawEyes(ctx, size, champion.eye);
      break;
    case 'worker-bee':
      drawWings(ctx, size, 'rgba(226,232,240,0.76)');
      ctx.fillStyle = champion.primary;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.2, size * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = champion.secondary;
      ctx.lineWidth = size * 0.035;
      ctx.beginPath();
      ctx.moveTo(-size * 0.16, -size * 0.04);
      ctx.lineTo(size * 0.16, -size * 0.04);
      ctx.moveTo(-size * 0.16, size * 0.08);
      ctx.lineTo(size * 0.16, size * 0.08);
      ctx.stroke();
      drawEyes(ctx, size, champion.eye);
      break;
    case 'ghost-captain':
      drawCape(ctx, size, champion.primary, champion.outline);
      ctx.fillStyle = champion.secondary;
      ctx.beginPath();
      ctx.moveTo(-size * 0.2, -size * 0.18);
      ctx.lineTo(size * 0.2, -size * 0.18);
      ctx.lineTo(size * 0.12, -size * 0.28);
      ctx.lineTo(-size * 0.12, -size * 0.28);
      ctx.closePath();
      ctx.fill();
      drawHead(ctx, size, '#a8c7ff', champion.outline);
      drawEyes(ctx, size, champion.eye);
      drawWeapon(ctx, size, '#334155', champion.accent, 1, 'staff');
      break;
    case 'flame-wraith':
      ctx.fillStyle = champion.primary;
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.42);
      ctx.quadraticCurveTo(size * 0.28, -size * 0.2, size * 0.22, 0);
      ctx.quadraticCurveTo(size * 0.3, size * 0.22, 0, size * 0.46);
      ctx.quadraticCurveTo(-size * 0.3, size * 0.22, -size * 0.22, 0);
      ctx.quadraticCurveTo(-size * 0.28, -size * 0.2, 0, -size * 0.42);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff7ed';
      ctx.beginPath();
      ctx.arc(0, -size * 0.04, size * 0.14, 0, Math.PI * 2);
      ctx.fill();
      drawEyes(ctx, size, '#7c2d12', true);
      break;
    case 'tribal-chief':
      drawBody(ctx, size, champion.primary, champion.outline);
      drawHead(ctx, size, '#d8a97b', champion.outline);
      ctx.fillStyle = champion.accent;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(-size * 0.16 + i * size * 0.08, -size * 0.26);
        ctx.lineTo(-size * 0.1 + i * size * 0.08, -size * 0.46 - (i % 2) * size * 0.05);
        ctx.lineTo(-size * 0.04 + i * size * 0.08, -size * 0.24);
        ctx.closePath();
        ctx.fill();
      }
      drawEyes(ctx, size, champion.eye);
      break;
    case 'bug-queen':
      drawWings(ctx, size, 'rgba(217,249,157,0.32)');
      ctx.fillStyle = champion.primary;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.14, size * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = champion.secondary;
      ctx.fillRect(-size * 0.03, -size * 0.32, size * 0.06, size * 0.08);
      ctx.fillStyle = champion.accent;
      ctx.beginPath();
      ctx.arc(0, -size * 0.34, size * 0.06, 0, Math.PI * 2);
      ctx.fill();
      drawEyes(ctx, size, champion.eye);
      break;
    case 'bat-serpent':
      drawWings(ctx, size, champion.accent, 0.72);
      ctx.fillStyle = champion.primary;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.18, size * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = champion.secondary;
      ctx.beginPath();
      ctx.arc(0, -size * 0.16, size * 0.12, 0, Math.PI * 2);
      ctx.fill();
      drawEyes(ctx, size, champion.eye);
      break;
    case 'azure-reaper':
      drawCape(ctx, size, champion.primary, champion.outline);
      drawHead(ctx, size, champion.secondary, champion.outline);
      drawEyes(ctx, size, champion.eye, true);
      drawWeapon(ctx, size, '#d1d5db', champion.accent, 1, 'scythe');
      break;
    case 'ogre-general':
      drawBody(ctx, size, champion.primary, champion.outline, 0.18);
      drawHead(ctx, size, champion.primary, champion.outline);
      ctx.fillStyle = champion.secondary;
      ctx.beginPath();
      ctx.arc(-size * 0.2, -size * 0.02, size * 0.08, 0, Math.PI * 2);
      ctx.arc(size * 0.2, -size * 0.02, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
      drawEyes(ctx, size, champion.eye);
      break;
    case 'scarlet-sorceress':
      drawWings(ctx, size, 'rgba(252, 165, 165, 0.22)', 0.42);
      drawCape(ctx, size, champion.primary, champion.outline);
      drawHead(ctx, size, '#f5d0c5', champion.outline);
      drawEyes(ctx, size, champion.eye);
      drawWeapon(ctx, size, '#fca5a5', champion.accent, 1, 'scythe');
      break;
    case 'torch-bee':
      drawWings(ctx, size, 'rgba(255,255,255,0.7)');
      ctx.fillStyle = champion.primary;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.18, size * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = champion.secondary;
      ctx.lineWidth = size * 0.03;
      ctx.beginPath();
      ctx.moveTo(-size * 0.14, 0);
      ctx.lineTo(size * 0.14, 0);
      ctx.stroke();
      drawEyes(ctx, size, champion.eye);
      drawWeapon(ctx, size, '#7c2d12', '#fb923c', 1, 'torch');
      break;
    case 'samurai-demon':
      drawHorns(ctx, size, champion.accent);
      drawBody(ctx, size, champion.primary, champion.outline);
      drawHead(ctx, size, champion.secondary, champion.outline);
      drawEyes(ctx, size, champion.eye, true);
      drawWeapon(ctx, size, '#cbd5e1', champion.accent, -1, 'sword');
      drawWeapon(ctx, size, '#cbd5e1', champion.accent, 1, 'sword');
      break;
  }
}

export function drawBossMarbleLook(
  ctx: CanvasRenderingContext2D,
  { x, y, size, seed, rotation = 0, bounce = 0, glow, flipY = false }: BossMarbleLookOptions
) {
  const champion = bossChampions[Math.abs(seed) % bossChampions.length] ?? bossChampions[0];
  const squash = Math.min(1, bounce);

  ctx.save();
  ctx.translate(x, y);
  if (flipY) {
    ctx.scale(1, -1);
  }
  ctx.rotate(rotation * 0.08);
  ctx.scale(1 + squash * 0.05, 1 - squash * 0.04);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = size * 0.2;
  }

  drawShadow(ctx, size, champion.shadow);
  drawAura(ctx, size, champion.aura);
  drawBossShape(ctx, size, champion);

  ctx.strokeStyle = champion.outline;
  ctx.lineWidth = size * 0.026;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.56, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}
