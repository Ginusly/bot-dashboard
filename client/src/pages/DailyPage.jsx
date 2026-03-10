import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Gift, Zap, Calendar, Heart, Star, Sparkles, Trophy } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import { motion } from 'framer-motion';
import { db, doc, onSnapshot } from '../firebase';
import DailyRewardStreak from '../components/DailyRewardStreak';

const DailyPage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastDaily, setLastDaily] = useState(null);
    const [streak, setStreak] = useState(1);
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        axios.get('/api/auth/user').then(res => {
            setUser(res.data);
        }).catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (user) {
            const orbsRef = doc(db, 'economy', `GLOBAL_${user.id}`);
            const unsub = onSnapshot(orbsRef, (docSnap) => {
                if (docSnap.exists()) {
                    setLastDaily(docSnap.data().last_daily);
                    setStreak(docSnap.data().streak || 1);
                }
                setLoading(false);
            });
            return unsub;
        }
    }, [user]);

    const handleClaim = async () => {
        try {
            const res = await axios.post('/api/orbs/daily');
            if (res.data.success) {
                setMsg({ type: 'success', text: `تهانينا! حصلت على ${res.data.amount} Orbs ومكافأة ستريك! 🎁` });
            } else {
                setMsg({ type: 'error', text: 'لقد استلمت مكافأتك اليومية بالفعل. عد غداً!' });
            }
        } catch (err) {
            setMsg({ type: 'error', text: 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.' });
        }
        setTimeout(() => setMsg(null), 5000);
    };

    if (loading) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>جاري التحميل...</div>;

    const today = new Date().toISOString().split('T')[0];
    const isClaimedToday = lastDaily === today;

    return (
        <PageTransition>
            <div className="main-content" dir="rtl">
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>

                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            style={{ display: 'inline-flex', background: 'rgba(59, 130, 246, 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '24px' }}
                        >
                            <Gift size={48} color="#3b82f6" />
                        </motion.div>
                        <h1 style={{ fontSize: '42px', fontWeight: 900, marginBottom: '15px' }}>المكافآت اليومية</h1>
                        <p style={{ fontSize: '18px', color: 'var(--text-dim)' }}>حافظ على الستريك الخاص بك وضاعف جوائزك كل يوم!</p>
                    </div>

                    <div style={{ marginBottom: '60px' }}>
                        <DailyRewardStreak
                            currentStreak={streak}
                            lastClaimedToday={isClaimedToday}
                            onClaim={handleClaim}
                        />
                    </div>

                    {msg && (
                        <div style={{
                            background: msg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                            border: `1px solid ${msg.type === 'error' ? '#ef444433' : '#22c55e33'}`,
                            padding: '15px 25px',
                            borderRadius: '15px',
                            marginBottom: '30px',
                            textAlign: 'center',
                            color: msg.type === 'error' ? '#ef4444' : '#22c55e',
                            fontWeight: 700
                        }}>
                            {msg.text}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        <Feature icon={<Zap color="#fbbf24" />} title="ستريك متواصل" desc="تزداد الجائزة كلما استمريت في الدخول يومياً." />
                        <Feature icon={<Sparkles color="#a855f7" />} title="جوائز عشوائية" desc="فرصة للحصول على أوسمة نادرة عند ستريك 30+." />
                        <Feature icon={<Trophy color="#22c55e" />} title="قائمة الشرف" desc="أكثر المستخدمين التزاماً باليوميات." />
                    </div>

                </div>
            </div>
        </PageTransition>
    );
};

const Feature = ({ icon, title, desc }) => (
    <GlassCard style={{ padding: '25px', textAlign: 'center' }}>
        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>{title}</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</p>
    </GlassCard>
);

export default DailyPage;
