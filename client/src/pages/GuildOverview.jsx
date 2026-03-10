import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ChannelSelector from '../components/ChannelSelector';
import WelcomeEditor from '../components/WelcomeEditor';
import GlassCard from '../components/GlassCard';
import SidebarItem from '../components/SidebarItem';
import PageTransition from '../components/PageTransition';
import axios from 'axios';
import {
    Settings, Bell, MessageSquare, BarChart, Shield, Users, ArrowLeft, Save,
    Trash2, Plus, Clock, Hash, Zap, FileText, Info, CheckCircle, AlertTriangle, Loader,
    Ticket, Coins, ExternalLink, UserPlus, Trophy, RefreshCw, Link, ShieldAlert,
    PlusCircle, XCircle, BookOpen as BookOpenIcon
} from 'lucide-react';

// ─── Toast Notification ────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
    }, [onClose]);

    const colors = {
        success: { bg: 'rgba(35, 165, 89, 0.15)', border: '#23a559', icon: <CheckCircle size={18} color="#23a559" /> },
        error: { bg: 'rgba(239, 68, 68, 0.15)', border: '#EF4444', icon: <AlertTriangle size={18} color="#EF4444" /> },
        info: { bg: 'rgba(88, 101, 242, 0.15)', border: 'var(--primary)', icon: <Info size={18} color="var(--primary)" /> }
    };
    const c = colors[type] || colors.info;

    return (
        <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            style={{
                position: 'fixed', bottom: '24px', left: '24px', zIndex: 9999,
                background: c.bg, border: `1px solid ${c.border}`, borderRadius: '12px',
                padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px',
                backdropFilter: 'blur(12px)', boxShadow: `0 8px 32px rgba(0,0,0,0.3)`, color: 'white',
                fontWeight: 600, fontSize: '14px', maxWidth: '320px'
            }}
        >
            {c.icon}
            {message}
        </motion.div>
    );
};

// ─── BookOpen SVG ──────────────────────────────────────────────────────────────
// This component is now redundant as BookOpenIcon is imported from lucide-react
// const BookOpenIcon = ({ size }) => (
//     <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
//         <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
//     </svg>
// );

// ─── Toggle Switch ─────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, color = 'var(--primary)' }) => (
    <label style={{ width: '52px', height: '28px', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
        <span style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: checked ? color : 'rgba(255,255,255,0.1)',
            transition: '.3s', borderRadius: '34px',
            boxShadow: checked ? `0 0 16px ${color}55` : 'none'
        }}>
            <span style={{
                position: 'absolute', height: '20px', width: '20px',
                left: checked ? '28px' : '4px', bottom: '4px',
                backgroundColor: 'white', transition: '.3s', borderRadius: '50%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}></span>
        </span>
    </label>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const GuildOverview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [guild, setGuild] = useState(null);
    const [settings, setSettings] = useState({});
    const [autoResponses, setAutoResponses] = useState([]);
    const [newTrigger, setNewTrigger] = useState('');
    const [newResponse, setNewResponse] = useState('');
    const [commands, setCommands] = useState([]);
    const [newCmdName, setNewCmdName] = useState('');
    const [newCmdResponse, setNewCmdResponse] = useState('');
    const [newCmdDesc, setNewCmdDesc] = useState('');
    const [isEmbedCmd, setIsEmbedCmd] = useState(false);
    const [isSlashCmd, setIsSlashCmd] = useState(false);
    const [azkarConfig, setAzkarConfig] = useState({ enabled: false, channel_id: '', send_morning: true, send_evening: true });
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [channels, setChannels] = useState([]);
    const [categories, setCategories] = useState([]);
    const [roles, setRoles] = useState([]);
    const [savingSettings, setSavingSettings] = useState({});
    const [toast, setToast] = useState(null);
    // Bot status
    const [botInGuild, setBotInGuild] = useState(true);
    // Orbs are now global
    // Tickets
    const [ticketConfig, setTicketConfig] = useState({ enabled: false, channel_id: '', category_id: '', support_roles: [] });
    const [tickets, setTickets] = useState([]);
    const [setupPanelLoading, setSetupPanelLoading] = useState(false);
    // Stats
    const [stats, setStats] = useState({ totalMembers: 0, totalXp: 0, topUser: null, totalTickets: 0 });
    // Shop
    const [shopItems, setShopItems] = useState([]);
    const [userInventory, setUserInventory] = useState([]);
    const [userProfile, setUserProfile] = useState({});
    const [buyingItem, setBuyingItem] = useState(null);
    // Leaderboard
    const [leaderboard, setLeaderboard] = useState([]);
    // Moderation & Shortcuts
    const [modConfig, setModConfig] = useState(null);
    const [shortcuts, setShortcuts] = useState([]);
    const [scName, setScName] = useState('');
    const [scTarget, setScTarget] = useState('');
    const [newBadWord, setNewBadWord] = useState('');


    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
    }, []);

    useEffect(() => {
        const fetchGuildData = async () => {
            try {
                const [
                    guildsRes, settingsRes, responsesRes, commandsRes, azkarRes,
                    notifRes, channelsRes, botRes, ticketConfigRes,
                    ticketsRes, categoriesRes, rolesRes, statsRes, shopItemsRes,
                    inventoryRes, profileRes, leaderboardRes, modConfigRes, shortcutsRes
                ] = await Promise.all([
                    axios.get('/api/guilds'),
                    axios.get(`/api/guilds/${id}/settings`).catch(() => ({ data: {} })),
                    axios.get(`/api/guilds/${id}/auto-responses`).catch(() => ({ data: [] })),
                    axios.get(`/api/guilds/${id}/commands`).catch(() => ({ data: [] })),
                    axios.get(`/api/guilds/${id}/azkar`).catch(() => ({ data: {} })),
                    axios.get(`/api/guilds/${id}/notifications`).catch(() => ({ data: [] })),
                    axios.get(`/api/guilds/${id}/channels`).catch(() => ({ data: [] })),
                    axios.get(`/api/guilds/${id}/bot-status`).catch(() => ({ data: { inGuild: true } })),
                    axios.get(`/api/guilds/${id}/tickets/config`).catch(() => ({ data: {} })),
                    axios.get(`/api/guilds/${id}/tickets`).catch(() => ({ data: [] })),
                    axios.get(`/api/guilds/${id}/categories`).catch(() => ({ data: [] })),
                    axios.get(`/api/guilds/${id}/roles`).catch(() => ({ data: [] })),
                    axios.get(`/api/guilds/${id}/stats`).catch(() => ({ data: {} })),
                    axios.get('/api/shop/items').catch(() => ({ data: [] })),
                    axios.get('/api/user/inventory').catch(() => ({ data: [] })),
                    axios.get('/api/user/profile').catch(() => ({ data: {} })),
                    axios.get(`/api/guilds/${id}/leaderboard`).catch(() => ({ data: [] })),
                    axios.get(`/api/guilds/${id}/moderation`).catch(() => ({ data: null })),
                    axios.get(`/api/guilds/${id}/shortcuts`).catch(() => ({ data: [] })),
                ]);

                setStats(statsRes.data || {});
                setShopItems(shopItemsRes.data || []);
                setUserInventory(inventoryRes.data || []);
                setUserProfile(profileRes.data || {});
                setLeaderboard(leaderboardRes.data || []);
                setModConfig(modConfigRes.data || null);
                setShortcuts(shortcutsRes.data || []);

                setChannels(channelsRes.data || []);
                setCategories(categoriesRes.data || []);
                setRoles(rolesRes.data || []);
                setBotInGuild(botRes.data?.inGuild !== false);
                const currentGuild = guildsRes.data.find(g => g.id === id);
                setGuild(currentGuild || {});
                setSettings(settingsRes.data || {});
                setAutoResponses(responsesRes.data || []);
                setCommands(commandsRes.data || []);
                const azkarData = azkarRes.data || {};
                setAzkarConfig({
                    enabled: Boolean(azkarData.enabled),
                    channel_id: azkarData.channel_id || '',
                    send_morning: azkarData.send_morning !== 0,
                    send_evening: azkarData.send_evening !== 0,
                    morning_time: azkarData.morning_time || '07:00',
                    evening_time: azkarData.evening_time || '18:00',
                });
                setNotifications(notifRes.data || []);
                const tc = ticketConfigRes.data || {};
                setTicketConfig({
                    enabled: Boolean(tc.enabled),
                    channel_id: tc.channel_id || '',
                    category_id: tc.category_id || '',
                    support_roles: Array.isArray(tc.support_roles) ? tc.support_roles : []
                });
                setTickets(ticketsRes.data || []);
            } catch (err) {
                console.error('Error fetching guild data:', err);
                showToast('فشل في تحميل بيانات السيرفر', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchGuildData();
    }, [id, showToast]);

    const handleSaveSetting = async (key, value) => {
        setSavingSettings(prev => ({ ...prev, [key]: true }));
        try {
            await axios.post(`/api/guilds/${id}/settings`, { key, value });
            setSettings(prev => ({ ...prev, [key]: value }));
            showToast('تم الحفظ بنجاح', 'success');
        } catch (err) {
            console.error('Error saving setting:', err);
            showToast('فشل في الحفظ', 'error');
        } finally {
            setSavingSettings(prev => ({ ...prev, [key]: false }));
        }
    };

    const handleSaveMultipleSettings = async (pairs) => {
        try {
            await Promise.all(pairs.map(([key, value]) =>
                axios.post(`/api/guilds/${id}/settings`, { key, value })
            ));
            const update = Object.fromEntries(pairs);
            setSettings(prev => ({ ...prev, ...update }));
            showToast('تم حفظ الإعدادات بنجاح', 'success');
        } catch (err) {
            showToast('فشل في الحفظ', 'error');
        }
    };

    const handleAddAutoResponse = async () => {
        if (!newTrigger || !newResponse) return showToast('يرجى ملء جميع الحقول', 'error');
        try {
            await axios.post(`/api/guilds/${id}/auto-responses`, { trigger: newTrigger, response: newResponse });
            const res = await axios.get(`/api/guilds/${id}/auto-responses`);
            setAutoResponses(res.data);
            setNewTrigger('');
            setNewResponse('');
            showToast('تم إضافة الرد التلقائي', 'success');
        } catch (err) {
            showToast('فشل في الإضافة', 'error');
        }
    };

    const handleDeleteAutoResponse = async (responseId) => {
        try {
            await axios.delete(`/api/auto-responses/${responseId}`);
            setAutoResponses(prev => prev.filter(r => r.id !== responseId));
            showToast('تم الحذف', 'success');
        } catch (err) {
            showToast('فشل في الحذف', 'error');
        }
    };

    const handleAddCommand = async () => {
        if (!newCmdName || !newCmdResponse) return showToast('يرجى ملء الاسم والرد', 'error');
        const cleanName = newCmdName.toLowerCase().trim().replace(/\s+/g, '-');
        try {
            await axios.post(`/api/guilds/${id}/commands`, {
                command: cleanName,
                response: newCmdResponse,
                embed: isEmbedCmd ? 1 : 0,
                description: newCmdDesc,
                is_slash: isSlashCmd
            });
            const res = await axios.get(`/api/guilds/${id}/commands`);
            setCommands(res.data);
            setNewCmdName('');
            setNewCmdResponse('');
            setNewCmdDesc('');
            setIsEmbedCmd(false);
            setIsSlashCmd(false);
            showToast(isSlashCmd ? 'تم إضافة أمر السلاش! سيتم تسجيله تلقائياً.' : 'تم إضافة الأمر', 'success');
        } catch (err) {
            showToast('فشل في إضافة الأمر', 'error');
        }
    };

    const handleDeleteCommand = async (cmdId) => {
        try {
            await axios.delete(`/api/commands/${cmdId}`);
            setCommands(prev => prev.filter(c => c.id !== cmdId));
            showToast('تم الحذف', 'success');
        } catch (err) {
            showToast('فشل في الحذف', 'error');
        }
    };

    const handleSaveAzkar = async () => {
        try {
            await axios.post(`/api/guilds/${id}/azkar`, {
                ...azkarConfig,
                enabled: azkarConfig.enabled ? 1 : 0,
                send_morning: azkarConfig.send_morning ? 1 : 0,
                send_evening: azkarConfig.send_evening ? 1 : 0,
            });
            showToast('تم حفظ إعدادات الأذكار', 'success');
        } catch (err) {
            showToast('فشل في الحفظ', 'error');
        }
    };

    const handleTestAzkar = async () => {
        if (!azkarConfig.channel_id) return showToast('يرجى اختيار قناة أولاً', 'error');
        try {
            await axios.post(`/api/guilds/${id}/azkar/test`);
            showToast('تم إرسال رسالة تجريبية للقناة!', 'info');
        } catch (err) {
            showToast('فشل في إرسال الرسالة التجريبية', 'error');
        }
    };

    const handleBuyItem = async (itemId) => {
        setBuyingItem(itemId);
        try {
            await axios.post(`/api/shop/buy/${itemId}`);
            const [inv, profile] = await Promise.all([
                axios.get('/api/user/inventory'),
                axios.get('/api/user/profile')
            ]);
            setUserInventory(inv.data);
            setUserProfile(profile.data);
            showToast('تم الشراء بنجاح! 🎉', 'success');
        } catch (err) {
            showToast(err.response?.data?.error || 'فشل في الشراء', 'error');
        } finally {
            setBuyingItem(null);
        }
    };

    const handleEquipItem = async (itemId, type) => {
        try {
            await axios.post('/api/user/profile/equip', { itemId, type });
            const profile = await axios.get('/api/user/profile');
            setUserProfile(profile.data);
            showToast('تم تغيير مظهر البروفايل', 'success');
        } catch (err) {
            showToast('فشل في التجهيز', 'error');
        }
    };

    const inputStyle = {
        width: '100%', padding: '14px 18px',
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px', color: 'white', fontSize: '15px', fontFamily: 'inherit',
        outline: 'none', transition: 'border-color 0.2s ease'
    };

    const sidebarCategories = [
        {
            title: 'عام',
            items: [
                { id: 'overview', label: 'نظرة عامة', icon: <BarChart size={18} /> },
                { id: 'logs', label: 'السجلات والإشعارات', icon: <FileText size={18} /> },
                { id: 'settings', label: 'إعدادات السيرفر', icon: <Settings size={18} /> },
                { id: 'commands', label: 'الأوامر المخصصة', icon: <Zap size={18} /> },
            ]
        },
        {
            title: 'إسلاميات',
            items: [
                { id: 'azkar', label: 'نظام الأذكار', icon: <BookOpenIcon size={18} /> },
            ]
        },
        {
            title: 'الخصائص',
            items: [
                { id: 'welcome', label: 'الترحيب والمغادرة', icon: <Bell size={18} /> },
                { id: 'auto', label: 'الرد التلقائي', icon: <MessageSquare size={18} /> },
                { id: 'tickets', label: 'نظام التذاكر', icon: <Ticket size={18} /> },
                { id: 'leveling', label: 'نظام اللفلات 🏆', icon: <Trophy size={18} /> },
            ]
        },
        {
            title: 'الأمان والتحكم',
            items: [
                { id: 'moderation', label: 'نظام الرقابة', icon: <Shield size={18} /> },
                { id: 'shortcuts', label: 'اختصارات الأوامر', icon: <Link size={18} /> },
            ]
        }
    ];

    // Bot not in guild banner
    const BotNotInGuildBanner = () => (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '14px', padding: '18px 24px', marginBottom: '24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '16px', flexWrap: 'wrap'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle size={20} color="#EF4444" />
                </div>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '16px' }}>البوت غير موجود في هذا السيرفر</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '3px' }}>أضف البوت أولاً لتتمكن من تعديل الإعدادات وإدارة الميزات</div>
                </div>
            </div>
            <a
                href={`https://discord.com/api/oauth2/authorize?client_id=${import.meta.env.VITE_CLIENT_ID || ''}&permissions=8&scope=bot%20applications.commands&guild_id=${id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    background: 'linear-gradient(135deg, #5865F2, #4752C4)',
                    color: 'white', padding: '10px 20px', borderRadius: '10px',
                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px',
                    fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap',
                    boxShadow: '0 4px 16px rgba(88,101,242,0.3)'
                }}
            >
                <UserPlus size={16} /> إضافة البوت
            </a>
        </motion.div>
    );

    const renderTabContent = () => (
        <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
                {(() => {
                    switch (activeTab) {

                        // ── Overview ──────────────────────────────────────────
                        case 'overview':
                            return (
                                <div>
                                    <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '32px' }}>نظرة عامة</h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
                                        <GlassCard>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>اسم السيرفر</div>
                                            <div style={{ fontSize: '22px', fontWeight: 800 }}>{guild?.name || 'جاري التحميل...'}</div>
                                        </GlassCard>
                                        <GlassCard>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>الأعضاء المتفاعلين</div>
                                            <div style={{ fontSize: '28px', fontWeight: 900, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <Users size={24} color="#3b82f6" /> {stats.totalMembers}
                                            </div>
                                        </GlassCard>
                                        <GlassCard>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>إجمالي الـ XP</div>
                                            <div style={{ fontSize: '28px', fontWeight: 900, color: '#f0b232', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <Trophy size={24} color="#f0b232" /> {stats.totalXp.toLocaleString()}
                                            </div>
                                        </GlassCard>
                                        <GlassCard>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>التذاكر المفتوحة</div>
                                            <div style={{ fontSize: '28px', fontWeight: 900, color: '#9333EA' }}>{stats.totalTickets}</div>
                                        </GlassCard>
                                    </div>

                                    {stats.topUser && (
                                        <GlassCard style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #f0b232, #ff8c00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Trophy size={32} color="white" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>أكثر عضو متفاعل حالياً</div>
                                                <div style={{ fontSize: '24px', fontWeight: 900 }}>User ID: {stats.topUser.user_id}</div>
                                                <div style={{ fontSize: '16px', color: '#f0b232', fontWeight: 700 }}>المستوى {stats.topUser.level} • {stats.topUser.xp} XP</div>
                                            </div>
                                        </GlassCard>
                                    )}
                                </div>
                            );

                        // ── Settings ──────────────────────────────────────────
                        case 'settings':
                            return (
                                <div>
                                    <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '32px' }}>إعدادات السيرفر</h2>
                                    <GlassCard>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>بادئة الأوامر (Prefix)</label>
                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                    <input
                                                        key={`prefix-${settings.prefix}`}
                                                        type="text"
                                                        defaultValue={settings.prefix || '!'}
                                                        onBlur={(e) => handleSaveSetting('prefix', e.target.value)}
                                                        placeholder="!"
                                                        style={{ ...inputStyle, maxWidth: '200px' }}
                                                        maxLength={5}
                                                    />
                                                    {savingSettings.prefix && <Loader size={18} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', alignSelf: 'center' }} />}
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>الرتبة التلقائية عند الانضمام</label>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <Shield size={20} color="var(--primary)" />
                                                    <input
                                                        key={`auto_role-${settings.auto_role}`}
                                                        type="text"
                                                        defaultValue={settings.auto_role || ''}
                                                        onBlur={(e) => handleSaveSetting('auto_role', e.target.value)}
                                                        placeholder="ID الرتبة..."
                                                        style={{ ...inputStyle, fontFamily: 'monospace', maxWidth: '350px' }}
                                                    />
                                                </div>
                                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>الصقِ ID الرتبة من ديسكورد</p>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                                                <div>
                                                    <div style={{ fontWeight: 700 }}>تفعيل نظام الترحيب</div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>إرسال رسائل ترحيب للأعضاء الجدد</div>
                                                </div>
                                                <Toggle
                                                    checked={Boolean(settings.welcome_enabled)}
                                                    onChange={(e) => handleSaveSetting('welcome_enabled', e.target.checked ? 1 : 0)}
                                                />
                                            </div>
                                        </div>
                                    </GlassCard>
                                </div>
                            );

                        // ── Welcome ───────────────────────────────────────────
                        case 'welcome':
                            return (
                                <div>
                                    <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '32px' }}>الترحيب والمغادرة</h2>
                                    <GlassCard style={{ marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px', borderBottom: '1px solid var(--glass-border)' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '18px', fontWeight: 800 }}>تفعيل النظام</h3>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>إرسال رسائل ترحيب تلقائية للأعضاء</p>
                                                </div>
                                                <Toggle
                                                    checked={Boolean(settings.welcome_enabled)}
                                                    onChange={(e) => handleSaveSetting('welcome_enabled', e.target.checked ? 1 : 0)}
                                                />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>نوع الرسالة</label>
                                                    <select
                                                        value={settings.welcome_type || 'text'}
                                                        onChange={(e) => handleSaveSetting('welcome_type', e.target.value)}
                                                        style={{ ...inputStyle, cursor: 'pointer' }}
                                                    >
                                                        <option value="text">نص فقط</option>
                                                        <option value="embed">تضمين (Embed)</option>
                                                        <option value="image">صورة (Canvas) 🎨</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>قناة الترحيب</label>
                                                    <ChannelSelector channels={channels} value={settings.welcome_channel} onChange={(val) => handleSaveSetting('welcome_channel', val)} placeholder="اختر القناة" />
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>نص الترحيب</label>
                                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>متغيرات: <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>{'{user}'}</code> <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>{'{server}'}</code> <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>{'{count}'}</code></p>
                                                <textarea
                                                    key={`welcome_msg-${settings.welcome_message}`}
                                                    defaultValue={settings.welcome_message || 'مرحباً بك {user}!'}
                                                    onBlur={(e) => handleSaveSetting('welcome_message', e.target.value)}
                                                    rows={3}
                                                    style={{ ...inputStyle, resize: 'vertical' }}
                                                />
                                            </div>
                                        </div>
                                    </GlassCard>

                                    {settings.welcome_type === 'image' && (
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <h3 style={{ fontSize: '20px', fontWeight: 800 }}>تعديل صورة الترحيب</h3>
                                                <button className="btn-primary" onClick={() => handleSaveSetting('welcome_data', JSON.stringify(settings.welcome_data_obj || {}))} style={{ padding: '10px 20px' }}>
                                                    <Save size={16} /> حفظ التصميم
                                                </button>
                                            </div>
                                            <WelcomeEditor
                                                initialConfig={typeof settings.welcome_data === 'string' ? JSON.parse(settings.welcome_data || '{}') : settings.welcome_data}
                                                backgroundUrl={settings.welcome_image}
                                                onChange={(data) => setSettings(prev => ({ ...prev, welcome_data_obj: data }))}
                                            />
                                            <div style={{ marginTop: '16px' }}>
                                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>رابط خلفية الصورة</label>
                                                <input
                                                    key={`welcome_image-${settings.welcome_image}`}
                                                    type="text"
                                                    defaultValue={settings.welcome_image || ''}
                                                    onBlur={(e) => handleSaveSetting('welcome_image', e.target.value)}
                                                    placeholder="https://example.com/image.png"
                                                    style={inputStyle}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            );

                        // ── Commands ──────────────────────────────────────────
                        case 'commands':
                            return (
                                <div>
                                    <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '32px' }}>الأوامر المخصصة</h2>
                                    <GlassCard style={{ marginBottom: '24px' }}>
                                        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 800 }}>إضافة أمر جديد</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                                                <input type="text" value={newCmdName} onChange={(e) => setNewCmdName(e.target.value)} placeholder="اسم الأمر (بدون بادئة)" style={inputStyle} />
                                                <input type="text" value={newCmdResponse} onChange={(e) => setNewCmdResponse(e.target.value)} placeholder="الرد" style={inputStyle} />
                                            </div>
                                            <input type="text" value={newCmdDesc} onChange={(e) => setNewCmdDesc(e.target.value)} placeholder="وصف الأمر (للسلاش)" style={inputStyle} />
                                            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600 }}>
                                                    <Toggle checked={isEmbedCmd} onChange={(e) => setIsEmbedCmd(e.target.checked)} color="#9333EA" />
                                                    رسالة Embed
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600 }}>
                                                    <Toggle checked={isSlashCmd} onChange={(e) => setIsSlashCmd(e.target.checked)} color="#23a559" />
                                                    <span>أمر سلاش <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>/cmd</code></span>
                                                </label>
                                            </div>
                                            <button className="btn-primary" onClick={handleAddCommand} style={{ alignSelf: 'flex-start' }}>
                                                <Plus size={18} /> إضافة الأمر
                                            </button>
                                        </div>
                                    </GlassCard>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {commands.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '48px', opacity: 0.4 }}>لا توجد أوامر مضافة بعد</div>
                                        ) : (
                                            commands.map(cmd => (
                                                <GlassCard key={cmd.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                        <div style={{ background: cmd.is_slash ? 'rgba(35,165,89,0.2)' : 'rgba(88,101,242,0.2)', color: cmd.is_slash ? '#23a559' : 'var(--primary)', padding: '6px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '14px' }}>
                                                            {cmd.is_slash ? '/' : (settings.prefix || '!')}{cmd.command}
                                                        </div>
                                                        {cmd.embed && <span style={{ background: 'rgba(147,51,234,0.2)', color: '#9333EA', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Embed</span>}
                                                        <div style={{ opacity: 0.7, fontSize: '14px' }}>{cmd.response}</div>
                                                    </div>
                                                    <button onClick={() => handleDeleteCommand(cmd.id)} style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </GlassCard>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );

                        // ── Azkar ─────────────────────────────────────────────
                        case 'azkar':
                            return (
                                <div>
                                    <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '32px' }}>نظام الأذكار</h2>
                                    <GlassCard>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>تفعيل النظام</h3>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>إرسال الأذكار التلقائية في الأوقات المحددة</p>
                                                </div>
                                                <Toggle
                                                    checked={Boolean(azkarConfig.enabled)}
                                                    onChange={(e) => setAzkarConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                                                    color="#23a559"
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>قناة الأذكار</label>
                                                <ChannelSelector channels={channels} value={azkarConfig.channel_id} onChange={(val) => setAzkarConfig(prev => ({ ...prev, channel_id: val }))} placeholder="اختر قناة للأذكار..." />
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                        <label style={{ fontWeight: 700 }}>🌅 أذكار الصباح</label>
                                                        <Toggle checked={Boolean(azkarConfig.send_morning)} onChange={(e) => setAzkarConfig(prev => ({ ...prev, send_morning: e.target.checked }))} color="#FFD700" />
                                                    </div>
                                                    <input type="time" value={azkarConfig.morning_time || '07:00'} onChange={(e) => setAzkarConfig(prev => ({ ...prev, morning_time: e.target.value }))} style={inputStyle} />
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                        <label style={{ fontWeight: 700 }}>🌙 أذكار المساء</label>
                                                        <Toggle checked={Boolean(azkarConfig.send_evening)} onChange={(e) => setAzkarConfig(prev => ({ ...prev, send_evening: e.target.checked }))} color="#1E3A8A" />
                                                    </div>
                                                    <input type="time" value={azkarConfig.evening_time || '18:00'} onChange={(e) => setAzkarConfig(prev => ({ ...prev, evening_time: e.target.value }))} style={inputStyle} />
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <button className="btn-primary" onClick={handleSaveAzkar} style={{ flex: 1, justifyContent: 'center' }}>
                                                    <Save size={18} /> حفظ الإعدادات
                                                </button>
                                                <button
                                                    onClick={handleTestAzkar}
                                                    style={{ background: 'rgba(255,255,255,0.07)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontFamily: 'inherit' }}
                                                >
                                                    <Clock size={18} /> إرسال تجريبي
                                                </button>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </div>
                            );

                        // ── Auto Responses ────────────────────────────────────
                        case 'auto':
                            return (
                                <div>
                                    <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '32px' }}>الرد التلقائي</h2>
                                    <GlassCard style={{ marginBottom: '24px' }}>
                                        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 800 }}>إضافة رد جديد</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', opacity: 0.7 }}>الكلمة المفتاحية</label>
                                                    <input type="text" value={newTrigger} onChange={(e) => setNewTrigger(e.target.value)} placeholder="مثال: هلا" style={inputStyle} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', opacity: 0.7 }}>الرد</label>
                                                    <input type="text" value={newResponse} onChange={(e) => setNewResponse(e.target.value)} placeholder="مثال: أهلاً بك!" style={inputStyle}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddAutoResponse(); }}
                                                    />
                                                </div>
                                            </div>
                                            <button className="btn-primary" onClick={handleAddAutoResponse} style={{ alignSelf: 'flex-start' }}>
                                                <Plus size={18} /> إضافة رد
                                            </button>
                                        </div>
                                    </GlassCard>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {autoResponses.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '48px', opacity: 0.4 }}>لا توجد ردود تلقائية مضافة</div>
                                        ) : (
                                            autoResponses.map(ar => (
                                                <GlassCard key={ar.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                                        <div>
                                                            <span style={{ fontSize: '11px', opacity: 0.5, display: 'block', marginBottom: '4px' }}>المشغِّل</span>
                                                            <code style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px' }}>{ar.trigger}</code>
                                                        </div>
                                                        <div style={{ fontSize: '20px', opacity: 0.3 }}>→</div>
                                                        <div>
                                                            <span style={{ fontSize: '11px', opacity: 0.5, display: 'block', marginBottom: '4px' }}>الرد</span>
                                                            <span style={{ fontWeight: 600 }}>{ar.response}</span>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleDeleteAutoResponse(ar.id)} style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </GlassCard>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );

                        // ── Logs ──────────────────────────────────────────────
                        case 'logs':
                            return (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                        <h2 style={{ fontSize: '28px', fontWeight: 900 }}>السجلات والإشعارات</h2>
                                        {notifications.some(n => !n.read) && (
                                            <button
                                                onClick={async () => {
                                                    await axios.post(`/api/guilds/${id}/notifications/read`);
                                                    setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
                                                    showToast('تم تعليم الكل كمقروء', 'success');
                                                }}
                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                                            >
                                                تعليم الكل كمقروء
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {notifications.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '60px', opacity: 0.4 }}>ليس لديك أي إشعارات حالياً</div>
                                        ) : (
                                            notifications.map((notif, i) => (
                                                <GlassCard key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center', opacity: notif.read ? 0.6 : 1, padding: '16px 20px' }}>
                                                    <div style={{ background: 'rgba(88,101,242,0.15)', padding: '10px', borderRadius: '12px', flexShrink: 0 }}>
                                                        <Info size={20} color="var(--primary)" />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 700 }}>{notif.message}</div>
                                                        <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '4px' }}>{new Date(notif.created_at).toLocaleString('ar-SA')}</div>
                                                    </div>
                                                    {!notif.read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />}
                                                </GlassCard>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );

                        // ── Tickets ───────────────────────────────────────────
                        case 'tickets':
                            return (
                                <div>
                                    <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px' }}>نظام التذاكر 🎫</h2>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>إدارة نظام التذاكر — يمكن للأعضاء فتح تذاكر خاصة مع الإدارة</p>

                                    <GlassCard style={{ marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '18px', fontWeight: 800 }}>تفعيل النظام</h3>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>السماح للأعضاء بفتح تذاكر دعم</p>
                                                </div>
                                                <Toggle checked={Boolean(ticketConfig.enabled)} onChange={(e) => setTicketConfig(prev => ({ ...prev, enabled: e.target.checked }))} color="#5865F2" />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>📌 قناة لوحة التذاكر</label>
                                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>قناة سيرسل البوت فيها الـ Embed الذي يحتوي زر فتح التذكرة</p>
                                                <ChannelSelector channels={channels} value={ticketConfig.channel_id} onChange={(val) => setTicketConfig(prev => ({ ...prev, channel_id: val }))} placeholder="اختر قناة التذاكر..." />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>📁 الفئة (Category)</label>
                                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>الفئة التي ستُنشأ فيها قنوات التذاكر (اختياري)</p>
                                                <select value={ticketConfig.category_id || ''} onChange={(e) => setTicketConfig(prev => ({ ...prev, category_id: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                                                    <option value="">بدون فئة</option>
                                                    {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                                                </select>
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>🛡️ رتب الدعم (Support Roles)</label>
                                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>هذه الرتب ستُذكر عند فتح تذكرة وتملك صلاحية رؤية جميع التذاكر</p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                                    {ticketConfig.support_roles.map(roleId => {
                                                        const role = roles.find(r => r.id === roleId);
                                                        return (
                                                            <div key={roleId} style={{ background: 'rgba(88,101,242,0.15)', border: '1px solid rgba(88,101,242,0.3)', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: role?.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#5865F2', flexShrink: 0 }} />
                                                                {role?.name || roleId}
                                                                <button onClick={() => setTicketConfig(prev => ({ ...prev, support_roles: prev.support_roles.filter(r => r !== roleId) }))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0', lineHeight: 1 }}>✕</button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <select onChange={(e) => { if (e.target.value && !ticketConfig.support_roles.includes(e.target.value)) setTicketConfig(prev => ({ ...prev, support_roles: [...prev.support_roles, e.target.value] })); e.target.value = ''; }} style={{ ...inputStyle, cursor: 'pointer' }}>
                                                    <option value="">+ إضافة رتبة دعم</option>
                                                    {roles.filter(r => !ticketConfig.support_roles.includes(r.id)).map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
                                                </select>
                                            </div>

                                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                <button className="btn-primary" onClick={async () => {
                                                    try {
                                                        await axios.post(`/api/guilds/${id}/tickets/config`, ticketConfig);
                                                        showToast('تم حفظ إعدادات التذاكر', 'success');
                                                    } catch { showToast('فشل في الحفظ', 'error'); }
                                                }} style={{ flex: 1, justifyContent: 'center' }}>
                                                    <Save size={16} /> حفظ الإعدادات
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (!ticketConfig.channel_id) return showToast('اختر قناة أولاً', 'error');
                                                        setSetupPanelLoading(true);
                                                        try {
                                                            await axios.post(`/api/guilds/${id}/tickets/config`, ticketConfig);
                                                            await axios.post(`/api/guilds/${id}/tickets/setup-panel`);
                                                            showToast('تم إرسال لوحة التذاكر! تحقق من القناة.', 'info');
                                                        } catch { showToast('فشل في إعداد اللوحة', 'error'); } finally { setSetupPanelLoading(false); }
                                                    }}
                                                    disabled={setupPanelLoading}
                                                    style={{ background: 'rgba(88,101,242,0.15)', border: '1px solid rgba(88,101,242,0.3)', color: 'white', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontFamily: 'inherit' }}
                                                >
                                                    {setupPanelLoading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Ticket size={16} />}
                                                    إعداد لوحة التذاكر
                                                </button>
                                            </div>
                                        </div>
                                    </GlassCard>

                                    <GlassCard>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>📋 التذاكر ({tickets.length})</h3>
                                        </div>
                                        {tickets.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '40px', opacity: 0.4 }}>لا توجد تذاكر بعد</div>
                                        ) : tickets.slice(0, 15).map(t => (
                                            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--glass-border)', flexWrap: 'wrap', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ background: t.status === 'open' ? 'rgba(35,165,89,0.15)' : 'rgba(239,68,68,0.15)', color: t.status === 'open' ? '#23a559' : '#EF4444', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                                                        {t.status === 'open' ? '🟢 مفتوح' : '🔴 مغلق'}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '14px' }}>تذكرة #{t.id}</div>
                                                        <div style={{ fontSize: '12px', opacity: 0.5 }}>{t.reason?.slice(0, 60)}{t.reason?.length > 60 ? '...' : ''}</div>
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '12px', opacity: 0.5 }}>{new Date(t.created_at).toLocaleDateString('ar-SA')}</div>
                                            </div>
                                        ))}
                                    </GlassCard>
                                </div>
                            );

                        // ── Leveling ──────────────────────────────────────────
                        case 'leveling':
                            return (
                                <div>
                                    <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '32px' }}>نظام اللفلات 🏆</h2>
                                    <GlassCard>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '18px', fontWeight: 800 }}>تفعيل نظام الليفل</h3>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>يمنح الأعضاء نقاط خبرة عند التفاعل</p>
                                                </div>
                                                <Toggle checked={Boolean(settings.levels_enabled)} onChange={(e) => handleSaveSetting('levels_enabled', e.target.checked ? 1 : 0)} color="#f0b232" />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>📣 قناة رسائل الترقية</label>
                                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>القناة التي سيرسل فيها البوت رسالة عند وصول العضو لمستوى جديد</p>
                                                <ChannelSelector channels={channels} value={settings.level_up_channel} onChange={(val) => handleSaveSetting('level_up_channel', val)} placeholder="اختر القناة (أو نفس القناة)" />
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(240,178,50,0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(240,178,50,0.2)' }}>
                                                <Info size={20} color="#f0b232" />
                                                <div style={{ fontSize: '14px', color: '#f0b232', fontWeight: 600 }}>يتم منح 5 🔮 Orbs عند كل ترقية في المستوى كجائزة تلقائية.</div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </div>
                            );

                        // ── Moderation ────────────────────────────────────────
                        case 'moderation':
                            return <RenderModeration
                                id={id}
                                modConfig={modConfig}
                                setModConfig={setModConfig}
                                newBadWord={newBadWord}
                                setNewBadWord={setNewBadWord}
                                channels={channels}
                                roles={roles}
                                inputStyle={inputStyle}
                                showToast={showToast}
                            />;

                        // ── Shortcuts ─────────────────────────────────────────
                        case 'shortcuts':
                            return <RenderShortcuts
                                id={id}
                                shortcuts={shortcuts}
                                setShortcuts={setShortcuts}
                                scName={scName}
                                setScName={setScName}
                                scTarget={scTarget}
                                setScTarget={setScTarget}
                                settings={settings}
                                inputStyle={inputStyle}
                                showToast={showToast}
                            />;

                        default:
                            return <div style={{ textAlign: 'center', padding: '80px 20px', opacity: 0.5 }}><h3 style={{ fontSize: '24px', fontWeight: 900 }}>قيد التطوير</h3></div>;
                    }
                })()}
            </motion.div>
        </AnimatePresence>
    );

    if (loading) return (
        <div style={{ display: 'flex', height: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '40px', height: '40px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>جاري تحميل بيانات السيرفر...</div>
        </div>
    );

    return (
        <PageTransition>
            <div style={{ display: 'flex', height: '100%', position: 'relative', overflow: 'hidden' }}>
                <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)} />
                <div className={`sidebar-column ${isSidebarOpen ? 'open' : ''}`} dir="rtl">
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 14px', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', width: '100%', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '14px' }}>
                            <ArrowLeft size={16} /> العودة
                        </button>
                        <h2 style={{ fontSize: '16px', fontWeight: 800 }}>{guild?.name || 'إدارة السيرفر'}</h2>
                        {!botInGuild && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>
                                <AlertTriangle size={12} /> البوت غير موجود
                            </div>
                        )}
                        {guild?.id && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'monospace' }}>ID: {guild.id}</div>
                        )}
                    </div>
                    <div style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
                        {sidebarCategories.map((cat, i) => (
                            <div key={i} style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, opacity: 0.4, marginBottom: '8px', padding: '0 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>{cat.title}</div>
                                {cat.items.map(item => <SidebarItem key={item.id} icon={item.icon} label={item.label} active={activeTab === item.id} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} />)}
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ flex: 1, padding: '40px 52px', overflowY: 'auto' }} dir="rtl">
                    {/* Bot not in guild banner */}
                    {!botInGuild && <BotNotInGuildBanner />}
                    <div className="mobile-menu-btn" style={{ display: 'none', marginBottom: '24px' }}>
                        <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'white', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
                            <Hash size={18} color="var(--primary)" /><span>القائمة</span>
                        </button>
                    </div>
                    <style>{`@media (max-width: 768px) { .mobile-menu-btn { display: block !important; } }`}</style>
                    {renderTabContent()}
                </div>

                {/* Toast */}
                <AnimatePresence>
                    {toast && <Toast key={toast.message + Date.now()} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
};

// ─── Moderation Render ────────────────────────────────────────────────────────
const RenderModeration = ({ id, modConfig, setModConfig, newBadWord, setNewBadWord, channels, roles, inputStyle, showToast }) => {
    if (!modConfig) return <div style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</div>;

    const toggleMod = async (key, current) => {
        try {
            await axios.post(`/api/guilds/${id}/moderation`, { key, value: current ? 0 : 1 });
            setModConfig({ ...modConfig, [key]: current ? 0 : 1 });
            showToast('تم تحديث الإعداد بنجاح', 'success');
        } catch (e) { showToast('فشل تحديث الإعداد', 'error'); }
    };

    const updateArrayMod = async (key, newValue) => {
        try {
            await axios.post(`/api/guilds/${id}/moderation`, { key, value: newValue });
            setModConfig({ ...modConfig, [key]: newValue });
            showToast('تم تحديث الإعداد بنجاح', 'success');
        } catch (e) { showToast('فشل التحديث', 'error'); }
    };

    const addBadWord = () => {
        if (!newBadWord.trim()) return showToast('الرجاء إدخال كلمة', 'error');
        if (modConfig.bad_words.includes(newBadWord.trim())) return showToast('الكلمة موجودة بالفعل', 'info');
        const updated = [...modConfig.bad_words, newBadWord.trim()];
        updateArrayMod('bad_words', updated);
        setNewBadWord('');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800 }}>🛡️ نظام الرقابة والحماية</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>حالة النظام:</span>
                    <button
                        onClick={() => toggleMod('enabled', modConfig.enabled)}
                        style={{
                            background: modConfig.enabled ? 'rgba(35,165,89,0.1)' : 'rgba(239,68,68,0.1)',
                            color: modConfig.enabled ? '#23a559' : '#ef4444',
                            border: `1px solid ${modConfig.enabled ? 'rgba(35,165,89,0.2)' : 'rgba(239,68,68,0.2)'}`,
                            padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
                        }}
                    >
                        {modConfig.enabled ? 'مفعّل ✅' : 'معطّل ❌'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <GlassCard title="قواعد الرقابة" icon={<Shield size={20} color="#5865F2" />}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            { id: 'anti_spam', label: 'مكافحة السبام (التكرار)', desc: 'يمنع إرسال العديد من الرسائل في وقت قصير' },
                            { id: 'anti_link', label: 'منع الروابط العامة', desc: 'يمنع إرسال أي روابط http/https' },
                            { id: 'anti_invite', label: 'منع روابط الدعوة', desc: 'يمنع روابط ديسكورد (discord.gg)' },
                        ].map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{item.label}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.desc}</div>
                                </div>
                                <button onClick={() => toggleMod(item.id, modConfig[item.id])} style={{ background: 'none', border: 'none', color: modConfig[item.id] ? '#23a559' : 'rgba(255,255,255,0.2)', cursor: 'pointer' }}>
                                    {modConfig[item.id] ? <CheckCircle size={24} /> : <XCircle size={24} />}
                                </button>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                <GlassCard title="الكلمات الممنوعة" icon={<ShieldAlert size={20} color="#EF4444" />}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                        <input
                            type="text"
                            placeholder="أضف كلمة للمنع..."
                            value={newBadWord}
                            onChange={e => setNewBadWord(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addBadWord()}
                            style={inputStyle}
                        />
                        <button onClick={addBadWord} style={{ background: '#5865F2', color: 'white', border: 'none', borderRadius: '10px', padding: '0 15px', fontWeight: 700, cursor: 'pointer' }}>
                            <PlusCircle size={20} />
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {modConfig.bad_words.length === 0 ? (
                            <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0' }}>لا توجد كلمات ممنوعة حالياً</div>
                        ) : modConfig.bad_words.map(word => (
                            <div key={word} style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                {word}
                                <Trash2 size={14} style={{ cursor: 'pointer' }} onClick={() => updateArrayMod('bad_words', modConfig.bad_words.filter(w => w !== word))} />
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>

            <GlassCard title="الاستثناءات (Bypass)" icon={<AlertTriangle size={20} color="#FFD700" />}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 600 }}>الرومات المستثناة</div>
                        <select
                            multiple
                            style={{ ...inputStyle, height: '120px', width: '100%' }}
                            value={modConfig.ignored_channels}
                            onChange={e => {
                                const vals = Array.from(e.target.selectedOptions, opt => opt.value);
                                updateArrayMod('ignored_channels', vals);
                            }}
                        >
                            {channels.filter(c => c.type === 0).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>اضغط Ctrl للاختيار المتعدد</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 600 }}>الرولات المستثناة</div>
                        <select
                            multiple
                            style={{ ...inputStyle, height: '120px', width: '100%' }}
                            value={modConfig.ignored_roles}
                            onChange={e => {
                                const vals = Array.from(e.target.selectedOptions, opt => opt.value);
                                updateArrayMod('ignored_roles', vals);
                            }}
                        >
                            {roles.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};

// ─── Shortcuts Render ────────────────────────────────────────────────────────
const RenderShortcuts = ({ id, shortcuts, setShortcuts, scName, setScName, scTarget, setScTarget, settings, inputStyle, showToast }) => {
    const addShortcut = async () => {
        if (!scName.trim() || !scTarget.trim()) return showToast('الرجاء ملء جميع الحقول', 'error');
        try {
            await axios.post(`/api/guilds/${id}/shortcuts`, { name: scName.trim(), target_command: scTarget.trim() });
            const res = await axios.get(`/api/guilds/${id}/shortcuts`);
            setShortcuts(res.data);
            setScName('');
            setScTarget('');
            showToast('تم إضافة الاختصار بنجاح', 'success');
        } catch (e) { showToast('فشل إضافة الاختصار', 'error'); }
    };

    const deleteShortcut = async (sId) => {
        try {
            await axios.delete(`/api/shortcuts/${sId}`);
            setShortcuts(shortcuts.filter(s => s.id !== sId));
            showToast('تم حذف الاختصار بنجاح', 'success');
        } catch (e) { showToast('فشل حذف الاختصار', 'error'); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800 }}>⚡ اختصارات الأوامر</h2>

            <GlassCard title="إضافة اختصار جديد">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
                    <div>
                        <div style={{ fontSize: '14px', marginBottom: '8px' }}>اسم الاختصار (مثلاً: p)</div>
                        <input type="text" value={scName} onChange={e => setScName(e.target.value)} style={inputStyle} placeholder="p" />
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', marginBottom: '8px' }}>الأمر المستهدف (مثلاً: profail)</div>
                        <input type="text" value={scTarget} onChange={e => setScTarget(e.target.value)} style={inputStyle} placeholder="profail" />
                    </div>
                    <button onClick={addShortcut} style={{ background: 'var(--discord-blue)', color: 'white', border: 'none', borderRadius: '10px', height: '42px', padding: '0 24px', fontWeight: 700, cursor: 'pointer' }}>
                        إضافة
                    </button>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px' }}>
                    ملاحظة: إذا كانت الـ prefix هي `!`, فإن كتابة `!p` ستقوم تلقائياً بتنفيذ `!profail`.
                </div>
            </GlassCard>

            <GlassCard title="الاختصارات الحالية">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {shortcuts.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>لا توجد اختصارات بعد.</div>
                    ) : (
                        shortcuts.map(s => (
                            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ padding: '4px 10px', background: 'rgba(88,101,242,0.1)', color: 'var(--discord-blue)', borderRadius: '6px', fontWeight: 800, fontSize: '14px' }}>
                                        {settings?.prefix || '!'}{s.name}
                                    </div>
                                    <Zap size={14} color="var(--text-muted)" />
                                    <div style={{ fontSize: '14px', color: '#fff' }}>
                                        {settings?.prefix || '!'}{s.target_command}
                                    </div>
                                    {s.guild_id === 'GLOBAL' && <span style={{ fontSize: '10px', background: 'rgba(255,215,0,0.1)', color: '#FFD700', padding: '2px 6px', borderRadius: '4px' }}>عالمي</span>}
                                </div>
                                {s.guild_id !== 'GLOBAL' && (
                                    <button onClick={() => deleteShortcut(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}>
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </GlassCard>
        </div>
    );
};

export default GuildOverview;
