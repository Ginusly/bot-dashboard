import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Coins, Star, User, Crown, ArrowUpRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';

const LeaderboardPage = () => {
    const { type } = useParams(); // 'xp' or 'orbs' or 'rep'
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        let endpoint = '/api/leaderboard/orbs';
        if (type === 'xp') endpoint = '/api/leaderboard/xp';
        if (type === 'rep') endpoint = '/api/leaderboard/rep';

        axios.get(endpoint)
            .then(res => setPlayers(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [type]);

    const getIcon = () => {
        if (type === 'xp') return <Trophy size={28} color="white" />;
        if (type === 'orbs') return <Coins size={28} color="white" />;
        return <Star size={28} color="white" />;
    };

    const getTitle = () => {
        if (type === 'xp') return 'أعلى المتفاعلين (XP)';
        if (type === 'orbs') return 'أغنى اللاعبين (Orbs)';
        return 'أعلى السمعة (Reputation)';
    };

    const getSubtitle = () => {
        if (type === 'xp') return 'قائمة اللاعبين الأكثر تفاعلاً في السيرفر';
        if (type === 'orbs') return 'قائمة اللاعبين الذين يمتلكون أكبر قدر من الـ Orbs';
        return 'قائمة اللاعبين الأكثر احتراماً وتقديراً (Rep)';
    };

    return (
        <PageTransition>
            <div className="main-content" dir="rtl">
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '50px' }}>
                        <div style={{
                            background: type === 'xp' ? 'linear-gradient(135deg, #f0b232, #ff8c00)' : type === 'rep' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                            padding: '16px', borderRadius: '20px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                            transform: 'rotate(-5deg)'
                        }}>
                            {getIcon()}
                        </div>
                        <div>
                            <h1 style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-0.5px' }}>{getTitle()}</h1>
                            <p style={{ color: 'var(--text-dim)', fontSize: '16px', fontWeight: 500 }}>{getSubtitle()}</p>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '100px' }}>
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '40px', height: '40px', border: '3px solid var(--primary)', borderRadius: '50%', borderTopColor: 'transparent', margin: '0 auto' }} />
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {players.map((p, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={idx}
                                >
                                    <GlassCard style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '16px 24px',
                                        background: idx < 3 ? 'rgba(255,255,255,0.06)' : 'var(--bg-card)',
                                        border: idx < 3 ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--glass-border)',
                                        boxShadow: idx < 3 ? '0 8px 32px rgba(0,0,0,0.2)' : 'none'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                            <div style={{
                                                width: '40px', height: '40px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '20px', fontWeight: 900,
                                                color: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#92400e' : 'var(--text-muted)'
                                            }}>
                                                {idx < 3 ? <Crown size={28} /> : `#${idx + 1}`}
                                            </div>

                                            <div style={{ position: 'relative' }}>
                                                <img
                                                    src={p.avatar_hash ? `https://cdn.discordapp.com/avatars/${p.user_id}/${p.avatar_hash}.png?size=128` : `https://api.dicebear.com/7.x/initials/svg?seed=${p.username || p.user_id}&backgroundColor=5865F2`}
                                                    style={{ width: '48px', height: '48px', borderRadius: '50%', border: idx < 3 ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent', objectFit: 'cover' }}
                                                    alt=""
                                                />
                                                {idx < 3 && (
                                                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#fbbf24', borderRadius: '50%', padding: '4px', border: '2px solid var(--bg-darker)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', boxSizing: 'border-box' }}>
                                                        <Star size={14} color="white" fill="white" />
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <div style={{ fontSize: '18px', fontWeight: 800 }}>{p.username || `User ID: ${p.user_id.slice(0, 15)}...`}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{type === 'xp' ? `عضو نشيط` : type === 'rep' ? 'عضو محبوب' : `لاعب محترف`}</div>
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{
                                                fontSize: '22px',
                                                fontWeight: 900,
                                                color: type === 'xp' ? '#f59e0b' : type === 'rep' ? '#10b981' : '#3b82f6',
                                                display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end'
                                            }}>
                                                {(type === 'xp' ? (p.xp || 0) : type === 'rep' ? (p.rep || 0) : (p.balance || 0)).toLocaleString()}
                                                {type === 'xp' ? <Trophy size={18} /> : type === 'rep' ? <Star size={18} /> : <Coins size={18} />}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>
                                                {type === 'xp' ? `مستوى ${p.level || 0}` : type === 'rep' ? `نقطة سمعة` : `إجمالي الأرباح: ${p.total_earned?.toLocaleString() || 0}`}
                                            </div>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageTransition>
    );
};

export default LeaderboardPage;
