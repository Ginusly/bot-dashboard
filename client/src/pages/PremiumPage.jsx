import React from 'react';
import { ShieldCheck, Zap, Globe, Cpu, Heart, Star, Sparkles, Gem, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';

const PremiumPage = () => {
    return (
        <PageTransition>
            <div className="main-content" dir="rtl">
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            style={{ display: 'inline-flex', background: 'rgba(147, 51, 234, 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '24px' }}
                        >
                            <ShieldCheck size={56} color="#a855f7" />
                        </motion.div>
                        <h1 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '15px' }}>عضوية التميز (Umbral Premium)</h1>
                        <p style={{ fontSize: '20px', color: 'var(--text-dim)', maxWidth: '700px', margin: '0 auto' }}>
                            ارتقِ بسيرفرك إلى المستوى التالي مع ميزات حصرية لم تسبقها مثيل.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '80px' }}>
                        <PricingCard
                            title="الفئة الذهبية (Gold)"
                            price="5$ / شهر"
                            desc="خيارات متقدمة لإدارة السيرفر."
                            features={['تخصيص كامل لرسائل الترحيب والبودرة', '5 بوتات بريميوم مجاناً', 'دور خاص في سيرفر الدعم', 'شارة (VIP) دائمة']}
                            color="#fbbf24"
                        />
                        <PricingCard
                            title="الفئة الماسية (Diamond)"
                            price="12$ / شهر"
                            desc="الحزمة الكاملة للمحترفين."
                            features={['جميع ميزات الفئة الذهبية', 'بوتات بريميوم بلا حدود', 'أولوية في الدعم الفني', 'دخول حصري لأوامر الذكاء الاصطناعي', 'لوحة تحكم خاصة بسيرفرك']}
                            color="#3b82f6"
                            popular
                        />
                        <PricingCard
                            title="الفئة الملكية (Royal)"
                            price="25$ / مدى الحياة"
                            desc="ادفع مرة واحدة واستمتع للأبد."
                            features={['جميع ميزات الفئات الأخرى للأبد', 'شارة (LEGEND) نادرة', 'اسم سيرفرك في القائمة الذهبية', 'إمكانية طلب ميزات خاصة من المطورين']}
                            color="#a855f7"
                        />
                    </div>

                    <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '40px', textAlign: 'center' }}>لماذا تختار Umbral Premium؟</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px' }}>
                        <Benefit icon={<Cpu />} title="سيرفرات فائقة السرعة" desc="نضمن لك سرعة استجابة لا تتعدى 20ms لتجربة خالية من التعليق." />
                        <Benefit icon={<Globe />} title="تخصيص غير محدود" desc="غيّر أي شيء في البوت من الاسم إلى الصورة والأوامر." />
                        <Benefit icon={<Zap />} title="ميزات ذكية" desc="أدوات تحليل ذكية ومراقب للسيرفرات يعمل على مدار الساعة." />
                        <Benefit icon={<ShieldCheck />} title="أمان مطلق" desc="نظام حماية من الاختراق والتخريب بأحدث التقنيات." />
                    </div>

                </div>
            </div>
        </PageTransition>
    );
};

const PricingCard = ({ title, price, desc, features, color, popular }) => (
    <motion.div whileHover={{ y: -10 }} style={{ position: popular ? 'relative' : 'static' }}>
        {popular && <div style={{ position: 'absolute', top: '-15px', right: '50%', transform: 'translateX(50%)', background: '#3b82f6', color: '#fff', padding: '5px 15px', borderRadius: '10px', fontSize: '13px', fontWeight: 900, zIndex: 2 }}>الأكثر طلباً</div>}
        <GlassCard style={{ padding: '40px', height: '100%', border: popular ? `1px solid ${color}33` : '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
                <h3 style={{ fontSize: '24px', fontWeight: 800, color: color, marginBottom: '10px' }}>{title}</h3>
                <div style={{ fontSize: '36px', fontWeight: 900 }}>{price}</div>
                <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginTop: '10px' }}>{desc}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 }}>
                {features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                        <Sparkles size={14} color={color} />
                        {f}
                    </div>
                ))}
            </div>

            <button className="btn-primary" style={{ width: '100%', background: popular ? color : 'rgba(255,255,255,0.05)', color: popular ? '#18181b' : '#fff' }}>
                اشترك الآن
            </button>
        </GlassCard>
    </motion.div>
);

const Benefit = ({ icon, title, desc }) => (
    <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {React.cloneElement(icon, { size: 28, color: '#3b82f6' })}
        </div>
        <div>
            <h4 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>{title}</h4>
            <p style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: 1.6 }}>{desc}</p>
        </div>
    </div>
);

export default PremiumPage;
