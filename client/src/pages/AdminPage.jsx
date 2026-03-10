import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, Activity, Database, Server, Cpu, Key, Lock, Terminal, Globe, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';

const AdminPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/admin/stats');
                setStats(res.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.error || 'Access Denied');
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div style={{ padding: '100px', textAlign: 'center' }}>
            <RefreshCcw size={48} className="spin" color="#3b82f6" />
            <h2 style={{ marginTop: '20px' }}>Authenticating High Priority Access...</h2>
        </div>
    );

    if (error) return (
        <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <Lock size={100} style={{ marginBottom: '30px', opacity: 0.2 }} />
            <h1 style={{ fontSize: '42px', fontWeight: 900 }}>403 - RESTRICTED</h1>
            <p style={{ fontSize: '18px', color: '#71717a' }}>This area is for authorized developer oq18x only.</p>
        </div>
    );

    return (
        <PageTransition>
            <div dir="rtl" style={{ padding: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '50px' }}>
                    <div style={{ background: '#ef444422', padding: '15px', borderRadius: '15px', border: '1px solid #ef444444' }}>
                        <ShieldAlert size={32} color="#ef4444" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '36px', fontWeight: 900 }}>لوحة تحكم المطور (oq18x)</h1>
                        <p style={{ color: '#71717a' }}>إحصائيات النظام والمعلومات الحساسة.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
                    {/* Bot Info */}
                    <GlassCard style={{ padding: '30px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                            <Activity color="#3b82f6" />
                            <h3 style={{ margin: 0 }}>حالة النظام (System)</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <StatRow label="إصدار البوت" value={stats.bot_meta.version} />
                            <StatRow label="بيئة التشغيل" value={stats.bot_meta.env} />
                            <StatRow label="وقت التشغيل" value={`${Math.floor(stats.system.uptime / 3600)} ساعة`} />
                            <StatRow label="استهلاك الذاكرة" value={`${Math.round(stats.system.memory.rss / 1024 / 1024)} MB`} />
                        </div>
                    </GlassCard>

                    {/* Infrastructure */}
                    <GlassCard style={{ padding: '30px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                            <Server color="#10b981" />
                            <h3 style={{ margin: 0 }}>البنية التحتية</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <StatRow label="Node.js" value={stats.bot_meta.node} />
                            <StatRow label="نظام التشغيل" value={stats.bot_meta.arch} />
                            <StatRow label="قاعدة البيانات" value={stats.database.type} />
                            <StatRow label="اتصال Firebase" value="متصل ✅" />
                        </div>
                    </GlassCard>

                    {/* Sensitive Info */}
                    <GlassCard style={{ padding: '30px', background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                            <Key color="#fbbf24" />
                            <h3 style={{ margin: 0 }}>المعلومات الحساسة</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <StatRow label="Callback URL" value={stats.sensitive.discord_callback} />
                            <StatRow label="Client ID" value={stats.sensitive.client_id} />
                            <StatRow label="Security Mode" value="Active (High)" color="#ef4444" />
                        </div>
                    </GlassCard>
                </div>

                <div style={{ marginTop: '40px' }}>
                    <GlassCard style={{ padding: '30px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <Terminal color="#a855f7" />
                            <h3 style={{ margin: 0 }}>العمليات المباشرة</h3>
                        </div>
                        <div style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', display: 'grid', gap: '15px' }}>
                            <AdminBtn label="إعادة تشغيل البوت" color="#ef4444" />
                            <AdminBtn label="تطهير الكاش" color="#3b82f6" />
                            <AdminBtn label="تحديث السلاش" color="#10b981" />
                            <AdminBtn label="فحص الأخطاء" color="#fbbf24" />
                        </div>
                    </GlassCard>
                </div>
            </div>
            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </PageTransition>
    );
};

const StatRow = ({ label, value, color = '#fff' }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ color: '#71717a', fontSize: '14px' }}>{label}</span>
        <span style={{ fontWeight: 800, fontSize: '14px', color }}>{value}</span>
    </div>
);

const AdminBtn = ({ label, color }) => (
    <button style={{
        padding: '15px', borderRadius: '12px', background: `${color}15`, border: `1px solid ${color}33`,
        color: color, fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s'
    }} onMouseEnter={e => e.currentTarget.style.background = color + '25'} onMouseLeave={e => e.currentTarget.style.background = color + '15'}>
        {label}
    </button>
);

export default AdminPage;
