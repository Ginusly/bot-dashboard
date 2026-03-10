const newItems = [
    // --- Official Vibe Frames ---
    {
        name: 'Fire Sword',
        type: 'frame',
        price: 50000,
        image_url: '#f97316',
        is_css: true,
        css_content: `
            <div style="width:100%; height:100%; position: relative; pointer-events: none; z-index: 10;">
                <!-- Glowing Aura -->
                <div style="position: absolute; inset: 0%; border-radius: 50%; box-shadow: 0 0 15px #f97316, inset 0 0 20px #ea580c; border: 4px solid rgba(249, 115, 22, 0.4); animation: firePulse 2s infinite alternate;"></div>
                
                <!-- Rotating Fire Ring -->
                <div style="position: absolute; inset: -4%; border-radius: 50%; border: 3px solid transparent; border-top-color: #fbbf24; border-bottom-color: #ef4444; animation: spinRing 3s linear infinite;"></div>

                <!-- Magical Sword Graphic -->
                <svg viewBox="0 0 100 100" style="position: absolute; top: -15%; right: -15%; width: 50%; height: 50%; filter: drop-shadow(0 0 10px #f97316); transform: rotate(15deg);">
                    <path d="M20 80 L80 20 L85 25 L25 85 Z" fill="#e2e8f0"/>
                    <path d="M20 80 L80 20 L75 15 L15 75 Z" fill="#94a3b8"/>
                    <!-- Crossguard -->
                    <rect x="25" y="70" width="25" height="6" transform="rotate(-45 37 73)" fill="#fbbf24" stroke="#b45309" stroke-width="0.5"/>
                    <rect x="25" y="70" width="25" height="6" transform="rotate(45 37 73)" fill="#fbbf24" stroke="#b45309" stroke-width="0.5"/>
                    <!-- Handle & Pommel -->
                    <path d="M15 85 L5 95 L10 100 L20 90 Z" fill="#78350f"/>
                    <circle cx="8" cy="92" r="4" fill="#fbbf24"/>
                    <!-- Center Gem -->
                    <circle cx="37" cy="73" r="3" fill="#ec4899" filter="drop-shadow(0 0 4px #ec4899)"/>
                </svg>

                <div style="position: absolute; bottom: 5%; left: 0%; font-size: 24px; filter: blur(1px); animation: floatUpPath 2s infinite ease-out;">🔥</div>
                <div style="position: absolute; top: 10%; left: -5%; font-size: 16px; animation: floatUpPath 2.5s infinite ease-out 1s;">✨</div>
            </div>
            <style>
                @keyframes firePulse { 0% { box-shadow: 0 0 15px #f97316, inset 0 0 10px #ea580c; } 100% { box-shadow: 0 0 25px #fbbf24, inset 0 0 20px #ef4444; } }
                @keyframes spinRing { 100% { transform: rotate(360deg); } }
                @keyframes floatUpPath { 0% { transform: translateY(10px) scale(0.8); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(-30px) scale(1.2); opacity: 0; } }
            </style>
        `,
        description: 'سيف اللهب الأسطوري: إطار ناري متوهج يطوق صورتك'
    },
    {
        name: 'Celestial Portal',
        type: 'frame',
        price: 45000,
        image_url: '#3b82f6',
        is_css: true,
        css_content: `
            <div style="width:100%; height:100%; position: relative; pointer-events: none; z-index: 10; border-radius: 50%;">
                <div style="position: absolute; inset: -4%; border-radius: 50%; box-shadow: 0 0 20px #3b82f6, inset 0 0 20px #60a5fa; opacity: 0.8; animation: portalPulse 2s infinite alternate;"></div>
                <div style="position: absolute; inset: -5%; border-radius: 50%; background: conic-gradient(from 0deg, transparent, #8b5cf6, #3b82f6, transparent 70%); animation: spinRing 2s linear infinite; -webkit-mask-image: radial-gradient(transparent 58%, black 63%);"></div>
                <div style="position: absolute; inset: -8%; border-radius: 50%; background: conic-gradient(from 180deg, transparent, #c084fc, #60a5fa, transparent 80%); animation: spinRing 3s linear infinite reverse; -webkit-mask-image: radial-gradient(transparent 60%, black 65%);"></div>
                <!-- Stars -->
                <div style="position: absolute; top: 0; left: 15%; width: 4px; height: 4px; background: white; border-radius: 50%; box-shadow: 0 0 8px white; animation: twinkle 1s infinite alternate;"></div>
                <div style="position: absolute; bottom: 10%; right: 5%; width: 6px; height: 6px; background: #e0e7ff; border-radius: 50%; box-shadow: 0 0 10px white; animation: twinkle 1s infinite alternate 0.5s;"></div>
            </div>
            <style>
                @keyframes portalPulse { 0% { transform: scale(0.98); opacity: 0.6; } 100% { transform: scale(1.02); opacity: 1; } }
                @keyframes twinkle { 0% { opacity: 0.2; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1.5); } }
            </style>
        `,
        description: 'البوابة الكونية: دوامة لولبية تأخذك إلى أبعاد المجرة'
    },
    {
        name: 'Sakura Whisper',
        type: 'frame',
        price: 35000,
        image_url: '#ec4899',
        is_css: true,
        css_content: `
            <div style="width:100%; height:100%; position: relative; pointer-events: none; z-index: 10;">
                <div style="position: absolute; inset: 0%; border-radius: 50%; border: 3px solid rgba(244, 114, 182, 0.4); box-shadow: inset 0 0 15px rgba(236, 72, 153, 0.2);"></div>
                
                <!-- Flowers Overlapping -->
                <div style="position: absolute; top: -10%; left: -5%; font-size: 38px; transform: rotate(-20deg); filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.3));">🌸</div>
                <div style="position: absolute; bottom: -5%; left: 15%; font-size: 28px; transform: rotate(15deg); filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.3));">🌸</div>
                <div style="position: absolute; top: 30%; right: -12%; font-size: 32px; transform: rotate(45deg); filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.3));">�</div>
                
                <!-- Leaves -->
                <div style="position: absolute; bottom: 10%; right: 0%; font-size: 24px; transform: rotate(60deg);">🍃</div>
                
                <!-- Falling Petals -->
                <div style="position: absolute; inset: 0; overflow: visible; animation: fallPetals 8s linear infinite;">
                    <div style="position: absolute; top: -20%; left: 40%; font-size: 14px; color: #fdf2f8; filter: drop-shadow(0 0 2px #ec4899); animation: sway 3s infinite ease-in-out;">🌸</div>
                    <div style="position: absolute; top: 50%; right: -20%; font-size: 12px; color: #fdf2f8; animation: sway 4s infinite ease-in-out 1s;">�</div>
                </div>
            </div>
            <style>
                @keyframes fallPetals { 0% { transform: translateY(-20px) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(100px) rotate(180deg); opacity: 0; } }
                @keyframes sway { 0%, 100% { margin-left: -10px; } 50% { margin-left: 10px; } }
            </style>
        `,
        description: 'همس الساكورا: أزهار الكرز المتفتحة مع أوراق تتساقط برقة'
    },

    // --- Official Vibe Backgrounds ---
    {
        name: 'Black Hole Horizon',
        type: 'background',
        price: 55000,
        image_url: 'space-css',
        is_css: true,
        css_content: `
            <div style="width:100%; height:100%; background: #000; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                <!-- Glowing Accretion Disk -->
                <div style="position: absolute; width: 150%; height: 40%; border-radius: 50%; background: radial-gradient(ellipse, rgba(234, 88, 12, 0.8) 0%, rgba(249, 115, 22, 0) 70%); transform: rotate(-15deg); filter: blur(10px); animation: diskSpin 8s infinite linear;"></div>
                <div style="position: absolute; width: 40%; height: 150%; border-radius: 50%; background: radial-gradient(ellipse, rgba(251, 191, 36, 0.5) 0%, rgba(251, 191, 36, 0) 70%); transform: rotate(75deg); filter: blur(15px); mix-blend-mode: screen;"></div>
                
                <!-- Black Hole Core -->
                <div style="position: absolute; width: 35%; height: 50%; border-radius: 50%; background: #000; box-shadow: 0 0 30px #ea580c, inset 0 0 20px #000; z-index: 2;"></div>
            </div>
            <style>
                @keyframes diskSpin { 0% { transform: rotate(-15deg) scale(0.95); opacity: 0.8; } 50% { transform: rotate(-15deg) scale(1.05); opacity: 1; } 100% { transform: rotate(-15deg) scale(0.95); opacity: 0.8; } }
            </style>
        `,
        description: 'أفق الثقب الأسود: مشهد كوني مهيب مع قرص مزود متوهج'
    },
    {
        name: 'Neon Grid Skyline',
        type: 'background',
        price: 40000,
        image_url: 'cyber-css',
        is_css: true,
        css_content: `
            <div style="width:100%; height:100%; background: linear-gradient(180deg, #1e1b4b 0%, #312e81 40%, #c026d3 50%, #000 50%, #000 100%); position: relative; overflow: hidden;">
                <!-- Sun -->
                <div style="position: absolute; top: 15%; left: 50%; transform: translateX(-50%); width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(180deg, #facc15 0%, #e11d48 100%); box-shadow: 0 0 40px #e11d48;"></div>
                
                <!-- Moving 3D Grid -->
                <div style="position: absolute; bottom: 0; left: -50%; width: 200%; height: 50%; background-image: 
                    linear-gradient(rgba(236, 72, 153, 0.4) 2px, transparent 2px),
                    linear-gradient(90deg, rgba(236, 72, 153, 0.4) 2px, transparent 2px);
                    background-size: 100px 20px, 40px 100px;
                    transform: perspective(500px) rotateX(60deg);
                    animation: gridMove 2s linear infinite;">
                </div>
            </div>
            <style>
                @keyframes gridMove { 0% { background-position: 0 0; } 100% { background-position: 0 40px; } }
            </style>
        `,
        description: 'أفق السايبر نيون: شبكة إلكترونية وشمس غروب ريترو 80s'
    }
];

const firebase = require('./shared/firebase');

async function seed() {
    console.log('--- جاري استبدال إطارات الديسكورد وتحديث المتجر ---');
    const colRef = firebase.collection(firebase.db, 'shop_items');

    for (const item of newItems) {
        const q = firebase.query(colRef, firebase.where('name', '==', item.name));
        const snap = await firebase.getDocs(q);

        if (snap.empty) {
            await firebase.addDoc(colRef, { ...item, created_at: new Date() });
            console.log(`✅ تمت إضافة: ${item.name}`);
        } else {
            console.log(`🔄 تحديث بيانات: ${item.name}`);
            const docRef = snap.docs[0].ref;
            await firebase.setDoc(docRef, item, { merge: true });
        }
    }

    console.log('--- اكتمل! ---');
    process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });