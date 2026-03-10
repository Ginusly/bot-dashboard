import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
    Zap, Activity, Users, Star,
    ShoppingBag, Wallet, User, ArrowRight,
    Trophy, Landmark, History, ShieldCheck
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import { db, doc, onSnapshot } from '../firebase';
import UserAvatar from '../components/UserAvatar';

const DashboardHome = () => {
    const navigate = useNavigate();
    const [guilds, setGuilds] = useState([]);
    const [user, setUser] = useState(null);
    const [orbs, setOrbs] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, guildsRes] = await Promise.all([
                    axios.get('/api/auth/user'),
                    axios.get('/api/guilds')
                ]);
                const u = userRes.data;
                setUser(u);
                setGuilds(guildsRes.data);

                const orbsRef = doc(db, 'economy', `GLOBAL_${u.id}`);
                const unsub = onSnapshot(orbsRef, (docSnap) => {
                    if (docSnap.exists()) setOrbs(docSnap.data().balance || 0);
                });

                return unsub;
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '40px', height: '40px', border: '3px solid var(--primary)', borderRadius: '50%', borderTopColor: 'transparent' }} />
            </div>
        );
    }

    return (
        <PageTransition>
            <div className="main-content" dir="rtl">
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                    {/* Welcome Banner */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: 'linear-gradient(135deg, rgba(88, 101, 242, 0.4) 0%, rgba(147, 51, 234, 0.2) 100%)',
                            padding: '60px',
                            borderRadius: '30px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            marginBottom: '40px',
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <div style={{ zIndex: 1, display: 'flex', alignItems: 'center', gap: '25px' }}>
                            <UserAvatar user={user} size={100} />
                            <div>
                                <h1 style={{ fontSize: '42px', fontWeight: 900, marginBottom: '15px' }}>مرحباً بك، {user?.username} 👋</h1>
                                <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.6)', maxWidth: '500px', lineHeight: 1.6 }}>
                                    استمتع بإدارة سيرفراتك وتخصيص تجربتك مع Umbral. جميع أدواتك في مكان واحد.
                                </p>
                                {user?.username === 'oq18x' && (
                                    <button onClick={() => navigate('/admin')} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '12px', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <ShieldCheck size={18} /> لوحة المطور
                                    </button>
                                )}
                            </div>
                        </div>
                        <div style={{ zIndex: 1, display: 'flex', gap: '20px' }}>
                            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '20px 30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '14px', color: 'var(--text-dim)', marginBottom: '5px' }}>سيرفراتك</div>
                                <div style={{ fontSize: '32px', fontWeight: 900 }}>{guilds.length}</div>
                            </div>
                            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '20px 30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '14px', color: 'var(--text-dim)', marginBottom: '5px' }}>رصيدك</div>
                                <div style={{ fontSize: '32px', fontWeight: 900, color: '#fbbf24' }}>{orbs.toLocaleString()}</div>
                            </div>
                        </div>
                        <div style={{ position: 'absolute', right: '-50px', top: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', filter: 'blur(40px)' }} />
                    </motion.div>

                    {/* Quick Access Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px', marginBottom: '60px' }}>
                        <QuickCard icon={<ShoppingBag />} title="المتجر" subtitle="شراء الخلفيات والأدوار" color="#f59e0b" onClick={() => navigate('/shop')} />
                        <QuickCard icon={<History />} title="السجل" subtitle="تتبع عملياتك المالية" color="#3b82f6" onClick={() => navigate('/transactions')} />
                        <QuickCard icon={<Trophy />} title="المتصدرين" subtitle="قائمة أفضل اللاعبين" color="#22c55e" onClick={() => navigate('/leaderboard/xp')} />
                        <QuickCard icon={<Landmark />} title="المحفظة" subtitle="إدارة رصيدك وتحويلاتك" color="#a855f7" onClick={() => navigate('/wallet')} />
                    </div>

                    {/* Active Servers Grid */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 800 }}>سيرفراتك النشطة</h2>
                            <span style={{ fontSize: '14px', color: 'var(--text-dim)', cursor: 'pointer' }}>عرض الكل</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' }}>
                            {guilds.slice(0, 6).map((guild, i) => (
                                <motion.div
                                    key={guild.id}
                                    whileHover={{ y: -8 }}
                                    onClick={() => navigate(`/guild/${guild.id}`)}
                                >
                                    <GlassCard style={{ padding: '25px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '24px' }}>
                                        <div style={{ position: 'relative' }}>
                                            <img
                                                src={guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'}
                                                alt=""
                                                style={{ width: '70px', height: '70px', borderRadius: '20px', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}
                                            />
                                            <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: 'var(--primary)', padding: '5px', borderRadius: '50%', border: '3px solid var(--bg-darker)' }}>
                                                <Star size={10} color="white" fill="white" />
                                            </div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px' }}>{guild.name}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                انقر لإدارة الإعدادات <ArrowRight size={14} />
                                            </div>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </PageTransition>
    );
};

const QuickCard = ({ icon, title, subtitle, color, onClick }) => (
    <motion.div
        whileHover={{ y: -5, scale: 1.02 }}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
    >
        <GlassCard style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: `${color}15`, padding: '15px', borderRadius: '18px', color: color }}>
                {React.cloneElement(icon, { size: 28 })}
            </div>
            <div>
                <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px' }}>{title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{subtitle}</div>
            </div>
        </GlassCard>
    </motion.div>
);

export default DashboardHome;