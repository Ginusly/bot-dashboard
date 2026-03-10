import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Cpu, Terminal, Plus, ShieldCheck, Activity, Search, Trash2, Edit2, Zap, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';

const PremiumBotsPage = () => {
    const [user, setUser] = useState(null);
    const [bots, setBots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newBotToken, setNewBotToken] = useState('');
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        const init = async () => {
            try {
                const uRes = await axios.get('/api/auth/user');
                setUser(uRes.data);

                const bRes = await axios.get('/api/premium/bots');
                setBots(bRes.data || []);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleAddBot = async () => {
        if (!newBotToken) return;
        try {
            const res = await axios.post('/api/premium/bots/add', { token: newBotToken });
            if (res.data.success) {
                setBots([...bots, res.data.bot]);
                setShowAddModal(false);
                setNewBotToken('');
                setMsg({ type: 'success', text: 'تمت إضافة البوت بنجاح! جاري التشغيل...' });
            } else {
                setMsg({ type: 'error', text: res.data.reason || 'التوكن غير صالح أو البوت بنسخة غير مدعومة.' });
            }
        } catch (err) {
            setMsg({ type: 'error', text: 'حدث خطأ غير متوقع أثناء الاتصال.' });
        }
        setTimeout(() => setMsg(null), 4000);
    };

    const handleDeleteBot = async (botId) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا البوت؟')) return;
        try {
            await axios.post('/api/premium/bots/delete', { botId });
            setBots(bots.filter(b => b.id !== botId));
            setMsg({ type: 'success', text: 'تم حذف البوت بنجاح.' });
        } catch (err) {
            setMsg({ type: 'error', text: 'فشل حذف البوت.' });
        }
        setTimeout(() => setMsg(null), 3000);
    };

    if (loading) return <div>جاري التحميل...</div>;

    return (
        <PageTransition>
            <div className="main-content" dir="rtl">
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '15px', borderRadius: '15px' }}>
                                <Cpu size={32} color="#3b82f6" />
                            </div>
                            <div>
                                <h1 style={{ fontSize: '32px', fontWeight: 900 }}>إدارة بوتات البريميوم (Manage Premium Bots)</h1>
                                <p style={{ color: 'var(--text-dim)' }}>تحكم في بوتاتك الخاصة التي تعمل بنظام Umbral.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 28px', fontSize: '15px', borderRadius: '14px' }}
                        >
                            <Plus size={20} />
                            إضافة بوت جديد
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '50px' }}>
                        <BotStat icon={<Monitor />} title="بوتات تعمل" value={bots.filter(b => b.status === 'online').length} color="#10b981" />
                        <BotStat icon={<Activity />} title="إجمالي الأوامر" value="2,450" color="#3b82f6" />
                        <BotStat icon={<Zap />} title="سرعة المعالجة" value="12ms" color="#fbbf24" />
                        <BotStat icon={<ShieldCheck />} title="الحماية" value="Active" color="#a855f7" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                        {bots.length === 0 ? (
                            <div style={{ padding: '80px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '30px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                                <Cpu size={64} color="rgba(255,255,255,0.1)" style={{ marginBottom: '20px' }} />
                                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>لا توجد بوتات مضافة</h3>
                                <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>ابدأ بإضافة بوت جديد من الزر في الأعلى لبدء التشغيل!</p>
                            </div>
                        ) : bots.map(bot => (
                            <BotCard key={bot.id} bot={bot} onDelete={() => handleDeleteBot(bot.id)} />
                        ))}
                    </div>

                </div>
            </div>

            {/* Add Bot Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    >
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            style={{ maxWidth: '600px', width: '100%', padding: '40px', borderRadius: '30px', background: '#1c1c1f', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '20px' }}>تشغيل بوت بريميوم جديد ⚡</h2>
                            <p style={{ color: 'var(--text-dim)', marginBottom: '30px', lineHeight: 1.6 }}>أدخل توكن البوت الذي حصلت عليه من بوابة المطورين (Discord Developer Portal) لربطه بنظامنا.</p>

                            <div style={{ marginBottom: '30px' }}>
                                <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Bot Token</label>
                                <input
                                    type="password"
                                    value={newBotToken}
                                    onChange={(e) => setNewBotToken(e.target.value)}
                                    placeholder="Paste your bot token here..."
                                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', color: 'white', fontSize: '16px', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button
                                    onClick={handleAddBot}
                                    className="btn-primary"
                                    style={{ flex: 1, padding: '15px' }}
                                >
                                    بدء التشغيل
                                </button>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="btn-primary"
                                    style={{ flex: 1, padding: '15px', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                                >
                                    إلغاء
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </PageTransition>
    );
};

const BotStat = ({ icon, title, value, color }) => (
    <GlassCard style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ color: color, background: `${color}15`, padding: '15px', borderRadius: '15px' }}>
            {React.cloneElement(icon, { size: 24 })}
        </div>
        <div>
            <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '4px' }}>{title}</div>
            <div style={{ fontSize: '22px', fontWeight: 900 }}>{value}</div>
        </div>
    </GlassCard>
);

const BotCard = ({ bot, onDelete }) => (
    <GlassCard style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '25px' }}>
        <div style={{ position: 'relative' }}>
            <img
                src={bot.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                alt=""
                style={{ width: '64px', height: '64px', borderRadius: '18px', border: '2px solid rgba(255,255,255,0.1)' }}
            />
            <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', width: '18px', height: '18px', background: '#10b981', border: '3px solid #1c1c1f', borderRadius: '50%' }} />
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>{bot.name || 'Unnamed Bot'}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ID: {bot.id || 'N/A'}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{ padding: '10px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none' }}><Edit2 size={18} /></button>
            <button
                onClick={onDelete}
                style={{ padding: '10px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', cursor: 'pointer' }}
            >
                <Trash2 size={18} />
            </button>
        </div>
    </GlassCard>
);

export default PremiumBotsPage;
