import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Play, Shield, BarChart, ExternalLink, Cpu } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const LandingPage = () => {
    return (
        <PageTransition>
            <div className="landing-page" style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                background: '#0b0c10',
                color: 'white',
                fontFamily: "'Outfit', sans-serif"
            }}>
                {/* Minimalist Navbar */}
                <header style={{
                    height: '80px',
                    padding: '0 5%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'absolute',
                    top: 0, width: '100%', zIndex: 100
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '12px', boxShadow: '0 0 20px var(--glass-glow)' }}>
                            <Zap size={22} fill="white" color="white" />
                        </div>
                        <span style={{ fontWeight: 900, fontSize: '24px', letterSpacing: '-1px' }}>UMBRAL</span>
                    </div>

                    <nav style={{ display: 'flex', gap: '40px', fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }} dir="rtl">
                        <a href="#" className="nav-hover">المميزات</a>
                        <a href="#" className="nav-hover">المصادر</a>
                        <a href="#" style={{ color: '#fbbf24' }}>بريميوم ✨</a>
                    </nav>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <a href="/api/auth/login" style={{
                            padding: '10px 25px', borderRadius: '10px',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                            fontSize: '14px', fontWeight: 700, color: 'white'
                        }}>دخول</a>
                    </div>
                </header>

                {/* Hero Section */}
                <main style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    textAlign: 'center', padding: '160px 5% 100px',
                    position: 'relative', overflow: 'hidden'
                }}>
                    {/* Background Glows */}
                    <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(88,101,242,0.1) 0%, transparent 70%)', zIndex: 0 }} />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                            padding: '8px 20px', borderRadius: '100px', fontSize: '13px', fontWeight: 700,
                            color: 'rgba(255,255,255,0.6)', marginBottom: '30px', zIndex: 1
                        }}
                    >
                        جديد: نظام إحصائيات متطور 🚀
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        style={{ fontSize: '72px', fontWeight: 950, lineHeight: 1.1, marginBottom: '25px', maxWidth: '900px', zIndex: 1, letterSpacing: '-2px' }}
                    >
                        اصنع خادم ديسكورد <br />
                        <span style={{ color: 'var(--primary)' }}>احترافي!</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', maxWidth: '600px', lineHeight: 1.6, marginBottom: '45px', zIndex: 1 }}
                        dir="rtl"
                    >
                        بوت متعدد الأغراض قابل للتخصيص جداً حيث يوفر لك تخصيص رسائل ترحيب وسجلات متعمقة وأوامر اجتماعية وإشراف وأكثر...
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ display: 'flex', gap: '20px', zIndex: 1 }}
                    >
                        <a href="/api/auth/login" className="btn-primary" style={{ padding: '16px 40px', fontSize: '17px', borderRadius: '12px' }}>
                            إضافة البوت في Discord
                        </a>
                        <a href="/api/auth/login" style={{
                            padding: '16px 40px', fontSize: '17px', borderRadius: '12px',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                            fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '10px'
                        }}>
                            لوحة التحكم
                        </a>
                    </motion.div>

                    {/* Features Grid Minimal */}
                    <div style={{ marginTop: '100px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', maxWidth: '1100px', width: '100%', zIndex: 1 }}>
                        <div style={{ padding: '30px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }} dir="rtl">
                            <Shield size={24} color="var(--primary)" style={{ marginBottom: '15px' }} />
                            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '10px' }}>حماية فائقة</h3>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>نظام حماية متطور يحمي سيرفرك من كل أنواع التخريب تلقائياً.</p>
                        </div>
                        <div style={{ padding: '30px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }} dir="rtl">
                            <BarChart size={24} color="#22c55e" style={{ marginBottom: '15px' }} />
                            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '10px' }}>إحصائيات ذكية</h3>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>تتبع تفاعل الأعضاء ونمو السيرفر من خلال رسوم بيانية دقيقة جداً.</p>
                        </div>
                        <div style={{ padding: '30px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }} dir="rtl">
                            <Cpu size={24} color="#a855f7" style={{ marginBottom: '15px' }} />
                            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '10px' }}>أداء مستقر</h3>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>بنية تحتية قوية تضمن عمل البوت 24/7 بدون أي تقطيع أو تأخير.</p>
                        </div>
                    </div>
                </main>

                <style>{`
                    .nav-hover:hover { color: white; transition: 0.3s; }
                `}</style>
            </div>
        </PageTransition>
    );
};

export default LandingPage;
