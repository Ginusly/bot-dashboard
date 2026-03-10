/**
 * gifGenerator.js - Animated GIF profile card generator
 * 
 * Uses gif-encoder-2 (octree mode) + node-canvas.
 * GIF COMPATIBLE: no semi-transparent rgba colours in final pixels.
 * All blending done at render time into an opaque canvas.
 */

const Canvas = require('canvas');
const GIFEncoder = require('gif-encoder-2');

// ─── roundRect polyfill ───────────────────────────────────────────────────────
if (!Canvas.CanvasRenderingContext2D.prototype.roundRect) {
    Canvas.CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

// ─── Colour Utils ─────────────────────────────────────────────────────────────
function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}
function lightenHex(hex, amt) {
    if (!hex || !hex.startsWith('#')) return hex;
    const { r, g, b } = hexToRgb(hex);
    return '#' + [Math.min(255, r + amt), Math.min(255, g + amt), Math.min(255, b + amt)]
        .map(v => v.toString(16).padStart(2, '0')).join('');
}
/**
 * Returns a solid-colour overlay  blended into a canvas background using
 * globalAlpha — node-canvas composites this correctly into the pixel buffer,
 * so GIFEncoder.addFrame(ctx) sees the composited result (fully opaque).
 */
function solidOverlay(ctx, W, H, color, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
}

// ─── Badge mapping (by icon field stored in shop_items) ─────────────────────
const BADGE_MAP = {
    'Globe': { emoji: '🌍', color: '#3b82f6', solid: '#1d3666' },
    'Cpu': { emoji: '💻', color: '#22d3ee', solid: '#0e7490' },
    'Terminal': { emoji: '🖥️', color: '#10b981', solid: '#064e3b' },
    'Crown': { emoji: '👑', color: '#fbbf24', solid: '#78350f' },
    'Heart': { emoji: '❤️', color: '#ec4899', solid: '#881337' },
    'Star': { emoji: '⭐', color: '#f59e0b', solid: '#713f12' },
    'Shield': { emoji: '🛡️', color: '#6366f1', solid: '#312e81' },
    'Zap': { emoji: '⚡', color: '#a855f7', solid: '#4a1d96' },
    'Gem': { emoji: '💎', color: '#06b6d4', solid: '#0c4a6e' },
    'Trophy': { emoji: '🏆', color: '#f97316', solid: '#7c2d12' },
};

function drawHexBadge(ctx, bcx, bcy, br, info) {
    // Dark solid background for the hexagon
    ctx.save();
    // Draw filled hexagon
    ctx.beginPath();
    for (let j = 0; j < 6; j++) {
        const ang = (Math.PI / 3) * j - Math.PI / 2;
        const hx = bcx + br * Math.cos(ang);
        const hy = bcy + br * Math.sin(ang);
        j === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fillStyle = info.solid;
    ctx.fill();
    ctx.strokeStyle = info.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = info.color;
    ctx.shadowBlur = 10;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = `${Math.floor(br * 1.05)}px "Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(info.emoji, bcx, bcy + 1);
    ctx.restore();
}

function drawSimpleRing(ctx, cx, cy, radius, color, width = 10) {
    ctx.save();
    ctx.strokeStyle = typeof color === 'string' ? color : '#5865f2';
    ctx.lineWidth = width;
    ctx.shadowColor = typeof color === 'string' ? color : '#5865f2';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + Math.floor(width / 2) + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
}

// ─── Render one GIF frame ────────────────────────────────────────────────────
function renderFrame(ctx, W, H, user, levelData, profileData, avatarImg, bgImg, frameImg, f, total) {
    const t = f / total; // 0‥1 animation progress

    // ── bg ────────────────────────────────────────────────────────────────────
    if (profileData?.bg_is_css) {
        switch (profileData.bg_name) {
            case 'Matrix Rain': {
                ctx.fillStyle = '#0a0a0a';
                ctx.fillRect(0, 0, W, H);
                ctx.font = '13px monospace';
                ctx.textAlign = 'center';
                for (let col = 12; col < W; col += 22) {
                    const speed = 8 + (col % 7) * 2;
                    const baseY = ((f * speed) + col * 19) % (H + 40);
                    for (let tr = 0; tr < 6; tr++) {
                        const brightness = Math.max(50, 255 - tr * 40);
                        ctx.fillStyle = `rgb(0,${brightness},0)`;
                        const ch = tr === 0 ? (Math.floor(f + col) % 2 === 0 ? '1' : '0') : (col % 2 === 0 ? '0' : '1');
                        ctx.fillText(ch, col, baseY - tr * 14);
                    }
                }
                break;
            }
            case 'Lava Flow': {
                // Animated scanline lava — no globalCompositeOperation needed
                for (let y = 0; y < H; y++) {
                    const yp = y / H;
                    const wave = Math.sin(t * Math.PI * 2 + yp * 5) * 0.12 + Math.cos(t * Math.PI * 1.3 + yp * 3) * 0.08;
                    const heat = Math.min(1, Math.max(0, yp + wave));
                    // dark-red → crimson → orange
                    let rr, gg, bb;
                    if (heat < 0.4) {
                        const s = heat / 0.4;
                        rr = Math.round(30 + s * (174 - 30));
                        gg = Math.round(0 + s * 10);
                        bb = 0;
                    } else if (heat < 0.75) {
                        const s = (heat - 0.4) / 0.35;
                        rr = Math.round(174 + s * (230 - 174));
                        gg = Math.round(10 + s * (80 - 10));
                        bb = 0;
                    } else {
                        const s = (heat - 0.75) / 0.25;
                        rr = Math.round(230 + s * (255 - 230));
                        gg = Math.round(80 + s * (160 - 80));
                        bb = 0;
                    }
                    ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
                    ctx.fillRect(0, y, W, 1);
                }
                break;
            }
            case 'Aurora Borealis': {
                // Slowly cycling gradient
                const shift = t;
                const stops = [
                    '#0d9488', '#2563eb', '#7c3aed', '#0d9488'
                ];
                // Draw as vertical scanlines cycling through the palette
                for (let y = 0; y < H; y++) {
                    const p = (y / H + shift) % 1;
                    const si = Math.floor(p * (stops.length - 1));
                    const sr = p * (stops.length - 1) - si;
                    const ca = hexToRgb(stops[si]);
                    const cb = hexToRgb(stops[Math.min(si + 1, stops.length - 1)]);
                    const rr = Math.round(ca.r * (1 - sr) + cb.r * sr);
                    const gg = Math.round(ca.g * (1 - sr) + cb.g * sr);
                    const bb = Math.round(ca.b * (1 - sr) + cb.b * sr);
                    ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
                    ctx.fillRect(0, y, W, 1);
                }
                break;
            }
            case 'Black Hole Horizon': {
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, W, H);
                const rot = t * Math.PI * 2;
                ctx.save(); ctx.translate(W / 2, H / 2);
                ctx.rotate(rot);
                ctx.beginPath(); ctx.ellipse(0, 0, 400 + Math.sin(rot) * 20, 100, -15 * Math.PI / 180, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(234, 88, 12, 0.4)'; ctx.fill();
                ctx.restore();
                ctx.save(); ctx.translate(W / 2, H / 2);
                ctx.rotate(-rot);
                ctx.beginPath(); ctx.ellipse(0, 0, 100, 300, 75 * Math.PI / 180, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(251, 191, 36, 0.3)'; ctx.fill();
                ctx.restore();
                ctx.beginPath(); ctx.arc(W / 2, H / 2, 100, 0, 2 * Math.PI);
                ctx.fillStyle = '#000'; ctx.shadowColor = '#ea580c'; ctx.shadowBlur = 30 + Math.sin(rot) * 10;
                ctx.fill(); ctx.shadowBlur = 0;
                break;
            }
            case 'Neon Grid Skyline': {
                const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
                skyGrad.addColorStop(0, '#1e1b4b'); skyGrad.addColorStop(0.5, '#c026d3'); skyGrad.addColorStop(1, '#000');
                ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, H);
                const sunGrad = ctx.createLinearGradient(W / 2, H * 0.1, W / 2, H * 0.4);
                sunGrad.addColorStop(0, '#facc15'); sunGrad.addColorStop(1, '#e11d48');
                ctx.beginPath(); ctx.arc(W / 2, H * 0.25, 60, 0, 2 * Math.PI);
                ctx.fillStyle = sunGrad; ctx.shadowColor = '#e11d48'; ctx.shadowBlur = 40 + Math.sin(t * Math.PI * 2) * 10;
                ctx.fill(); ctx.shadowBlur = 0;
                ctx.strokeStyle = 'rgba(236, 72, 153, 0.3)'; ctx.lineWidth = 2;
                for (let i = (t * 40) % 40; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, H / 2); ctx.lineTo(i - W / 2, H); ctx.stroke(); }
                for (let j = H / 2 + (t * 20) % 20; j < H; j += 20) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(W, j); ctx.stroke(); }
                break;
            }
            default:
                drawDefaultBg(ctx, W, H);
        }
    } else if (bgImg) {
        const scale = Math.max(W / bgImg.width, H / bgImg.height);
        const bx = (W - bgImg.width * scale) / 2;
        const by = (H - bgImg.height * scale) / 2;
        ctx.drawImage(bgImg, bx, by, bgImg.width * scale, bgImg.height * scale);
    } else {
        drawDefaultBg(ctx, W, H);
    }

    // Modern Glassmorphism Overlay
    const gradientOverlay = ctx.createLinearGradient(0, 0, W, 0);
    gradientOverlay.addColorStop(0, 'rgba(0,0,0,0.85)');
    gradientOverlay.addColorStop(0.4, 'rgba(0,0,0,0.7)');
    gradientOverlay.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = gradientOverlay;
    // For gif encoder we need to draw it manually, solidOverlay doesn't do gradient transparency natively in octree unless we just draw it. We'll use composite by manually drawing solid rects to simulate or just trust the canvas encoder.
    ctx.fillRect(0, 0, W, H);

    // ── frame colour ──────────────────────────────────────────────────────────
    const accentHex = (profileData?.frame_color && !profileData.frame_color.startsWith('http'))
        ? profileData.frame_color : '#5865f2';

    // ── accent top bar ────────────────────────────────────────────────────────
    ctx.fillStyle = accentHex;
    ctx.fillRect(0, 0, W, 6);
    ctx.fillRect(0, H - 6, W, 6);

    // ── avatar ────────────────────────────────────────────────────────────────
    const aSize = 180, aX = 40, aY = Math.round((H - aSize) / 2);
    const cx = aX + aSize / 2, cy = aY + aSize / 2, radius = aSize / 2;

    // glow ring
    ctx.shadowColor = accentHex; ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = accentHex;
    ctx.fill();
    ctx.shadowBlur = 0;

    // clip & draw
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    if (avatarImg) ctx.drawImage(avatarImg, aX, aY, aSize, aSize);
    else { ctx.fillStyle = '#1c1c1f'; ctx.fillRect(aX, aY, aSize, aSize); }
    ctx.restore();

    // ── frame animations ──────────────────────────────────────────────────────
    if (profileData?.frame_name === 'Fire Sword') {
        const ringRot = t * Math.PI * 2;
        ctx.save();
        ctx.translate(cx, cy);

        // Rotating aura
        ctx.rotate(ringRot);
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 5, 0, Math.PI);
        ctx.strokeStyle = '#ea580c';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, radius + 5, Math.PI, Math.PI * 2);
        ctx.strokeStyle = '#fbbf24';
        ctx.stroke();

        ctx.restore();

        // Sword stays fixed relative to avatar
        ctx.save();
        ctx.translate(cx + radius * 0.8, cy - radius * 0.8);
        ctx.rotate(Math.PI / 4 + Math.sin(t * Math.PI * 2) * 0.05);
        ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-10, -50, 20, 100);
        ctx.fillStyle = '#fbbf24'; ctx.fillRect(-25, 30, 50, 10);
        ctx.fillStyle = '#78350f'; ctx.fillRect(-5, 40, 10, 30);
        ctx.fillStyle = '#ec4899'; ctx.beginPath(); ctx.arc(0, 35, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    } else if (profileData?.frame_name === 'Celestial Portal') {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * Math.PI * 2);
        const pGrad = ctx.createConicGradient(0, 0, 0);
        pGrad.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
        pGrad.addColorStop(0.5, '#8b5cf6');
        pGrad.addColorStop(1, 'rgba(59, 130, 246, 0.1)');
        ctx.strokeStyle = pGrad;
        ctx.lineWidth = 14;
        ctx.beginPath(); ctx.arc(0, 0, radius + 7, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    } else if (profileData?.frame_name === 'Sakura Whisper') {
        ctx.strokeStyle = '#fbcfe8';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2); ctx.stroke();

        // Animated flowers
        ctx.font = '32px "Segoe UI Emoji", sans-serif';
        const bounce = Math.sin(t * Math.PI * 2) * 4;
        ctx.fillText('🌸', cx - radius - 15, cy - radius + 10 + bounce);
        ctx.fillText('🌸', cx + radius - 10, cy + radius - 10 - bounce);
        ctx.fillText('🌸', cx + radius + 10, cy - 20 + bounce * 0.5);
    } else if (profileData?.frame_is_css) {
        const fname = profileData.frame_name;
        if (fname === 'Fire Ring') {
            // Three pulsing rings cycling red→orange→gold colours
            const fireColors = ['#ff4500', '#ff8c00', '#ffd700'];
            const offsets = [14, 9, 4];
            for (let i = 0; i < fireColors.length; i++) {
                const pulse = Math.sin(t * Math.PI * 2 + i * 1.1) * 2;
                ctx.save();
                ctx.strokeStyle = fireColors[i];
                ctx.lineWidth = 5 - i;
                ctx.shadowColor = fireColors[i];
                ctx.shadowBlur = 14;
                ctx.beginPath();
                ctx.arc(cx, cy, radius + offsets[i] + pulse, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.restore();
            }
        } else if (fname === 'Ice Ring') {
            // Base ring
            drawSimpleRing(ctx, cx, cy, radius, '#38bdf8', 9);
            // Inner thin ring
            ctx.strokeStyle = '#bae6fd'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2); ctx.stroke();
            // Sweeping shine arc
            const sweepStart = t * Math.PI * 2 - Math.PI / 2;
            ctx.save();
            ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 7;
            ctx.lineCap = 'round';
            ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(cx, cy, radius + 9, sweepStart, sweepStart + 0.55);
            ctx.stroke();
            // Opposite dim arc
            ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 4;
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(cx, cy, radius + 9, sweepStart + Math.PI, sweepStart + Math.PI + 0.35);
            ctx.stroke();
            ctx.lineCap = 'butt';
            ctx.restore();
        } else if (fname === 'Cosmic Halo') {
            // Rotating dashed halo with colour cycling
            const haloColors = ['#3b82f6', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e'];
            const ringRadius = radius + 10;
            const dashAng = 0.55, gapAng = 0.35;
            const rotOffset = t * Math.PI * 2;
            let ang = rotOffset;
            let ci = 0;
            while (ang < rotOffset + Math.PI * 2) {
                ctx.save();
                ctx.strokeStyle = haloColors[ci % haloColors.length];
                ctx.lineWidth = 7;
                ctx.lineCap = 'round';
                ctx.shadowColor = haloColors[ci % haloColors.length];
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(cx, cy, ringRadius, ang, ang + dashAng);
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.restore();
                ang += dashAng + gapAng;
                ci++;
            }
        } else if (fname === 'Wood Ring & Cat') {
            // Wooden multi-ring
            ctx.save();
            [{ r: radius + 12, c: '#8B5A2B', w: 11 }, { r: radius + 3, c: '#5c3a18', w: 3 }, { r: radius + 16, c: '#a0693a', w: 2 }].forEach(l => {
                ctx.strokeStyle = l.c; ctx.lineWidth = l.w;
                ctx.beginPath(); ctx.arc(cx, cy, l.r, 0, Math.PI * 2); ctx.stroke();
            });
            ctx.restore();
            // Sleeping cat bobbing
            const bounce = Math.sin(t * Math.PI * 4) * 4;
            ctx.font = '30px "Segoe UI Emoji","Noto Color Emoji",sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('🐱', cx, cy + radius + 20 + bounce);
        } else {
            drawSimpleRing(ctx, cx, cy, radius, accentHex);
        }
    } else if (profileData?.frame_color) {
        if (frameImg) {
            const fsz = aSize + 28;
            ctx.drawImage(frameImg, cx - fsz / 2, cy - fsz / 2, fsz, fsz);
        } else {
            drawSimpleRing(ctx, cx, cy, radius, profileData.frame_color);
        }
    }

    // ── text panel ────────────────────────────────────────────────────────────
    const tX = aX + aSize + 40;
    const maxW = W - tX - 40;

    // Username
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
    ctx.font = 'bold 50px "Segoe UI", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';
    let uname = (user.username || 'USER').toUpperCase();
    while (ctx.measureText(uname).width > maxW && uname.length > 3) uname = uname.slice(0, -1);
    ctx.fillText(uname, tX, 40);
    ctx.restore();

    if (profileData?.title) {
        ctx.fillStyle = lightenHex(accentHex, 80) || '#a5b4fc';
        ctx.font = 'italic 20px "Segoe UI", sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(profileData.title, tX, 100);
    }

    // ── badges ────────────────────────────────────────────────────────────────
    if (profileData?.badges?.length > 0) {
        const bY = profileData.title ? 140 : 110;
        const bSize = 44, bGap = 12;
        let bX = tX;
        const deduped = [...new Map(profileData.badges.map(b => [b.id || b.icon, b])).values()].slice(0, 8);
        for (const badge of deduped) {
            const info = BADGE_MAP[badge.icon] || { emoji: '⭐', color: '#fbbf24', solid: '#78350f' };
            if (bX + bSize > W - 12) break;
            drawHexBadge(ctx, bX + bSize / 2, bY + bSize / 2, bSize / 2, info);
            bX += bSize + bGap;
        }
    }

    // ── XP bar ─────────────────────────────────────────────────────────────────
    if (levelData) {
        const bX = tX, bY = profileData?.badges?.length > 0 ? 210 : 160, bW = W - tX - 40, bH = 16;
        const nextXp = Math.max(1, (levelData.level + 1) * 200);
        const prog = Math.min(levelData.xp / nextXp, 1);

        ctx.shadowBlur = 0;
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#a1a1aa';
        ctx.font = '600 16px "Segoe UI", sans-serif';
        ctx.fillText(`LEVEL ${levelData.level}`, bX, bY - 8);

        ctx.textAlign = 'right';
        ctx.fillText(`${levelData.xp} / ${nextXp} XP`, bX + bW, bY - 8);

        // bar bg
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath(); ctx.roundRect(bX, bY, bW, bH, 8); ctx.fill();

        if (prog > 0) {
            // Pulsing glow on bar
            const glowPulse = 10 + Math.sin(t * Math.PI * 2) * 5;
            const barG = ctx.createLinearGradient(bX, 0, bX + bW, 0);
            barG.addColorStop(0, accentHex);
            barG.addColorStop(1, lightenHex(accentHex, 50));
            ctx.fillStyle = barG;
            ctx.shadowColor = accentHex;
            ctx.shadowBlur = glowPulse;
            ctx.beginPath(); ctx.roundRect(bX, bY, bW * prog, bH, 8); ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    // rep
    if (profileData?.rep) {
        ctx.textAlign = 'right'; ctx.textBaseline = 'top';
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 20px "Segoe UI", sans-serif';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 8;
        ctx.fillText(`⭐ ${profileData.rep} REP`, W - 40, 40);
        ctx.shadowBlur = 0;
    }
}

function drawDefaultBg(ctx, W, H) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#0b0c10');
    g.addColorStop(0.5, '#1a1b2e');
    g.addColorStop(1, '#0b0c10');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
}

// ─── Main export ─────────────────────────────────────────────────────────────
async function generateAnimatedProfileGif(user, levelData, profileData) {
    const W = 950, H = 320;
    const total = 40; // 2s @ 20fps

    const encoder = new GIFEncoder(W, H, 'octree', true, total);
    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(50); // 50ms = 20fps

    const canvas = Canvas.createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Preload images once
    let avatarImg = null;
    try {
        const url = user.displayAvatarURL({ extension: 'png', size: 512 });
        if (url && !url.includes('undefined') && !url.includes('null'))
            avatarImg = await Canvas.loadImage(url);
    } catch { /* fallback */ }

    let bgImg = null;
    if (!profileData?.bg_is_css && profileData?.profile_background_url) {
        try { bgImg = await Canvas.loadImage(profileData.profile_background_url); } catch { /* ignore */ }
    }

    let frameImg = null;
    if (!profileData?.frame_is_css && profileData?.frame_color?.startsWith('http')) {
        try { frameImg = await Canvas.loadImage(profileData.frame_color); } catch { /* ignore */ }
    }

    for (let f = 0; f < total; f++) {
        renderFrame(ctx, W, H, user, levelData, profileData, avatarImg, bgImg, frameImg, f, total);
        encoder.addFrame(ctx);
    }

    encoder.finish();
    return encoder.out.getData();
}

module.exports = { generateAnimatedProfileGif };
