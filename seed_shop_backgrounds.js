const firebase = require('./shared/firebase');

// High quality, free-to-use images for backgrounds
const backgrounds = [
    {
        name: 'Cyberpunk City',
        type: 'background',
        price: 1500,
        image_url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=900&q=80',
        description: 'مدينة مضيئة بألوان النيون في عالم السايبرب'
    },
    {
        name: 'Galaxy Nebula',
        type: 'background',
        price: 2000,
        image_url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=900&q=80',
        description: 'سديم كوني بألوان البنفسجي والزرقاء'
    },
    {
        name: 'Aurora Borealis',
        type: 'background',
        price: 2500,
        image_url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=900&q=80',
        description: 'الشفق القطبي الشمالي الساحر'
    },
    {
        name: 'Dark Forest',
        type: 'background',
        price: 800,
        image_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=900&q=80',
        description: 'غابة مظلمة غامضة وهادئة'
    },
    {
        name: 'Ocean Sunset',
        type: 'background',
        price: 1000,
        image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80',
        description: 'غروب الشمس فوق المحيط الهادي'
    },
    {
        name: 'Neon Tokyo',
        type: 'background',
        price: 3000,
        image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=900&q=80',
        description: 'شوارع طوكيو بالليل بنيونها الساطع'
    },
    {
        name: 'Mountain Snow',
        type: 'background',
        price: 600,
        image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=80',
        description: 'قمة جبل مغطاة بالثلج'
    },
    {
        name: 'Purple Storm',
        type: 'background',
        price: 1800,
        image_url: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=900&q=80',
        description: 'عاصفة بنفسجية في السماء'
    }
];

// Frames with proper images (if any have URLs, else keep them as colors)
const frames = [
    {
        name: 'إطار الذهب (Gold)',
        type: 'frame',
        price: 10000,
        image_url: '#ffd700',
        is_css: true,
        css_content: `
            <div style="width:100%; height:100%; border-radius:50%; border: 6px solid #fbbf24; position: relative; box-shadow: 0 0 10px #f59e0b, inset 0 0 15px #d97706; background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(217, 119, 6, 0)); overflow: hidden;">
                <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: linear-gradient(45deg, transparent, rgba(255,255,255,0.8), transparent); transform: rotate(45deg); animation: goldShine 3s infinite;"></div>
            </div>
            <style>@keyframes goldShine { 0% { top: -100%; left: -100%; } 100% { top: 100%; left: 100%; } }</style>
        `,
        description: 'إطار ذهبي لامع مع تأثير بريق فخم'
    },
    {
        name: 'إطار الماس (Diamond)',
        type: 'frame',
        price: 25000,
        image_url: '#67e8f9',
        is_css: true,
        css_content: `
            <div style="width:100%; height:100%; border-radius:50%; border: 4px solid #a5f3fc; position: relative; box-shadow: 0 0 20px #22d3ee, inset 0 0 20px #06b6d4; background: rgba(165, 243, 252, 0.1);">
                <div style="position: absolute; inset: 2px; border: 2px dashed #cffafe; border-radius: 50%; opacity: 0.8; animation: diamondSpin 10s linear infinite;"></div>
                <div style="position: absolute; top: 10%; right: 10%; width: 6px; height: 6px; background: white; border-radius: 50%; box-shadow: 0 0 8px white; animation: starBlink 1.5s infinite alternate;"></div>
                <div style="position: absolute; bottom: 15%; left: 5%; width: 4px; height: 4px; background: white; border-radius: 50%; box-shadow: 0 0 6px white; animation: starBlink 2s infinite alternate;"></div>
            </div>
            <style>
                @keyframes diamondSpin { to { transform: rotate(360deg); } }
                @keyframes starBlink { from { opacity: 0.2; transform: scale(0.5); } to { opacity: 1; transform: scale(1.5); } }
            </style>
        `,
        description: 'إطار ماسي ناصع ومتلألئ'
    },
    {
        name: 'إطار الأرجواني (Purple)',
        type: 'frame',
        price: 8000,
        image_url: '#a855f7',
        is_css: true,
        css_content: `
            <div style="width:100%; height:100%; border-radius:50%; border: 5px solid #d8b4fe; position: relative; box-shadow: 0 0 15px #a855f7, inset 0 0 10px #9333ea;">
                <div style="position: absolute; inset: -4px; border: 2px solid #e9d5ff; border-radius: 50%; filter: blur(3px); animation: purplePulse 2s infinite alternate;"></div>
            </div>
            <style>@keyframes purplePulse { from { transform: scale(0.98); opacity: 0.7; } to { transform: scale(1.05); opacity: 1; } }</style>
        `,
        description: 'إطار بنفسجي ملكي نابض بالجمال'
    },
    {
        name: 'إطار النار (Fire)',
        type: 'frame',
        price: 15000,
        image_url: '#f97316',
        is_css: true,
        css_content: `
            <div style="width:100%; height:100%; border-radius:50%; border: 4px solid #f97316; position: relative; box-shadow: 0 0 15px #ef4444, inset 0 0 10px #dc2626;">
                <div style="position: absolute; inset: -6px; border: 3px solid transparent; border-top-color: #fbbf24; border-bottom-color: #f87171; border-radius: 50%; animation: fireSpinFast 1s linear infinite;"></div>
            </div>
            <style>@keyframes fireSpinFast { to { transform: rotate(360deg); } }</style>
        `,
        description: 'إطار ناري ملتهب سريع الدوران'
    },
    {
        name: 'إطار الزمرد (Emerald)',
        type: 'frame',
        price: 12000,
        image_url: '#10b981',
        is_css: true,
        css_content: `
            <div style="width:100%; height:100%; border-radius:50%; border: 6px solid #34d399; position: relative; box-shadow: 0 0 15px #10b981; background: radial-gradient(circle, transparent 60%, rgba(16, 185, 129, 0.2) 100%);">
                <div style="position: absolute; inset: 2px; border: 2px dotted #6ee7b7; border-radius: 50%; animation: emeraldSpin 8s linear infinite reverse;"></div>
            </div>
            <style>@keyframes emeraldSpin { to { transform: rotate(360deg); } }</style>
        `,
        description: 'إطار زمردي أخضر مشع'
    }
];

async function seed() {
    console.log('--- جاري تحديث المتجر (خلفيات + إطارات) ---');
    const colRef = firebase.collection(firebase.db, 'shop_items');

    // Add backgrounds
    for (const item of backgrounds) {
        const q = firebase.query(colRef, firebase.where('name', '==', item.name));
        const snap = await firebase.getDocs(q);

        if (snap.empty) {
            await firebase.addDoc(colRef, { ...item, created_at: new Date() });
            console.log(`✅ خلفية جديدة: ${item.name}`);
        } else {
            // Update image_url if missing
            const docRef = snap.docs[0].ref;
            const existing = snap.docs[0].data();
            if (!existing.image_url || !existing.image_url.startsWith('http')) {
                await firebase.setDoc(docRef, { image_url: item.image_url }, { merge: true });
                console.log(`🔄 تحديث صورة: ${item.name}`);
            } else {
                console.log(`ℹ️ موجود: ${item.name}`);
            }
        }
    }

    // Add frames
    for (const item of frames) {
        const q = firebase.query(colRef, firebase.where('name', '==', item.name));
        const snap = await firebase.getDocs(q);
        if (snap.empty) {
            await firebase.addDoc(colRef, { ...item, created_at: new Date() });
            console.log(`✅ إطار جديد: ${item.name}`);
        }
    }

    console.log('--- المتجر أصبح جاهزاً وكاملاً! ---');
    process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
