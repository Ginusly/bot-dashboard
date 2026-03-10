import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    ShoppingBag, Zap, CheckCircle2, Loader, AlertCircle,
    Image, Frame, Sparkles, ShieldCheck, CreditCard,
    Palette, Clock, ArrowRight, User, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import { db, collection, doc, onSnapshot } from '../firebase';

const ShopPage = () => {
    const [user, setUser] = useState(null);
    const [orbs, setOrbs] = useState(0);
    const [loading, setLoading] = useState(true);
    const [shopItems, setShopItems] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [profile, setProfile] = useState({});
    const [buyingItem, setBuyingItem] = useState(null);
    const [toast, setToast] = useState(null);
    const [filter, setFilter] = useState('all');
    const [previewItem, setPreviewItem] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchData = () => {
        if (!user?.id) return;

        const unsubOrbs = onSnapshot(doc(db, 'economy', `GLOBAL_${user.id}`), (s) => {
            if (s.exists()) setOrbs(s.data().balance || 0);
        });

        const unsubItems = onSnapshot(collection(db, 'shop_items'), (s) => {
            setShopItems(s.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });

        const unsubInv = onSnapshot(doc(db, 'user_inventory', user.id), (s) => {
            setInventory(s.exists() ? s.data().items || [] : []);
        });

        const unsubProf = onSnapshot(doc(db, 'user_profiles', user.id), (s) => {
            if (s.exists()) setProfile(s.data());
        });

        return () => { unsubOrbs(); unsubItems(); unsubInv(); unsubProf(); };
    };

    useEffect(() => {
        axios.get('/api/auth/user').then(res => setUser(res.data)).catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (user) return fetchData();
    }, [user]);

    const handleBuyItem = (item) => {
        if (orbs < item.price) return showToast('رصيدك غير كافٍ! 🔮', 'error');
        setConfirmModal(item);
    };

    const confirmPurchase = async () => {
        if (!confirmModal) return;
        setBuyingItem(confirmModal.id);
        try {
            const res = await axios.post(`/api/shop/buy/${confirmModal.id}`);
            if (res.data.success) showToast(`تم شراء ${confirmModal.name} بنجاح! 🎉`, 'success');
        } catch (err) {
            showToast(err.response?.data?.error || 'فشل الشراء', 'error');
        } finally {
            setBuyingItem(null);
            setConfirmModal(null);
        }
    };

    const handleEquip = async (item) => {
        try {
            const res = await axios.post('/api/user/profile/equip', { itemId: item.id, type: item.type });
            if (res.data.success) showToast(`تم تجهيز ${item.name} ✨`, 'success');
        } catch (err) {
            showToast('فشل في التحديث', 'error');
        }
    };

    const handleUnequip = async (type) => {
        try {
            const res = await axios.post('/api/user/profile/unequip', { type });
            if (res.data.success) showToast(`تم إلغاء التجهيز ❌`, 'info');
        } catch (err) {
            showToast('فشل الإجراء', 'error');
        }
    };

    const filteredItems = useMemo(() =>
        shopItems.filter(i => (filter === 'all' || i.type === filter) && i.type !== 'banner' && i.type !== 'badge')
        , [shopItems, filter]);

    const getRarityColor = (price) => {
        if (price >= 2000) return '#fbbf24'; // Legendary
        if (price >= 1000) return '#d946ef'; // Epic
        if (price >= 500) return '#8b5cf6';  // Rare
        return '#3b82f6'; // Common
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} style={{ width: '50px', height: '50px', border: '4px solid #3b82f6', borderRadius: '50%', borderTopColor: 'transparent' }} />
        </div>
    );

    return (
        <PageTransition>
            <div dir="rtl" style={{ minHeight: '100vh', background: '#09090b', color: '#fff', padding: '40px', paddingBottom: '120px', overflowY: 'visible' }}>

                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #3b82f6, #d946ef)', padding: '12px', borderRadius: '15px' }}>
                                <ShoppingBag size={28} />
                            </div>
                            <h1 style={{ fontSize: '36px', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>متجر المزايا</h1>
                        </motion.div>
                        <p style={{ color: '#a1a1aa', margin: '10px 0 0', fontSize: '16px' }}>خصص مظهرك في جميع السيرفرات بأغراض حصرية ونادرة</p>
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '15px 25px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(217, 70, 239, 0.2)', padding: '8px', borderRadius: '50%' }}>
                                <Zap size={20} color="#d946ef" fill="#d946ef" />
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#71717a', fontWeight: 700 }}>الرصيد المتوفر</div>
                                <div style={{ fontSize: '20px', fontWeight: 900 }}>{orbs.toLocaleString()} <span style={{ color: '#d946ef' }}>🔮</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px' }}>

                    {/* Sidebar / Filters & Preview */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <GlassCard style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Palette size={18} /> التصنيفات
                            </h3>
                            {[
                                { id: 'all', label: 'كل المعروضات', icon: Sparkles },
                                { id: 'background', label: 'خلفيات البروفايل', icon: Image },
                                { id: 'frame', label: 'إطارات الأفاتار', icon: Frame },
                            ].map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setFilter(cat.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '12px', border: 'none',
                                        background: filter === cat.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                        color: filter === cat.id ? '#3b82f6' : '#a1a1aa',
                                        cursor: 'pointer', transition: 'all 0.2s', fontWeight: 700, textAlign: 'right'
                                    }}
                                >
                                    <cat.icon size={18} /> {cat.label}
                                </button>
                            ))}
                        </GlassCard>

                        {/* Live Preview Card */}
                        <div style={{ position: 'sticky', top: '20px', height: 'fit-content' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase', marginBottom: '15px', paddingRight: '10px' }}>معاينة واقعية</h3>
                            <div style={{
                                width: '100%', height: '380px', borderRadius: '24px', overflow: 'hidden',
                                background: '#1c1c1f', border: '1px solid rgba(255,255,255,0.05)', position: 'relative',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                            }}>
                                {/* Background */}
                                {(() => {
                                    const equippedBgObj = shopItems.find(i => i.id === profile.current_background);
                                    const equippedBgUrl = equippedBgObj ? equippedBgObj.image_url : null;

                                    const equippedFrameObj = shopItems.find(i => i.id === profile.current_frame);
                                    const equippedFrameUrl = equippedFrameObj ? equippedFrameObj.image_url : null;
                                    const isEquippedFrameCss = equippedFrameObj && equippedFrameObj.is_css;

                                    const previewBgUrl = previewItem?.type === 'background' ? previewItem.image_url : equippedBgUrl;
                                    const previewFrameUrl = previewItem?.type === 'frame' ? previewItem.image_url : equippedFrameUrl;
                                    const isPreviewCss = previewItem?.type === 'frame' ? previewItem.is_css : isEquippedFrameCss;
                                    const previewCssContent = previewItem?.type === 'frame' ? previewItem.css_content : equippedFrameObj?.css_content;

                                    return (
                                        <>
                                            <div style={{
                                                height: '140px',
                                                backgroundImage: previewBgUrl ? `url(${previewBgUrl})` : 'none',
                                                backgroundColor: previewBgUrl ? 'transparent' : '#27272a',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                transition: 'all 0.3s ease-in-out'
                                            }} />

                                            <div style={{ padding: '20px', position: 'relative' }}>
                                                {/* Avatar with Frame */}
                                                <div style={{ position: 'absolute', top: '-50px', right: '20px', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <div style={{ width: '84px', height: '84px', borderRadius: '50%', overflow: 'hidden', border: '4px solid #1c1c1f', position: 'relative', zIndex: 2 }}>
                                                        <img
                                                            src={`https://cdn.discordapp.com/avatars/${user?.id}/${user?.avatar}.png?size=128`}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar"
                                                            onError={e => e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`}
                                                        />
                                                    </div>

                                                    {/* Frame Preview */}
                                                    {previewFrameUrl && !isPreviewCss && (
                                                        previewFrameUrl.startsWith('http') ? (
                                                            <img
                                                                src={previewFrameUrl}
                                                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3, objectFit: 'contain' }}
                                                                alt=""
                                                                onError={e => e.target.style.display = 'none'}
                                                            />
                                                        ) : (
                                                            <div style={{
                                                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                                                borderRadius: '50%', border: `6px solid ${previewFrameUrl}`,
                                                                boxShadow: `0 0 15px ${previewFrameUrl}66, inset 0 0 10px ${previewFrameUrl}44`,
                                                                zIndex: 3, boxSizing: 'border-box'
                                                            }} />
                                                        )
                                                    )}

                                                    {/* Custom CSS Frame */}
                                                    {isPreviewCss && previewCssContent && (
                                                        <div dangerouslySetInnerHTML={{ __html: previewCssContent }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3 }} />
                                                    )}
                                                </div>

                                                <div style={{ marginTop: '60px' }}>
                                                    <div style={{ fontSize: '26px', fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{user?.username}</div>
                                                    <div style={{ fontSize: '15px', color: '#a1a1aa', fontWeight: 600 }}>@{user?.username?.toLowerCase()}</div>

                                                    <div style={{ marginTop: '25px', background: 'rgba(0,0,0,0.4)', borderRadius: '16px', padding: '15px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                                                        {previewItem ? (
                                                            <div style={{ textAlign: 'center' }}>
                                                                <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>تتم الآن معاينة</div>
                                                                <div style={{ fontWeight: 900, fontSize: '16px' }}>{previewItem.name}</div>
                                                            </div>
                                                        ) : (
                                                            <div style={{ color: '#a1a1aa', fontSize: '14px', textAlign: 'center', fontWeight: 600 }}>مرر مؤشر الماوس على أي غرض في المتجر لمعاينته هنا</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Main Content / Shop Grid */}
                    <div>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={filter}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '25px' }}
                            >
                                {filteredItems.map(item => {
                                    const isOwned = inventory.includes(item.id);
                                    const isEquipped = profile.current_background === item.id || profile.current_frame === item.id;
                                    const rColor = getRarityColor(item.price);

                                    return (
                                        <motion.div
                                            key={item.id}
                                            onMouseEnter={() => setPreviewItem(item)}
                                            whileHover={{ y: -5 }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div style={{
                                                background: '#18181b', borderRadius: '24px', overflow: 'hidden',
                                                border: '1px solid rgba(255,255,255,0.05)', height: '100%',
                                                display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.3s'
                                            }} onMouseEnter={e => e.currentTarget.style.boxShadow = `0 10px 30px -10px ${rColor}44`}>

                                                {/* Image Area */}
                                                <div style={{ height: '160px', position: 'relative', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                    {item.type === 'background' ? (
                                                        item.is_css ? (
                                                            <div dangerouslySetInnerHTML={{ __html: item.css_content }} style={{ width: '100%', height: '100%' }} />
                                                        ) : (
                                                            <img src={item.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                                        )
                                                    ) : item.type === 'frame' ? (
                                                        <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
                                                            {item.is_css ? (
                                                                <div dangerouslySetInnerHTML={{ __html: item.css_content }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                                                            ) : item.image_url.startsWith('http') ? (
                                                                <img
                                                                    src={item.image_url}
                                                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                                                                    alt=""
                                                                    onError={e => e.target.style.display = 'none'}
                                                                />
                                                            ) : (
                                                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '50%', border: `6px solid ${item.image_url}`, boxShadow: `0 0 15px ${item.image_url}44` }} />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <img src={item.image_url} style={{ width: '80px', height: '80px', objectFit: 'contain' }} alt="" />
                                                    )}

                                                    <div style={{ position: 'absolute', top: '15px', left: '15px', background: 'rgba(0,0,0,0.6)', padding: '5px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: 800, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                        {item.price} 🔮
                                                    </div>
                                                </div>

                                                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                    <div style={{ marginBottom: '15px' }}>
                                                        <div style={{ color: rColor, fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '1px' }}>
                                                            {item.price >= 2000 ? 'LEGENDARY' : (item.price >= 1000 ? 'EPIC' : (item.price >= 500 ? 'RARE' : 'COMMON'))}
                                                        </div>
                                                        <h4 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{item.name}</h4>
                                                    </div>

                                                    <div style={{ marginTop: 'auto' }}>
                                                        {isOwned ? (
                                                            isEquipped ? (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleUnequip(item.type); }}
                                                                    style={{
                                                                        width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ef4444',
                                                                        background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 800, cursor: 'pointer'
                                                                    }}
                                                                >إلغاء التجهيز</button>
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleEquip(item); }}
                                                                    style={{
                                                                        width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #3b82f6',
                                                                        background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: 800, cursor: 'pointer'
                                                                    }}
                                                                >تجهيز</button>
                                                            )
                                                        ) : (
                                                            <button
                                                                disabled={buyingItem === item.id}
                                                                onClick={(e) => { e.stopPropagation(); handleBuyItem(item); }}
                                                                style={{
                                                                    width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                                                                    background: '#fff', color: '#000', fontWeight: 800, cursor: 'pointer',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                                                }}
                                                            >
                                                                {buyingItem === item.id ? <Loader size={18} className="spin" /> : <><CreditCard size={18} /> شراء</>}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Toast & Animations */}
                <div style={{ position: 'fixed', bottom: '40px', left: '40px', zIndex: 1000 }}>
                    <AnimatePresence>
                        {toast && (
                            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: toast.type === 'success' ? '#10b981' : '#ef4444', padding: '15px 30px', borderRadius: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                                {toast.type === 'success' ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
                                {toast.message}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Purchase Confirm Modal */}
                <AnimatePresence>
                    {confirmModal && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}
                            onClick={() => setConfirmModal(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                                onClick={e => e.stopPropagation()}
                                style={{ background: '#18181b', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                            >
                                <div style={{ background: 'rgba(139, 92, 246, 0.15)', display: 'inline-flex', padding: '15px', borderRadius: '50%', marginBottom: '20px' }}>
                                    <ShoppingBag size={32} color="#8b5cf6" />
                                </div>
                                <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '10px' }}>تأكيد الشراء</h2>
                                <p style={{ color: '#a1a1aa', fontSize: '15px', marginBottom: '25px', lineHeight: 1.6 }}>
                                    هل أنت متأكد أنك تريد شراء <strong>{confirmModal.name}</strong> مقابل <strong>{confirmModal.price} 🔮</strong>؟
                                </p>

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button
                                        onClick={confirmPurchase}
                                        disabled={buyingItem === confirmModal.id}
                                        style={{ flex: 1, background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        {buyingItem === confirmModal.id ? <Loader size={18} className="spin" /> : 'تأكيد وشراء'}
                                    </button>
                                    <button
                                        onClick={() => setConfirmModal(null)}
                                        disabled={buyingItem === confirmModal.id}
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <style>{`
                    .spin { animation: spin 1s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
            </div>
        </PageTransition>
    );
};


export default ShopPage;
