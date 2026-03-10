import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Wallet, Zap, Send, Shield, RefreshCw, AlertCircle, Gift } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import { db, doc, onSnapshot } from '../firebase';

import DailyRewardStreak from '../components/DailyRewardStreak';

const WalletPage = () => {
    const [user, setUser] = useState(null);
    const [orbs, setOrbs] = useState(0);
    const [loading, setLoading] = useState(true);
    const [lastDaily, setLastDaily] = useState(null);

    const [transferUser, setTransferUser] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [transferMsg, setTransferMsg] = useState(null);

    const fetchWalletData = () => {
        if (!user?.id) return;
        const orbsRef = doc(db, 'economy', `GLOBAL_${user.id}`);
        const unsub = onSnapshot(orbsRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setOrbs(data.balance || 0);
                setLastDaily(data.last_daily);
            }
            setLoading(false);
        });
        return unsub;
    };

    useEffect(() => {
        axios.get('/api/auth/user').then(res => {
            setUser(res.data);
        }).catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (user) {
            const unsub = fetchWalletData();
            return unsub;
        }
    }, [user]);

    const handleDailyClaim = async () => {
        try {
            const res = await axios.post('/api/orbs/daily');
            if (res.data.success) {
                setTransferMsg({ type: 'success', text: `تم استلام ${res.data.amount} Orbs بنجاح! 🎁` });
            } else {
                setTransferMsg({ type: 'error', text: 'لقد استلمت مكافأتك اليومية بالفعل. عد غداً!' });
            }
        } catch (err) {
            setTransferMsg({ type: 'error', text: 'حدث خطأ أثناء استلام المكافأة.' });
        }
        setTimeout(() => setTransferMsg(null), 4000);
    };

    const handleTransfer = async () => {
        if (!transferUser || !transferAmount || transferAmount <= 0) return;
        try {
            const res = await axios.post('/api/orbs/transfer', {
                fromUserId: user.id,
                toUserId: transferUser,
                amount: parseInt(transferAmount)
            });
            if (res.data.success) {
                setTransferMsg({ type: 'success', text: 'تم التحويل بنجاح!' });
                setTransferUser('');
                setTransferAmount('');
            } else {
                setTransferMsg({ type: 'error', text: res.data.reason || 'فشل التحويل' });
            }
        } catch (err) {
            setTransferMsg({ type: 'error', text: err.response?.data?.error || 'حدث خطأ أثناء التحويل' });
        }
        setTimeout(() => setTransferMsg(null), 4000);
    };

    if (loading) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="float" style={{ fontSize: '48px', marginBottom: '16px' }}>💳</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)' }}>جاري تحميل المحفظة...</div>
                </div>
            </div>
        );
    }

    const today = new Date().toISOString().split('T')[0];
    const isClaimedToday = lastDaily === today;

    return (
        <PageTransition>
            <div style={{ height: 'auto', display: 'flex', flexDirection: 'column' }}>

                <div className="main-header" dir="rtl">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Wallet size={24} color="#3b82f6" />
                        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>المحفظة (Wallet)</h1>
                    </div>
                </div>

                <div className="main-content" dir="rtl">
                    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>

                        {/* Balance Card Section */}
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', background: 'rgba(59, 130, 246, 0.1)', padding: '15px', borderRadius: '50%', marginBottom: '10px' }}>
                                <Wallet size={32} color="#3b82f6" />
                            </div>
                            <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '5px' }}>رصيدك الإجمالي</h2>
                            <p style={{ color: '#71717a' }}>أدر أموالك وقم بالتحويلات للأصدقاء بأمان</p>
                        </div>

                        {/* Black Neon Supercell-Inspired Card Design */}
                        <div style={{
                            position: 'relative',
                            maxWidth: '500px',
                            margin: '0 auto',
                            borderRadius: '24px',
                            padding: '3px',
                            background: 'linear-gradient(135deg, #22d3ee 0%, #d946ef 50%, #3b82f6 100%)',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 20px rgba(217, 70, 239, 0.3)',
                            width: '100%',
                            transition: 'transform 0.3s ease',
                        }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{
                                background: 'linear-gradient(180deg, #18181b 0%, #0f0f12 100%)',
                                borderRadius: '21px',
                                padding: '32px',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                minHeight: '260px',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {/* Background subtle pattern/glow */}
                                <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', background: 'rgba(217, 70, 239, 0.1)', filter: 'blur(40px)', borderRadius: '50%' }}></div>
                                <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '150px', height: '150px', background: 'rgba(34, 211, 238, 0.08)', filter: 'blur(40px)', borderRadius: '50%' }}></div>

                                {/* Top Section: Avatar & Branding */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <img
                                            src={`https://cdn.discordapp.com/avatars/${user?.id}/${user?.avatar}.png`}
                                            alt="avatar"
                                            style={{ width: '48px', height: '48px', borderRadius: '14px', border: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
                                            onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || 'U'}` }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 600, letterSpacing: '1px' }}>UMBRAL HOLDER</span>
                                            <span style={{ fontSize: '18px', color: '#f4f4f5', fontWeight: 800, textTransform: 'uppercase' }}>{user?.username}</span>
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <Zap size={20} color="#e4e4e7" />
                                    </div>
                                </div>

                                {/* Middle Section: Balance (Prominent) */}
                                <div style={{ marginTop: 'auto', marginBottom: '24px', display: 'flex', alignItems: 'baseline', gap: '10px', position: 'relative', zIndex: 1 }}>
                                    <span style={{
                                        fontSize: '56px',
                                        fontWeight: 900,
                                        fontFamily: 'monospace',
                                        background: 'linear-gradient(180deg, #fdf4ff 0%, #f0abfc 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        textShadow: '0 4px 20px rgba(217, 70, 239, 0.4)'
                                    }}>
                                        {orbs.toLocaleString()}
                                    </span>
                                    <span style={{ fontSize: '24px', fontWeight: 800, color: '#67e8f9', letterSpacing: '1px' }}>ORB</span>
                                </div>

                                {/* Bottom Section: ID & Badge */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
                                    <div style={{ fontSize: '16px', fontFamily: 'monospace', color: '#d4d4d8', letterSpacing: '3px', fontWeight: 600 }}>
                                        {user?.id || 'UNKNOWN'}
                                    </div>
                                    <div style={{
                                        background: '#f4f4f5',
                                        color: '#18181b',
                                        padding: '4px 12px',
                                        borderRadius: '8px',
                                        fontWeight: 900,
                                        fontSize: '14px',
                                        boxShadow: '0 4px 10px rgba(255,255,255,0.2)'
                                    }}>
                                        ID
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transfer Form Section */}
                        <GlassCard style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <Send size={24} color="#3b82f6" />
                                <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>تحويل Orbs (مؤمن)</h2>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '24px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>ID المستلم</label>
                                    <input
                                        type="text"
                                        placeholder="مثال: 123456789012345678"
                                        value={transferUser}
                                        onChange={e => setTransferUser(e.target.value)}
                                        style={{
                                            background: 'rgba(0,0,0,0.2)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            color: 'white',
                                            fontSize: '16px',
                                            outline: 'none',
                                            transition: 'border 0.3s ease',
                                            width: '100%',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>كمية الـ Orbs</label>
                                    <input
                                        type="number"
                                        placeholder="الكمية المطلوبة للتحويل..."
                                        value={transferAmount}
                                        onChange={e => setTransferAmount(e.target.value)}
                                        min="1"
                                        style={{
                                            background: 'rgba(0,0,0,0.2)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            color: 'white',
                                            fontSize: '16px',
                                            outline: 'none',
                                            transition: 'border 0.3s ease',
                                            width: '100%',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px' }}>
                                {transferMsg && (
                                    <div style={{
                                        color: transferMsg.type === 'error' ? '#ef4444' : '#22c55e',
                                        background: transferMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <AlertCircle size={16} />
                                        {transferMsg.text}
                                    </div>
                                )}
                                <button
                                    className="btn-primary"
                                    onClick={handleTransfer}
                                    style={{
                                        padding: '14px 32px',
                                        fontSize: '16px',
                                        borderRadius: '12px',
                                        background: '#3b82f6',
                                        boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        border: 'none',
                                        color: 'white',
                                        fontWeight: 700
                                    }}
                                >
                                    <Send size={18} />
                                    إرسال Orbs
                                </button>
                            </div>

                        </GlassCard>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
                            <Shield size={16} />
                            <span style={{ fontSize: '13px' }}>جميع العمليات مؤمنة بنظام الحماية ضد التلاعب، ولا يمكن عكس التحويل أو تجاوز الحدود.</span>
                        </div>

                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default WalletPage;
