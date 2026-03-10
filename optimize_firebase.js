const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, deleteField } = require('firebase/firestore');
const firebaseConfig = {
    apiKey: "AIzaSyCGhsF-nlCsK2FFtcxccUdlezUSOxBVnxU",
    authDomain: "umbralbot-734bd.firebaseapp.com",
    projectId: "umbralbot-734bd",
    storageBucket: "umbralbot-734bd.firebasestorage.app",
    messagingSenderId: "303425465602",
    appId: "1:303425465602:web:d4bbdd818e14e60c87661b",
    measurementId: "G-KSNV16NTFR"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function optimizeFirebaseSpace() {
    console.log('[FIREBASE OPTIMIZER] Starting storage optimization process...');

    // 1. Optimize levels (remove last_message_date & updated_at)
    const levelsSnap = await getDocs(collection(db, 'levels'));
    let levelsOptimized = 0;
    const levelPromises = levelsSnap.docs.map(async (d) => {
        const data = d.data();
        const updates = {};
        if (data.last_message_date) updates.last_message_date = deleteField();
        if (data.updated_at) updates.updated_at = deleteField();

        if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, 'levels', d.id), updates);
            levelsOptimized++;
        }
    });

    // 2. Optimize economy (remove updated_at)
    const economySnap = await getDocs(collection(db, 'economy'));
    let economyOptimized = 0;
    const economyPromises = economySnap.docs.map(async (d) => {
        const data = d.data();
        const updates = {};
        if (data.updated_at) updates.updated_at = deleteField();

        if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, 'economy', d.id), updates);
            economyOptimized++;
        }
    });

    try {
        await Promise.all([...levelPromises, ...economyPromises]);
        console.log(`[FIREBASE OPTIMIZER] Optimization completed!`);
        console.log(`- Levels Documents optimized: ${levelsOptimized}/${levelsSnap.size}`);
        console.log(`- Economy Documents optimized: ${economyOptimized}/${economySnap.size}`);
        console.log(`Firebase data size successfully minimized.`);
    } catch (err) {
        console.error('Error during optimization:', err);
    }
}

optimizeFirebaseSpace().then(() => process.exit(0)).catch(() => process.exit(1));
