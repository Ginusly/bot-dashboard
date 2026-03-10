const firebase = require('./shared/firebase');

const badges = [
    { name: 'الأساطير (Legend)', type: 'badge', price: 50000, icon: 'Globe' },
    { name: 'المؤسس (Founder)', type: 'badge', price: 100000, icon: 'Cpu' },
    { name: 'المطور (Developer)', type: 'badge', price: 0, icon: 'Terminal' },
    { name: 'التاج الذهبي (Crown)', type: 'badge', price: 20000, icon: 'Crown' },
    { name: 'القلب النابض (Heart)', type: 'badge', price: 5000, icon: 'Heart' },
    { name: 'النجمة الساطعة (Star)', type: 'badge', price: 1000, icon: 'Star' },
    { name: 'الدرع الواقي (Shield)', type: 'badge', price: 15000, icon: 'Shield' },
    { name: 'المنطلق (Lightning)', type: 'badge', price: 8000, icon: 'Zap' },
    { name: 'الارستقراطي (Rich)', type: 'badge', price: 1000000, icon: 'Gem' },
    { name: 'الفائز (Winner)', type: 'badge', price: 30000, icon: 'Trophy' }
];

async function seed() {
    console.log('--- جاري إضافة الأوسمة الجديدة ---');
    const colRef = firebase.collection(firebase.db, 'shop_items');

    for (const badge of badges) {
        // التحقق من وجود الوسام مسبقاً
        const q = firebase.query(colRef, firebase.where('name', '==', badge.name));
        const snap = await firebase.getDocs(q);

        if (snap.empty) {
            await firebase.addDoc(colRef, {
                ...badge,
                created_at: new Date()
            });
            console.log(`✅ تمت إضافة الوسام: ${badge.name}`);
        } else {
            console.log(`ℹ️ الوسام موجود بالفعل: ${badge.name}`);
        }
    }
    console.log('--- انتهى! ---');
    process.exit(0);
}

seed();
