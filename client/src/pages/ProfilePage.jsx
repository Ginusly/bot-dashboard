import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    User, Image, Frame, ShoppingBag,
    AlertCircle, CheckCircle2, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [orbs, setOrbs] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('backgrounds'); // backgrounds, frames

    const [inventory, setInventory] = useState([]);
    const [profile, setProfile] = useState({ current_background: null, current_frame: null });
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [userRes, invRes, profRes] = await Promise.all([
                axios.get('/api/auth/user'),
                axios.get('/api/user/inventory'),
                axios.get('/api/user/profile')
            ]);

            setUser(userRes.data);
            setInventory(invRes.data);
            setProfile(profRes.data);

            const orbsRes = await axios.get(`/api/orbs/${userRes.data.id}`);
            setOrbs(orbsRes.data.balance || 0);
        } catch (e) {
            console.error('Error fetching profile data', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEquipItem = async (itemId, type) => {
        try {
            const res = await axios.post('/api/user/profile/equip', { itemId, type });
            if (res.data.success) {
                showToast('تم التجهيز بنجاح! ✨', 'success');
                setProfile(prev => ({
                    ...prev,
                    [type === 'background' ? 'current_background' : 'current_frame']: itemId
                }));
            }
        } catch (error) {
            showToast('فشل في التجهيز', 'error');
        }
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-darker)' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '40px', height: '40px', border: '3px solid var(--primary)', borderRadius: '50%', borderTopColor: 'transparent' }} />
        </div>
    );

    const tabs = [
        { id: 'backgrounds', label: 'خلفياتي', icon: <Image size={18} /> },
        { id: 'frames', label: 'إطاراتي', icon: <Frame size={18} /> },
    ];

    return (
        <PageTransition>
            <div dir="rtl" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ position: 'relative' }}>
                                <img
                                    src={`https://cdn.discordapp.com/avatars/${user?.id}/${user?.avatar}.png`}
                                    alt="avatar"
                                    style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid var(--primary)', boxShadow: '0 0 20px rgba(88,101,242,0.3)' }}
                                    onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || 'U'}` }}
                                />
                                <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)', padding: '6px', borderRadius: '50%', border: '2px solid var(--bg-darker)' }}>
                                    <User size={16} color="white" />
                                </div>
                            </div>
                            <div>
                                <h1 style={{ fontSize: '28px', fontWeight: 900, margin: 0 }}>بروفايلك الشخصي</h1>
                                <p style={{ color: 'var(--text-dim)', marginTop: '4px' }}>تخصيص صورتك الشخصية وتغيير الخلفيات والإطارات</p>
                            </div>
                        </div>

                        {/* Profile Image Preview */}
                        <div style={{ marginTop: '10px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-muted)' }}>معاينة البروفايل (/profail)</h3>
                            <img
                                src={`/api/user/profile/image?t=${Date.now()}`}
                                alt="Profile Preview"
                                style={{
                                    width: '100%',
                                    maxWidth: '850px',
                                    borderRadius: '20px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--glass-bg)', padding: '12px 24px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ background: 'rgba(217, 70, 239, 0.1)', padding: '8px', borderRadius: '10px' }}>
                            <Zap size={20} color="#d946ef" />
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>رصيد الأوربز</div>
                            <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>{orbs.toLocaleString()} <span style={{ color: '#d946ef' }}>🔮</span></div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', borderRadius: '12px',
                                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'var(--text-dim)',
                                border: 'none', cursor: 'pointer', fontWeight: 700, transition: 'all 0.3s ease',
                                fontFamily: 'inherit'
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                                {inventory
                                    .filter(item => item.type === (activeTab === 'backgrounds' ? 'background' : 'frame'))
                                    .map(item => {
                                        const isEquipped = activeTab === 'backgrounds'
                                            ? profile.current_background === item.id
                                            : profile.current_frame === item.id;
                                        return (
                                            <GlassCard key={item.id} style={{ overflow: 'hidden', padding: 0 }}>
                                                <div style={{ height: '140px', background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
                                                    {item.type === 'background' ? (
                                                        item.is_css ? (
                                                            <div dangerouslySetInnerHTML={{ __html: item.css_content }} style={{ width: '100%', height: '100%' }} />
                                                        ) : (
                                                            <img src={item.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                                        )
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                                            <motion.div
                                                                whileHover={{ scale: 1.1 }}
                                                                style={{ position: 'relative', width: '80px', height: '80px' }}
                                                            >
                                                                <img
                                                                    src={`https://cdn.discordapp.com/avatars/${user?.id}/${user?.avatar}.png`}
                                                                    style={{ width: '100%', height: '100%', borderRadius: '50%', border: '4px solid #1c1c1f', zIndex: 2, position: 'relative' }}
                                                                    alt=""
                                                                    onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}` }}
                                                                />
                                                                {item.is_css ? (
                                                                    <div dangerouslySetInnerHTML={{ __html: item.css_content }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }} />
                                                                ) : item.image_url.startsWith('http') ? (
                                                                    <img src={item.image_url} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3 }} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                                                                ) : (
                                                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: `4px solid ${item.image_url}`, borderRadius: '50%', zIndex: 3, boxShadow: `0 0 15px ${item.image_url}66, inset 0 0 10px ${item.image_url}44`, boxSizing: 'border-box' }} />
                                                                )}
                                                            </motion.div>
                                                        </div>
                                                    )}
                                                    {isEquipped && (
                                                        <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--primary)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800 }}>مجهز ✅</div>
                                                    )}
                                                </div>
                                                <div style={{ padding: '20px' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '18px', marginBottom: '14px' }}>{item.name}</div>
                                                    <button
                                                        onClick={() => handleEquipItem(item.id, item.type)}
                                                        disabled={isEquipped}
                                                        className="btn-primary"
                                                        style={{
                                                            width: '100%',
                                                            justifyContent: 'center',
                                                            background: isEquipped ? 'rgba(255,255,255,0.05)' : 'var(--primary)',
                                                            border: 'none',
                                                            color: isEquipped ? 'var(--text-muted)' : 'white',
                                                            cursor: isEquipped ? 'default' : 'pointer',
                                                            fontFamily: 'inherit'
                                                        }}
                                                    >
                                                        {isEquipped ? 'مجهز حالياً' : 'تجهيز العنصر'}
                                                    </button>
                                                </div>
                                            </GlassCard>
                                        );
                                    })}
                                {inventory.filter(item => item.type === (activeTab === 'backgrounds' ? 'background' : 'frame')).length === 0 && (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px', opacity: 0.5 }}>
                                        <ShoppingBag size={48} style={{ marginBottom: '16px' }} />
                                        <h3>لا تملك أي {activeTab === 'backgrounds' ? 'خلفيات' : 'إطارات'} بعد.</h3>
                                        <p>تفضل بزيارة المتجر لتخصيص مظهرك!</p>
                                        <button onClick={() => navigate('/shop')} className="btn-primary" style={{ marginTop: '20px', display: 'inline-flex', margin: '20px auto 0' }}>الذهاب للمتجر</button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Toasts */}
                <div style={{ position: 'fixed', bottom: '24px', left: '24px', zIndex: 999 }}>
                    <AnimatePresence>
                        {toast && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                style={{
                                    background: toast.type === 'success' ? '#23a559' : toast.type === 'error' ? '#EF4444' : 'var(--bg-card)',
                                    color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: 700,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '12px'
                                }}
                            >
                                {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                {toast.message}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </PageTransition>
    );
};

export default ProfilePage;
