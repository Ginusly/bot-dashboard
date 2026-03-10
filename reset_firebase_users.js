const firebase = require('./shared/firebase');

async function resetAllUsers() {
    console.log('⚠️  DANGER: Starting Firebase data reset for all users...');

    const collections = ['economy', 'levels', 'user_inventory', 'user_profiles'];

    for (const colName of collections) {
        console.log(`🧹 Processing collection: ${colName}...`);
        const colRef = firebase.collection(firebase.db, colName);
        const snap = await firebase.getDocs(colRef);

        console.log(`Found ${snap.size} documents in ${colName}.`);

        let deleted = 0;
        for (const doc of snap.docs) {
            await firebase.deleteDoc(doc.ref);
            deleted++;
            if (deleted % 10 === 0) console.log(`Deleted ${deleted}/${snap.size}...`);
        }
        console.log(`✅ Finished ${colName}.`);
    }

    console.log('✨ All info cleared successfully from scratch.');
    process.exit(0);
}

// Check for a flag or confirmation if running manually? 
// For now, it will run if executed.
resetAllUsers().catch(err => {
    console.error('❌ Error during reset:', err);
    process.exit(1);
});
