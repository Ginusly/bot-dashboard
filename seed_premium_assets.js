const firebase = require('./shared/firebase');

const premiumItems = [
    // Backgrounds - Image
    { name: 'Nebula Dream', type: 'background', price: 15000, image_url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000' },
    { name: 'Cyber City', type: 'background', price: 20000, image_url: 'https://images.unsplash.com/photo-1605142859862-978be7eba909?q=80&w=1000' },

    // Backgrounds - CSS Design
    {
        name: 'Matrix Rain', type: 'background', price: 30000,
        is_css: true,
        css_content: `<div style="width:100%; height:100%; background: black; background-image: radial-gradient(circle, rgba(0,255,0,0.2) 10%, transparent 10%), radial-gradient(circle, rgba(0,255,0,0.2) 10%, transparent 10%); background-size: 20px 20px; background-position: 0 0, 10px 10px; animation: matrixMove 5s linear infinite;"></div><style>@keyframes matrixMove { from { background-position: 0 0, 10px 10px; } to { background-position: 0 100%, 10px calc(100% + 10px); } }</style>`
    },
    {
        name: 'Aurora Borealis', type: 'background', price: 35000,
        is_css: true,
        css_content: `<div style="width:100%; height:100%; background: linear-gradient(120deg, #10b981, #3b82f6, #8b5cf6, #10b981); background-size: 300% 300%; animation: aurora 8s ease infinite;"></div><style>@keyframes aurora { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }</style>`
    },

    // Frames - Color
    { name: 'Golden Glow', type: 'frame', price: 10000, image_url: '#fbbf24' },
    { name: 'Neon Purple', type: 'frame', price: 12000, image_url: '#a855f7' },

    // Frames - CSS Design (Animated or complex)
    {
        name: 'Fire Ring', type: 'frame', price: 25000,
        is_css: true,
        css_content: `<div style="position:absolute; top:-4px; left:-4px; right:-4px; bottom:-4px; border-radius:50%; background: conic-gradient(from 0deg, #ff4500, #ff8c00, #ffd700, #ff4500); animation: spinFire 2s linear infinite; padding: 4px; box-sizing: border-box; -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: destination-out; mask-composite: exclude;"></div><style>@keyframes spinFire { 100% { transform: rotate(360deg); } }</style>`
    },
    {
        name: 'Cosmic Halo', type: 'frame', price: 40000,
        is_css: true,
        css_content: `<div style="position:absolute; top:-4px; left:-4px; width:calc(100% + 8px); height:calc(100% + 8px); border-radius:50%; border: 4px solid transparent; background-image: linear-gradient(black, black), conic-gradient(from 0deg, #3b82f6, #d946ef, #3b82f6); background-origin: border-box; background-clip: content-box, border-box; animation: cosmicSpin 4s linear infinite;"></div><style>@keyframes cosmicSpin { 100% { transform: rotate(360deg); } }</style>`
    },

    // Badges
    { name: 'MVP', type: 'badge', price: 50000, icon: 'Trophy' },
    { name: 'VIP', type: 'badge', price: 100000, icon: 'Crown' },
    { name: 'Legend', type: 'badge', price: 500000, icon: 'Gem' }
];

async function seed() {
    console.log('--- Adding Premium Assets ---');
    const colRef = firebase.collection(firebase.db, 'shop_items');

    for (const item of premiumItems) {
        const q = firebase.query(colRef, firebase.where('name', '==', item.name));
        const snap = await firebase.getDocs(q);

        if (snap.empty) {
            await firebase.addDoc(colRef, {
                ...item,
                created_at: new Date()
            });
            console.log(`✅ Added: ${item.name}`);
        } else {
            console.log(`ℹ️ Already exists: ${item.name}`);
        }
    }
    console.log('--- Finished ---');
    process.exit(0);
}

seed();
