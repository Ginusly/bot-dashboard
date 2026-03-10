const Canvas = require('canvas');

// Polyfill roundRect for older node-canvas versions if needed
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

// Canvas dimensions - MUST match WelcomeEditor CAN_W and CAN_H
const CAN_W = 700;
const CAN_H = 250;

const generateCanvasImage = async (member, backgroundUrl, configData) => {
    const canvas = Canvas.createCanvas(CAN_W, CAN_H);
    const ctx = canvas.getContext('2d');

    // Parse config
    let config = null;
    if (configData) {
        try {
            config = typeof configData === 'string' ? JSON.parse(configData) : configData;
        } catch (e) {
            console.error('[CANVAS] Failed to parse configData:', e.message);
        }
    }

    // ── Background ─────────────────────────────────────────────────────────────
    if (backgroundUrl) {
        try {
            const background = await Canvas.loadImage(backgroundUrl);
            ctx.drawImage(background, 0, 0, CAN_W, CAN_H);
        } catch (e) {
            console.error('[CANVAS] Failed to load background:', e.message);
            drawDefaultBackground(ctx);
        }
    } else {
        drawDefaultBackground(ctx);
    }

    // Dark overlay for readability
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, CAN_W, CAN_H);

    const elements = config?.elements;

    if (elements && elements.length > 0) {
        // Sort by layer (same as editor)
        const sorted = [...elements].sort((a, b) => (a.layer || 0) - (b.layer || 0));
        for (const el of sorted) {
            await renderElement(ctx, el, member);
        }
    } else {
        // Default layout when no custom config
        await renderDefaultWelcome(ctx, member);
    }

    return canvas.toBuffer('image/png');
};

function drawDefaultBackground(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, CAN_W, CAN_H);
    gradient.addColorStop(0, '#0b0c10');
    gradient.addColorStop(0.5, '#1a1b2e');
    gradient.addColorStop(1, '#0b0c10');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CAN_W, CAN_H);
}

async function renderElement(ctx, el, member) {
    // IMPORTANT: The editor uses top/left CSS positioning (DOM coordinates).
    // el.x = left (horizontal offset from canvas left)
    // el.y = top  (vertical offset from canvas top)
    // For avatar: the element's top-left corner is at (el.x, el.y), and it has a size of el.size
    // For text: the element starts at (el.x, el.y) top-left

    if (el.type === 'avatar') {
        const size = el.size || 80;
        const elX = el.x || 0;  // top-left X of the bounding box (from DOM)
        const elY = el.y || 0;  // top-left Y of the bounding box (from DOM)
        const padding = 4;      // same as DraggableItem padding in editor

        // Center of the circle = top-left + half size + padding offset
        const cx = elX + padding + size / 2;
        const cy = elY + padding + size / 2;
        const radius = size / 2;

        // Glow + border
        ctx.save();
        ctx.shadowColor = el.color || '#5865F2';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = el.color || '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Clip & draw avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        try {
            const avatar = await Canvas.loadImage(
                member.user.displayAvatarURL({ extension: 'png', size: 256 })
            );
            ctx.drawImage(avatar, cx - radius, cy - radius, size, size);
        } catch {
            ctx.fillStyle = '#5865F2';
            ctx.fillRect(cx - radius, cy - radius, size, size);
        }
        ctx.restore();

    } else {
        // Text element: el.x and el.y are top-left of the text bounding box
        const fontSize = el.fontSize || 30;
        const fontFamily = el.fontFamily || 'sans-serif';
        const fontWeight = el.fontWeight || 'bold';
        const align = el.align || 'left';
        const padding = 4; // same as DraggableItem padding

        ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;
        ctx.fillStyle = el.color || '#ffffff';
        ctx.textBaseline = 'top'; // align to top since el.y is the top of the element
        ctx.textAlign = align;

        // Compute X position for textAlign
        let drawX = el.x + padding;
        const textWidth = ctx.measureText(getTextContent(el, member)).width;
        if (align === 'center') {
            // For center align, canvas uses x as the center point
            // We need to shift so the text visually appears at el.x
            drawX = el.x + padding + textWidth / 2;
        } else if (align === 'right') {
            drawX = el.x + padding + textWidth;
        }

        const drawY = el.y + padding;

        // Shadow for readability
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 2;

        ctx.fillText(getTextContent(el, member), drawX, drawY);
        ctx.shadowColor = 'transparent';
    }
}

function getTextContent(el, member) {
    let text = el.content || '';

    if (el.type === 'username') {
        text = member.user.username;
    } else if (el.type === 'count') {
        text = `العضو رقم ${member.guild.memberCount}`;
    }

    // Variable substitution
    return text
        .replace(/{user}/g, member.user.username)
        .replace(/{count}/g, `${member.guild.memberCount}`)
        .replace(/{server}/g, member.guild.name);
}

async function renderDefaultWelcome(ctx, member) {
    // Nice centered default layout
    const avatarX = 125;
    const avatarY = CAN_H / 2;
    const avatarRadius = 75;

    // Avatar glow
    ctx.save();
    ctx.shadowColor = '#5865F2';
    ctx.shadowBlur = 24;
    ctx.strokeStyle = '#5865F2';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    try {
        const avatar = await Canvas.loadImage(
            member.user.displayAvatarURL({ extension: 'png', size: 256 })
        );
        ctx.drawImage(avatar,
            avatarX - avatarRadius, avatarY - avatarRadius,
            avatarRadius * 2, avatarRadius * 2
        );
    } catch {
        ctx.fillStyle = '#5865F2';
        ctx.fillRect(avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
    }
    ctx.restore();

    // Vertical divider
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(230, 35);
    ctx.lineTo(230, CAN_H - 35);
    ctx.stroke();

    // Text block (right side)
    const textX = CAN_W - 36;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;

    // "مرحباً بك"
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('مرحباً بك في', textX, avatarY - 60);

    // Server name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(member.guild.name, textX, avatarY - 20);

    // Username
    ctx.fillStyle = '#7289DA';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`@${member.user.username}`, textX, avatarY + 22);

    // Member count
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '17px sans-serif';
    ctx.fillText(`العضو رقم ${member.guild.memberCount}`, textX, avatarY + 64);

    ctx.shadowColor = 'transparent';
}

async function generateWalletImage(user, orbs) {
    const W = 600, H = 340;
    const canvas = Canvas.createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // 1. Draw glowing gradient background (acts as the border)
    const borderGrad = ctx.createLinearGradient(0, 0, W, H);
    borderGrad.addColorStop(0, '#22d3ee'); // cyan
    borderGrad.addColorStop(0.5, '#d946ef'); // pink
    borderGrad.addColorStop(1, '#3b82f6'); // blue
    ctx.fillStyle = borderGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 24);
    ctx.fill();

    // 2. Inner Black Card (leaves a 4px border)
    const innerW = W - 8;
    const innerH = H - 8;
    const innerX = 4;
    const innerY = 4;

    ctx.save();
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#1c1c1e'); // super dark gray
    bgGrad.addColorStop(1, '#18181b'); // almost black
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(innerX, innerY, innerW, innerH, 21);
    ctx.fill();
    ctx.clip(); // Ensure content doesn't bleed over the border

    // Background floating soft glows (subtle pattern)
    ctx.fillStyle = 'rgba(217, 70, 239, 0.05)';
    ctx.beginPath();
    ctx.arc(W - 50, 50, 150, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(34, 211, 238, 0.05)';
    ctx.beginPath();
    ctx.arc(50, H - 50, 150, 0, Math.PI * 2);
    ctx.fill();

    // 3. Top Left: Avatar
    const avatarSize = 64;
    const avatarX = 35;
    const avatarY = 35;
    try {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 14);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.clip();

        const avatar = await Canvas.loadImage(
            user.displayAvatarURL({ extension: 'png', size: 128 }).replace('webp', 'png')
        );
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
    } catch (e) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 14);
        ctx.fill();
    }

    // Name text
    ctx.fillStyle = '#a1a1aa'; // slate-400
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('HOLDER', 115, 55);

    ctx.fillStyle = '#f4f4f5'; // zinc-50
    ctx.font = 'bold 22px sans-serif';
    const cleanName = (user.username || 'UNKNOWN').toUpperCase();
    ctx.fillText(cleanName.substring(0, 16), 115, 85);

    // 4. Middle Section: Balance (Prominent like Supercell 680 PTS)
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Draw Orbs Value in pinkish gradient
    const balanceText = orbs.toLocaleString();
    const balGrad = ctx.createLinearGradient(0, H / 2 - 30, 0, H / 2 + 30);
    balGrad.addColorStop(0, '#fdf4ff'); // very light pink
    balGrad.addColorStop(1, '#f0abfc'); // solid pink
    ctx.fillStyle = balGrad;
    ctx.font = 'bold 72px monospace';
    // Add shadow
    ctx.shadowColor = 'rgba(217, 70, 239, 0.4)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
    ctx.fillText(balanceText, 35, 230);
    ctx.shadowColor = 'transparent';

    // Draw "ORB" (like PTS)
    const balWidth = ctx.measureText(balanceText).width;
    ctx.fillStyle = '#e0e7ff'; // light blue/white
    ctx.font = 'bold 44px monospace';
    ctx.fillText('ORB', 35 + balWidth + 15, 230);

    // 5. Bottom left: User ID
    ctx.fillStyle = '#f4f4f5';
    ctx.font = 'bold 22px monospace';
    ctx.letterSpacing = '2px';
    ctx.fillText((user.id || 'UNKNOWN').substring(0, 10), 35, H - 35);

    // 6. Bottom Right: "ID" badge
    const badgeW = 60, badgeH = 40;
    const badgeX = W - badgeW - 35;
    const badgeY = H - badgeH - 30;

    ctx.fillStyle = '#f4f4f5';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 10);
    ctx.fill();

    ctx.fillStyle = '#18181b';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ID', badgeX + badgeW / 2, badgeY + badgeH / 2 + 2);

    ctx.restore(); // restore clipping

    return canvas.toBuffer('image/png');
}

async function generateProfileImage(user, levelData, profileData) {
    const W = 950, H = 320;
    const canvas = Canvas.createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // ── 1. Background ────────────────────────────────────────────────────────
    if (profileData?.bg_name === 'Black Hole Horizon') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);
        ctx.beginPath(); ctx.ellipse(W / 2, H / 2, 400, 100, -15 * Math.PI / 180, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(234, 88, 12, 0.4)'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(W / 2, H / 2, 100, 300, 75 * Math.PI / 180, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.3)'; ctx.fill();
        ctx.beginPath(); ctx.arc(W / 2, H / 2, 100, 0, 2 * Math.PI);
        ctx.fillStyle = '#000'; ctx.shadowColor = '#ea580c'; ctx.shadowBlur = 30;
        ctx.fill(); ctx.shadowBlur = 0;
    } else if (profileData?.bg_name === 'Neon Grid Skyline') {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
        skyGrad.addColorStop(0, '#1e1b4b'); skyGrad.addColorStop(0.5, '#c026d3'); skyGrad.addColorStop(1, '#000');
        ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, H);
        const sunGrad = ctx.createLinearGradient(W / 2, H * 0.1, W / 2, H * 0.4);
        sunGrad.addColorStop(0, '#facc15'); sunGrad.addColorStop(1, '#e11d48');
        ctx.beginPath(); ctx.arc(W / 2, H * 0.25, 60, 0, 2 * Math.PI);
        ctx.fillStyle = sunGrad; ctx.fill();
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.3)'; ctx.lineWidth = 2;
        for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, H / 2); ctx.lineTo(i - W / 2, H); ctx.stroke(); }
        for (let j = H / 2; j < H; j += 20) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(W, j); ctx.stroke(); }
    } else if (profileData?.profile_background_url) {
        try {
            const bg = await Canvas.loadImage(profileData.profile_background_url);
            const scale = Math.max(W / bg.width, H / bg.height);
            const bx = (W - bg.width * scale) / 2;
            const by = (H - bg.height * scale) / 2;
            ctx.drawImage(bg, bx, by, bg.width * scale, bg.height * scale);
        } catch {
            drawDefaultBackground(ctx);
        }
    } else {
        drawDefaultBackground(ctx);
    }

    // Modern Glassmorphism Overlay
    // A dark blurry-like overlay on the right side
    const gradientOverlay = ctx.createLinearGradient(0, 0, W, 0);
    gradientOverlay.addColorStop(0, 'rgba(0,0,0,0.85)');
    gradientOverlay.addColorStop(0.4, 'rgba(0,0,0,0.7)');
    gradientOverlay.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = gradientOverlay;
    ctx.fillRect(0, 0, W, H);

    // Accent line (Top and Bottom)
    const accentColor = (profileData?.frame_color && !profileData.frame_color.startsWith('http'))
        ? profileData.frame_color : '#5865F2';
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, 0, W, 6);
    ctx.fillRect(0, H - 6, W, 6);

    // ── 2. Avatar ─────────────────────────────────────────────────────────────
    const aSize = 180, aX = 40, aY = (H - aSize) / 2;
    const cx = aX + aSize / 2;
    const cy = aY + aSize / 2;
    const radius = aSize / 2;

    // Outer subtle glow
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Clip & draw avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    try {
        const avatar = await Canvas.loadImage(user.displayAvatarURL({ extension: 'png', size: 512 }));
        ctx.drawImage(avatar, aX, aY, aSize, aSize);
    } catch {
        ctx.fillStyle = '#1c1c1f';
        ctx.fillRect(aX, aY, aSize, aSize);
    }
    ctx.restore();

    // ── Frame on top of avatar ─────────────────────────────────────────────
    if (profileData?.frame_name === 'Fire Sword') {
        const fsz = aSize + 40;
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#ea580c'; ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.arc(cx, cy, radius + 5, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;
        // Draw sword representation roughly
        ctx.save();
        ctx.translate(cx + radius * 0.8, cy - radius * 0.8);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-10, -50, 20, 100);
        ctx.fillStyle = '#fbbf24'; ctx.fillRect(-25, 30, 50, 10);
        ctx.fillStyle = '#78350f'; ctx.fillRect(-5, 40, 10, 30);
        ctx.fillStyle = '#ec4899'; ctx.beginPath(); ctx.arc(0, 35, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    } else if (profileData?.frame_name === 'Celestial Portal') {
        // Glowing portal rings
        ctx.save();
        ctx.shadowColor = '#3b82f6'; ctx.shadowBlur = 20;
        const pGrad = ctx.createConicGradient(0, cx, cy);
        pGrad.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
        pGrad.addColorStop(0.5, '#8b5cf6');
        pGrad.addColorStop(1, 'rgba(59, 130, 246, 0.1)');
        ctx.strokeStyle = pGrad;
        ctx.lineWidth = 14;
        ctx.beginPath(); ctx.arc(cx, cy, radius + 7, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    } else if (profileData?.frame_name === 'Sakura Whisper') {
        ctx.strokeStyle = '#fbcfe8';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2); ctx.stroke();
        ctx.font = '32px "Segoe UI Emoji", sans-serif';
        ctx.fillText('🌸', cx - radius - 15, cy - radius + 10);
        ctx.fillText('🌸', cx + radius - 10, cy + radius - 10);
        ctx.fillText('🌸', cx + radius + 10, cy - 20);
        ctx.font = '24px "Segoe UI Emoji", sans-serif';
        ctx.fillText('🍃', cx - radius + 20, cy + radius + 10);
    } else if (profileData?.frame_color) {
        if (profileData.frame_color.startsWith('http')) {
            try {
                const fi = await Canvas.loadImage(profileData.frame_color);
                const fsz = aSize + 40;
                ctx.drawImage(fi, cx - fsz / 2, cy - fsz / 2, fsz, fsz);
            } catch {
                drawSimpleFrame(ctx, cx, cy, radius, '#5865F2');
            }
        } else {
            drawSimpleFrame(ctx, cx, cy, radius, profileData.frame_color);
        }
    } else {
        // Default clean thin ring
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2); ctx.stroke();
    }

    // ── 3. Profile Info ────────────────────────────────────────────────────────
    const textX = aX + aSize + 40;
    const maxTextW = W - textX - 40;

    // Username
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
    ctx.font = 'bold 50px "Segoe UI", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';
    let uname = (user.username || 'User').toUpperCase();
    while (ctx.measureText(uname).width > maxTextW && uname.length > 3) uname = uname.slice(0, -1);
    ctx.fillText(uname, textX, 40);
    ctx.restore();

    // Title / Subtitle tag
    if (profileData?.title) {
        ctx.fillStyle = lightenColor(accentColor, 80) || '#a5b4fc';
        ctx.font = 'italic 20px "Segoe UI", sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(profileData.title, textX, 100);
    }

    // ── Badges ─────────────────────────────────────────────────────
    const seenBadges = new Set();
    const uniqueBadges = (profileData?.badges || []).filter(b => {
        const key = b.icon + (b.name || '');
        if (seenBadges.has(key)) return false;
        seenBadges.add(key);
        return true;
    }).slice(0, 8);

    if (uniqueBadges.length > 0) {
        let badgeX = textX;
        const badgeY = profileData?.title ? 140 : 110;
        const bSize = 44, bGap = 12;

        for (const badge of uniqueBadges) {
            const bcx = badgeX + bSize / 2, bcy = badgeY + bSize / 2, br = bSize / 2;
            const badgeColor = badge.color || '#fbbf24';
            const badgeIcon = badge.icon || '⭐';

            // Glow and Hexagon background for badge
            ctx.save();
            ctx.shadowColor = badgeColor;
            ctx.shadowBlur = 15;
            ctx.fillStyle = badgeColor + '22';
            ctx.strokeStyle = badgeColor;
            ctx.lineWidth = 2.5;

            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                const x = bcx + br * Math.cos(angle);
                const y = bcy + br * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = '22px "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

            if (badge.icon && badge.icon.startsWith('http')) {
                try {
                    const iconImg = await Canvas.loadImage(badge.icon);
                    ctx.drawImage(iconImg, bcx - 14, bcy - 14, 28, 28);
                } catch {
                    ctx.fillText(badgeIcon, bcx, bcy + 2);
                }
            } else {
                ctx.fillText(badgeIcon, bcx, bcy + 2);
            }
            ctx.restore();
            badgeX += bSize + bGap;
        }
    }

    // ── 4. Level/XP Bar ─────────────────────────────────────────────────────
    if (levelData) {
        const barY = profileData?.badges?.length > 0 ? 210 : 160;
        const barW = W - textX - 40;
        const barH = 16;
        const currentXp = levelData.xp || 0;
        const xpForNext = (levelData.level + 1) * 100;
        const progress = Math.min(currentXp / xpForNext, 1);

        // Text Info above bar
        ctx.fillStyle = '#a1a1aa';
        ctx.font = '600 16px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`LEVEL ${levelData.level}`, textX, barY - 25);

        ctx.textAlign = 'right';
        ctx.fillText(`${currentXp} / ${xpForNext} XP`, textX + barW, barY - 25);

        // Bar Track
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.roundRect(textX, barY, barW, barH, 8);
        ctx.fill();

        // Progress Bar
        if (progress > 0) {
            ctx.save();
            const xpGrad = ctx.createLinearGradient(textX, 0, textX + barW * progress, 0);
            xpGrad.addColorStop(0, accentColor);
            xpGrad.addColorStop(1, lightenColor(accentColor, 40));
            ctx.fillStyle = xpGrad;
            ctx.shadowColor = accentColor;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.roundRect(textX, barY, barW * progress, barH, 8);
            ctx.fill();
            ctx.restore();
        }
    }

    // ── 5. Reputation ───────────────────────────────────────────────────────
    if (profileData?.rep !== undefined) {
        const repY = H - 40; // Bottom left corner ish
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 20px "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 8;
        ctx.fillText(`⭐ ${profileData.rep} REP`, W - 40, 40);
        ctx.shadowBlur = 0;
    }

    return canvas.toBuffer('image/png');
}

function drawSimpleFrame(ctx, cx, cy, radius, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 7, 0, Math.PI * 2);
    ctx.stroke();
}

function lightenColor(col, amt) {
    if (!col || !col.startsWith('#')) return col;
    let num = parseInt(col.slice(1), 16);
    let r = Math.min(255, (num >> 16) + amt);
    let g = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    let b = Math.min(255, (num & 0x0000FF) + amt);
    return "#" + (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
}

module.exports = { generateCanvasImage, generateWalletImage, generateProfileImage };
