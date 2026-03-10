import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BadgeCheck, Lock, Star, Trophy, Shield, Cpu, Terminal, Crown, Heart, Zap, Gem, Globe, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import { db, doc, onSnapshot } from '../firebase';

const BadgesPage = () => {
    const [user, setUser] = useState(null);
    const [badges, setBadges] = useState([]);
    const [userProfile, setUserProfile] = useState({ badges: [] });
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState(null);

    // Icon map with both Component and color for each badge type
    const iconMap = {
        Globe: { Icon: Globe, color: '#3b82f6', glow: 'rgba(59,130,246,0.4)', bg: 'rgba(59,130,246,0.1)' },
        Cpu: { Icon: Cpu, color: '#22d3ee', glow: 'rgba(34,211,238,0.4)', bg: 'rgba(34,211,238,0.1)' },
        Terminal: { Icon: Terminal, color: '#10b981', glow: 'rgba(16,185,129,0.4)', bg: 'rgba(16,185,129,0.1)' },
        Crown: { Icon: Crown, color: '#fbbf24', glow: 'rgba(251,191,36,0.5)', bg: 'rgba(251,191,36,0.1)' },
        Heart: { Icon: Heart, color: '#ec4899', glow: 'rgba(236,72,153,0.4)', bg: 'rgba(236,72,153,0.1)' },
        Star: { Icon: Star, color: '#f59e0b', glow: 'rgba(245,158,11,0.5)', bg: 'rgba(245,158,11,0.1)' },
        Shield: { Icon: Shield, color: '#6366f1', glow: 'rgba(99,102,241,0.4)', bg: 'rgba(99,102,241,0.1)' },
        Zap: { Icon: Zap, color: '#a855f7', glow: 'rgba(168,85,247,0.4)', bg: 'rgba(168,85,247,0.1)' },
        Gem: { Icon: Gem, color: '#06b6d4', glow: 'rgba(6,182,212,0.4)', bg: 'rgba(6,182,212,0.1)' },
        Trophy: { Icon: Trophy, color: '#f97316', glow: 'rgba(249,115,22,0.4)', bg: 'rgba(249,115,22,0.1)' },
    };

    useEffect(() => {
        const init = async () => {
            try {
                const uRes = await axios.get('/api/auth/user');
                setUser(uRes.data);

                const bRes = await axios.get('/api/user/badges');
                setBadges(bRes.data || []);

                const invRes = await axios.get('/api/user/inventory');
                setInventory(invRes.data || []);

                const profRef = doc(db, 'user_profiles', uRes.data.id);
                const unsub = onSnapshot(profRef, (docSnap) => {
                    if (docSnap.exists()) setUserProfile(docSnap.data());
                    setLoading(false);
                });
                return unsub;
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleEquip = async (badgeId) => {
        try {
            const equipped = userProfile.badges?.includes(badgeId);
            if (equipped) {
                await axios.post('/api/user/badge/unequip', { badgeId });
                setMsg({ type: 'success', text: '✅ تم إلغاء تجهيز الوسام.' });
            } else {
                await axios.post('/api/user/badge/equip', { badgeId });
                setMsg({ type: 'success', text: '✅ تم تجهيز الوسام بنجاح!' });
            }
        } catch (err) {
            setMsg({ type: 'error', text: '❌ فشل في العملية.' });
        }
        setTimeout(() => setMsg(null), 3000);
    };

    const handleBuy = async (badgeId) => {
        try {
            const res = await axios.post(`/api/shop/buy/${badgeId}`);
            if (res.data.success) {
                setMsg({ type: 'success', text: '🎉 مبروك! أضفت وساماً جديداً لمجموعتك.' });
                setInventory([...inventory, badgeId]);
            } else {
                setMsg({ type: 'error', text: res.data.reason === 'insufficient_funds' ? '💸 رصيد Orbs غير كافٍ.' : '❌ فشل الشراء.' });
            }
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.error || '❌ حدث خطأ أثناء الشراء.' });
        }
        setTimeout(() => setMsg(null), 4000);
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                style={{ width: 48, height: 48, border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%' }} />
        </div>
    );

    const equippedCount = userProfile.badges?.length || 0;
    const ownedCount = badges.filter(b => inventory.includes(b.id) || b.price === 0).length;

    return (
        <PageTransition>
            <div className="main-content" dir="rtl">
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                    {/* Header */}
                    <div style={{ marginBottom: '50px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #3b82f6, #a855f7)', padding: '18px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(59,130,246,0.3)' }}>
                                <BadgeCheck size={34} color="#fff" />
                            </div>
                            <div>
                                <h1 style={{ fontSize: '36px', fontWeight: 900, margin: 0 }}>شارات البروفايل</h1>
                                <p style={{ color: '#71717a', margin: '5px 0 0' }}>اجمع الأوسمة النادرة وتباهى بها في بروفايلك على Discord</p>
                            </div>
                        </div>

                        {/* Stats Bar */}
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            {[
                                { label: 'إجمالي الأوسمة', value: badges.length, color: '#3b82f6' },
                                { label: 'تملكها', value: ownedCount, color: '#10b981' },
                                { label: 'مُجهّزة الآن', value: equippedCount, color: '#fbbf24' },
                            ].map((stat, i) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 24px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 900, color: stat.color }}>{stat.value}</div>
                                    <div style={{ fontSize: '12px', color: '#71717a', fontWeight: 700 }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <AnimatePresence>
                        {msg && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                style={{ padding: '18px 24px', borderRadius: '15px', background: msg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', border: `1px solid ${msg.type === 'error' ? '#ef444433' : '#22c55e33'}`, textAlign: 'center', marginBottom: '30px', color: msg.type === 'error' ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
                                {msg.text}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '25px' }}>
                        {badges.map(badge => {
                            const isOwned = inventory.includes(badge.id) || badge.price === 0;
                            const isEquipped = userProfile.badges?.includes(badge.id);
                            const badgeTheme = iconMap[badge.icon] || iconMap['Star'];
                            const { Icon, color, glow, bg } = badgeTheme;

                            return (
                                <motion.div
                                    key={badge.id}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    transition={{ type: 'spring', stiffness: 300 }}
                                    style={{
                                        position: 'relative',
                                        borderRadius: '26px',
                                        padding: '2px',
                                        background: isEquipped
                                            ? `linear-gradient(135deg, ${color}, ${color}88)`
                                            : 'rgba(255,255,255,0.07)',
                                        boxShadow: isEquipped ? `0 20px 40px ${glow}` : 'none'
                                    }}
                                >
                                    <div style={{ background: '#0f0f12', borderRadius: '24px', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', height: '100%', boxSizing: 'border-box' }}>

                                        {/* Badge Icon */}
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: bg, border: `2px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isOwned ? `0 0 30px ${glow}` : 'none', transition: 'all 0.3s' }}>
                                                <Icon size={40} color={isOwned ? color : '#3f3f46'} />
                                            </div>
                                            {isEquipped && (
                                                <div style={{ position: 'absolute', bottom: -4, right: -4, background: color, borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f0f12' }}>
                                                    <CheckCircle2 size={14} color="#fff" />
                                                </div>
                                            )}
                                            {!isOwned && (
                                                <div style={{ position: 'absolute', bottom: -4, right: -4, background: '#27272a', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #18181b' }}>
                                                    <Lock size={12} color="#71717a" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Badge Info */}
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 900, marginBottom: '6px', color: isOwned ? '#fff' : '#71717a' }}>{badge.name}</div>
                                            <div style={{ fontSize: '13px', color: badge.price === 0 ? '#10b981' : color, fontWeight: 700 }}>
                                                {badge.price === 0 ? '🎁 مجاني للمتميزين' : `${badge.price.toLocaleString()} 🔮 Orbs`}
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        {!isOwned ? (
                                            <button onClick={() => handleBuy(badge.id)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${color}44`, backgroundColor: bg, color: color, fontWeight: 800, cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = color + '25'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = bg}>
                                                شراء الوسام
                                            </button>
                                        ) : (
                                            <button onClick={() => handleEquip(badge.id)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: isEquipped ? '#ef444420' : color, color: isEquipped ? '#ef4444' : '#000', fontWeight: 800, cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}
                                                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                                {isEquipped ? 'إلغاء التجهيز' : 'تجهيز الوسام ✨'}
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                </div>
            </div>
        </PageTransition>
    );
};

export default BadgesPage;
