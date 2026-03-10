/**
 * fix_duplicate_badges.js
 * Run this once to clean up duplicate badge entries in user_profiles.
 */
const firebase = require('./shared/firebase');

async function fix() {
    console.log('🔧 Fixing duplicate badges in user_profiles...');
    const colRef = firebase.collection(firebase.db, 'user_profiles');
    const snap = await firebase.getDocs(colRef);

    let fixed = 0;
    for (const doc of snap.docs) {
        const data = doc.data();
        const badges = data.badges;
        if (!Array.isArray(badges)) continue;

        const deduped = [...new Set(badges)];
        if (deduped.length !== badges.length) {
            console.log(`  Fixing user ${doc.id}: ${badges.length} → ${deduped.length} badges`);
            await firebase.setDoc(doc.ref, { badges: deduped }, { merge: true });
            fixed++;
        }
    }

    console.log(`✅ Fixed ${fixed} profiles.`);
    process.exit(0);
}

fix().catch(e => { console.error(e); process.exit(1); });
