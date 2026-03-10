const Canvas = require('canvas');
const path = require('path');

// Register custom font if you have one, otherwise use system fonts
// Canvas.registerFont(path.join(__dirname, 'fonts/Roboto-Bold.ttf'), { family: 'Roboto' });

const generateWelcomeImage = async (member, backgroundUrl, welcomeData = null) => {
    const canvas = Canvas.createCanvas(700, 250);
    const ctx = canvas.getContext('2d');

    // Parse welcomeData if it's a string
    let config = null;
    if (welcomeData) {
        try {
            config = typeof welcomeData === 'string' ? JSON.parse(welcomeData) : welcomeData;
        } catch (e) {
            console.error('[WELCOME] Failed to parse welcomeData', e);
        }
    }

    // Load Background
    let background;
    if (backgroundUrl) {
        try {
            background = await Canvas.loadImage(backgroundUrl);
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        } catch (e) {
            ctx.fillStyle = '#23272A';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    } else {
        ctx.fillStyle = '#23272A';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If no config, use default layout
    if (!config || !config.elements) {
        // Draw Default Border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // Default Avatar (Left)
        const avatarX = 125, avatarY = 125, radius = 80;
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        try {
            const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ extension: 'jpg' }));
            ctx.drawImage(avatar, avatarX - radius, avatarY - radius, radius * 2, radius * 2);
        } catch (e) {
            ctx.fillStyle = '#7289DA';
            ctx.fillRect(avatarX - radius, avatarY - radius, radius * 2, radius * 2);
        }
        ctx.restore();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, radius, 0, Math.PI * 2, true);
        ctx.stroke();

        // Default Text (Right)
        ctx.font = 'bold 50px sans-serif';
        ctx.fillStyle = '#F0B232';
        ctx.textAlign = 'center';
        ctx.fillText('WELCOME', 450, 100);

        ctx.font = 'bold 40px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(member.user.username, 450, 150);

        ctx.font = '25px sans-serif';
        ctx.fillStyle = '#cccccc';
        ctx.fillText(`Member #${member.guild.memberCount}`, 450, 190);
    } else {
        // Render Custom Elements
        for (const el of config.elements) {
            if (el.type === 'avatar') {
                const radius = el.size || 80;
                ctx.save();
                ctx.beginPath();
                ctx.arc(el.x, el.y, radius, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();
                try {
                    const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ extension: 'jpg' }));
                    ctx.drawImage(avatar, el.x - radius, el.y - radius, radius * 2, radius * 2);
                } catch (e) {
                    ctx.fillStyle = '#7289DA';
                    ctx.fillRect(el.x - radius, el.y - radius, radius * 2, radius * 2);
                }
                ctx.restore();
                // Border
                ctx.strokeStyle = el.color || '#ffffff';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(el.x, el.y, radius, 0, Math.PI * 2, true);
                ctx.stroke();
            } else if (el.type === 'text' || el.type === 'username' || el.type === 'count') {
                ctx.font = `bold ${el.fontSize || 40}px sans-serif`;
                ctx.fillStyle = el.color || '#ffffff';
                ctx.textAlign = el.align || 'center';

                let text = el.content || '';
                if (el.type === 'username') text = member.user.username;
                if (el.type === 'count') text = `Member #${member.guild.memberCount}`;

                ctx.fillText(text, el.x, el.y);
            }
        }
    }

    return canvas.toBuffer();
};

return canvas.toBuffer();
};

module.exports = { generateWelcomeImage };
