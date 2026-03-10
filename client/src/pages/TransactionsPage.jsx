import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { History, ArrowUpRight, ArrowDownLeft, Clock, User } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';

const TransactionsPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/user/transactions')
            .then(res => setTransactions(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const formatReason = (reason) => {
        if (reason === 'daily') return '🎁 مكافأة يومية';
        if (reason.startsWith('buy_item_')) return `🛒 شراء غرض من المتجر`;
        if (reason === 'transfer') return '💸 تحويل Orbs';
        return reason;
    };

    return (
        <PageTransition>
            <div className="main-content" dir="rtl">
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px' }}>
                        <div style={{ background: 'var(--primary)', padding: '12px', borderRadius: '15px', boxShadow: '0 8px 25px var(--glass-glow)' }}>
                            <History size={28} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '32px', fontWeight: 900 }}>سجل العمليات</h1>
                            <p style={{ color: 'var(--text-dim)', fontSize: '15px' }}>تتبع تحركات الـ Orbs في حسابك</p>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '100px' }}>
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '40px', height: '40px', border: '3px solid var(--primary)', borderRadius: '50%', borderTopColor: 'transparent', margin: '0 auto' }} />
                        </div>
                    ) : transactions.length === 0 ? (
                        <GlassCard style={{ textAlign: 'center', padding: '80px' }}>
                            <div style={{ opacity: 0.3, marginBottom: '20px' }}><History size={64} /></div>
                            <div style={{ fontSize: '20px', fontWeight: 700, opacity: 0.6 }}>لا توجد عمليات مسجلة حالياً</div>
                        </GlassCard>
                    ) : (
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)' }}>
                                        <th style={{ padding: '18px 24px', fontSize: '14px', color: 'var(--text-muted)' }}>المستلم / المرسل</th>
                                        <th style={{ padding: '18px 24px', fontSize: '14px', color: 'var(--text-muted)' }}>المبلغ</th>
                                        <th style={{ padding: '18px 24px', fontSize: '14px', color: 'var(--text-muted)' }}>السبب</th>
                                        <th style={{ padding: '18px 24px', fontSize: '14px', color: 'var(--text-muted)' }}>التاريخ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx, idx) => {
                                        const isOutgoing = tx.amount < 0;
                                        return (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="tx-row">
                                                <td style={{ padding: '18px 24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '50%' }}>
                                                            <User size={16} color="var(--text-dim)" />
                                                        </div>
                                                        <span style={{ fontWeight: 600, fontSize: '14px' }}>
                                                            {isOutgoing ? tx.to_user : (tx.from_user === 'SYSTEM' ? 'النظام' : tx.from_user)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '18px 24px' }}>
                                                    <div style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        color: isOutgoing ? '#ef4444' : '#22c55e',
                                                        fontWeight: 800, fontSize: '15px'
                                                    }}>
                                                        {isOutgoing ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                                                        {Math.abs(tx.amount).toLocaleString()} Orbs
                                                    </div>
                                                </td>
                                                <td style={{ padding: '18px 24px', fontSize: '14px', fontWeight: 600 }}>
                                                    <div style={{
                                                        display: 'inline-flex', padding: '6px 12px', background: 'rgba(255,255,255,0.05)',
                                                        borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)'
                                                    }}>
                                                        {formatReason(tx.reason)}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '18px 24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                                        <Clock size={14} />
                                                        {new Date((tx.created_at || "").replace(' ', 'T') + 'Z').toLocaleString('ar-SA', {
                                                            year: 'numeric', month: 'short', day: 'numeric',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .tx-row:hover { background: rgba(255,255,255,0.015); }
                th { text-align: right; }
            `}</style>
        </PageTransition>
    );
};

export default TransactionsPage;
