import React from 'react';
import { motion } from 'framer-motion';
import { Gift, CheckCircle2 } from 'lucide-react';
import GlassCard from './GlassCard';

const DailyRewardStreak = ({ currentStreak, lastClaimedToday, onClaim }) => {
    const totalDays = 8;

    return (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '12px', background: 'linear-gradient(135deg, #fff, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>مكافأة الحضور اليومي</h2>
            <p style={{ color: '#a1a1aa', marginBottom: '40px', fontSize: '18px' }}>التزم بالحضور يومياً لتحصل على جوائز مضاعفة وأوسمة نادرة! ✨</p>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: '80px', direction: 'ltr', maxWidth: '800px', margin: '0 auto 60px' }}>
                {/* Connecting Line */}
                <div style={{
                    position: 'absolute', top: '28px', left: '5%', right: '5%',
                    height: '6px', background: 'rgba(255,255,255,0.03)',
                    zIndex: 0, borderRadius: '10px', overflow: 'hidden'
                }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(Math.min(currentStreak - 1, totalDays - 1) / (totalDays - 1)) * 100}%` }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #d946ef)', boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}
                    />
                </div>

                {Array.from({ length: totalDays }).map((_, i) => {
                    const dayNum = i + 1;
                    const isClaimed = dayNum < currentStreak || (dayNum === currentStreak && lastClaimedToday);
                    const isActive = dayNum === currentStreak && !lastClaimedToday;

                    return (
                        <div key={i} style={{ flex: 1, zIndex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <motion.div
                                whileHover={{ scale: 1.2, y: -5 }}
                                style={{
                                    width: '56px', height: '56px', borderRadius: '18px',
                                    background: isClaimed ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : isActive ? 'rgba(59, 130, 246, 0.15)' : '#18181b',
                                    border: isClaimed ? 'none' : isActive ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: isClaimed ? 'white' : '#71717a',
                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    boxShadow: isClaimed ? '0 10px 20px rgba(59, 130, 246, 0.3)' : 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {isClaimed ? <CheckCircle2 size={28} /> : (
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 900, marginBottom: '-2px' }}>Day</div>
                                        <div style={{ fontSize: '18px', fontWeight: 900 }}>{dayNum}</div>
                                    </div>
                                )}
                            </motion.div>
                            {isActive && (
                                <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ position: 'absolute', bottom: '-25px', color: '#3b82f6', fontSize: '12px', fontWeight: 800 }}>استلم الآن</motion.div>
                            )}
                        </div>
                    );
                })}
            </div>

            <GlassCard style={{
                maxWidth: '650px', margin: '0 auto',
                padding: '60px',
                background: 'rgba(255,255,255,0.01)',
                borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
                position: 'relative', overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent 70%)', pointerEvents: 'none' }} />

                <motion.div
                    animate={lastClaimedToday ? {} : { y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    style={{ marginBottom: '40px', display: 'flex', justifyContent: 'center' }}
                >
                    <div style={{ background: lastClaimedToday ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #3b82f6, #d946ef)', padding: '25px', borderRadius: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                        <Gift size={80} color="white" />
                    </div>
                </motion.div>

                <h3 style={{ fontSize: '30px', fontWeight: 900, marginBottom: '20px' }}>
                    {lastClaimedToday ? 'تم استلام مكافأة اليوم! 🎉' : 'صندوق الهدايا بانتظارك!'}
                </h3>

                <p style={{ color: '#71717a', fontSize: '16px', marginBottom: '40px', maxWidth: '400px', margin: '0 auto 40px' }}>
                    {lastClaimedToday ? 'رائع! لقد حافظت على الستريك الخاص بك. عد بعد 24 ساعة للحصول على الجائزة التالية.' : 'اضغط على الزر أدناه للحصول على الـ Orbs اليومية وتنمية رصيدك.'}
                </p>

                <button
                    onClick={onClaim}
                    disabled={lastClaimedToday}
                    style={{
                        margin: '0 auto', padding: '20px 60px', fontSize: '20px', fontWeight: 900,
                        background: lastClaimedToday ? 'rgba(255,255,255,0.05)' : '#fff',
                        color: lastClaimedToday ? '#52525b' : '#000',
                        borderRadius: '20px', border: 'none',
                        cursor: lastClaimedToday ? 'default' : 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: lastClaimedToday ? 'none' : '0 15px 30px rgba(255,255,255,0.1)'
                    }}
                    onMouseEnter={e => !lastClaimedToday && (e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)')}
                    onMouseLeave={e => !lastClaimedToday && (e.currentTarget.style.transform = 'scale(1) translateY(0)')}
                >
                    {lastClaimedToday ? 'انتظر حتى الغد' : 'استلام المكافأة ✨'}
                </button>

                <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '30px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#71717a', fontWeight: 700, textTransform: 'uppercase' }}>ستريك الحالي</div>
                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#3b82f6' }}>{currentStreak} يوم</div>
                    </div>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#71717a', fontWeight: 700, textTransform: 'uppercase' }}>الجائزة القادمة</div>
                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#d946ef' }}>+{50 + (currentStreak * 10)} 🔮</div>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};

export default DailyRewardStreak;
