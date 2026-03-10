import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Zap, LogOut, User, Wallet, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import LandingPage from './pages/LandingPage';
import DashboardHome from './pages/DashboardHome';
import GuildOverview from './pages/GuildOverview';
import ProfilePage from './pages/ProfilePage';
import WalletPage from './pages/WalletPage';
import ShopPage from './pages/ShopPage';
import TransactionsPage from './pages/TransactionsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import DailyPage from './pages/DailyPage';
import BadgesPage from './pages/BadgesPage';
import PremiumPage from './pages/PremiumPage';
import PremiumBotsPage from './pages/PremiumBotsPage';
import AdminPage from './pages/AdminPage';
import UserAvatar from './components/UserAvatar';

axios.defaults.withCredentials = true;

// ─── Server Column ─────────────────────────────────────────────────────────────
const ServerColumn = ({ guilds, activeId, user }) => {
    const location = useLocation();
    const isWallet = location.pathname.startsWith('/wallet');
    const isHome = location.pathname === '/' || location.pathname === '';

    return (
        <div className="server-column">
            {/* 1. Profile at the Very Top */}
            <Link to="/profile">
                <motion.div
                    whileHover={{ borderRadius: '12px', scale: 1.05 }}
                    className={`server-item ${location.pathname === '/profile' ? 'active' : ''}`}
                    style={{
                        width: '48px', height: '48px',
                        borderRadius: location.pathname === '/profile' ? '12px' : '50%',
                        overflow: 'hidden', cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        border: location.pathname === '/profile' ? '2px solid var(--primary)' : '2px solid transparent',
                        boxShadow: location.pathname === '/profile' ? '0 0 16px rgba(88,101,242,0.4)' : 'none'
                    }}
                    title="بروفايلك الشخصي"
                >
                    <UserAvatar
                        user={user}
                        size={48}
                        className="server-item"
                    />
                </motion.div>
            </Link>

            <div style={{ width: '32px', height: '1px', background: 'var(--glass-border)', margin: '4px 0' }} />

            {/* 2. Primary Navigation */}
            <Link to="/">
                <motion.div
                    whileHover={{ borderRadius: '12px', backgroundColor: 'var(--primary)' }}
                    className={`server-item ${isHome ? 'active' : ''}`}
                    style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: isHome ? 'var(--primary)' : 'var(--bg-card)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.3s ease'
                    }}
                    title="الرئيسية"
                >
                    <Zap size={22} color="white" fill={isHome ? "white" : "none"} />
                </motion.div>
            </Link>

            <Link to="/wallet">
                <motion.div
                    whileHover={{ borderRadius: '12px', backgroundColor: '#3b82f6' }}
                    className={`server-item ${isWallet ? 'active' : ''}`}
                    style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: isWallet ? '#3b82f6' : 'var(--bg-card)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.3s ease'
                    }}
                    title="المحفظة"
                >
                    <Wallet size={22} color="white" />
                </motion.div>
            </Link>

            <Link to="/shop">
                <motion.div
                    whileHover={{ borderRadius: '12px', backgroundColor: '#f59e0b' }}
                    className={`server-item ${location.pathname === '/shop' ? 'active' : ''}`}
                    style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: location.pathname === '/shop' ? '#f59e0b' : 'var(--bg-card)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.3s ease'
                    }}
                    title="المتجر"
                >
                    <ShoppingBag size={22} color="white" />
                </motion.div>
            </Link>

            <div style={{ width: '32px', height: '1px', background: 'var(--glass-border)', margin: '4px 0' }} />

            {/* 3. Servers List */}
            {guilds.map(guild => (
                <Link to={`/guild/${guild.id}`} key={guild.id} title={guild.name}>
                    <motion.div
                        whileHover={{ borderRadius: '12px', scale: 1.05 }}
                        className={`server-item ${activeId === guild.id ? 'active' : ''}`}
                        style={{
                            width: '48px', height: '48px',
                            borderRadius: activeId === guild.id ? '12px' : '50%',
                            overflow: 'hidden', cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            border: activeId === guild.id ? '2px solid var(--primary)' : '2px solid transparent',
                            boxShadow: activeId === guild.id ? '0 0 16px rgba(88,101,242,0.4)' : 'none'
                        }}
                    >
                        <img
                            src={guild.icon
                                ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${guild.icon.startsWith('a_') ? 'gif' : 'png'}`
                                : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(guild.name)}&backgroundColor=5865F2`}
                            alt={guild.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </motion.div>
                </Link>
            ))}

            <div style={{ marginTop: 'auto', paddingBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                {user && (
                    <motion.div
                        whileHover={{ color: '#EF4444', scale: 1.1 }}
                        style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
                        onClick={() => {
                            localStorage.removeItem('umbral_user_hint');
                            window.location.href = '/api/auth/logout';
                        }}
                        title="تسجيل الخروج"
                    >
                        <LogOut size={20} />
                    </motion.div>
                )}
            </div>
        </div>
    );
};

import DashboardSidebar from './components/DashboardSidebar';

// ─── Main App ──────────────────────────────────────────────────────────────────
function AppContent() {
    const [user, setUser] = useState(null);
    const [guilds, setGuilds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userHint, setUserHint] = useState(null);
    const location = useLocation();

    const activeGuildId = location.pathname.startsWith('/guild/')
        ? location.pathname.split('/')[2]
        : null;

    const isDashboardPage = user && !activeGuildId && location.pathname !== '/landing';

    useEffect(() => {
        try {
            const hint = localStorage.getItem('umbral_user_hint');
            if (hint) setUserHint(JSON.parse(hint));
        } catch { /* ignore */ }

        const checkAuth = async () => {
            try {
                const [userRes, guildsRes] = await Promise.all([
                    axios.get('/api/auth/user'),
                    axios.get('/api/guilds').catch(() => ({ data: [] }))
                ]);

                const userData = userRes.data;
                setUser(userData);
                setGuilds(guildsRes.data || []);

                localStorage.setItem('umbral_user_hint', JSON.stringify({
                    id: userData.id,
                    username: userData.username,
                    avatar: userData.avatar
                }));
            } catch (err) {
                setUser(null);
                setGuilds([]);
                localStorage.removeItem('umbral_user_hint');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-darker)', flexDirection: 'column', gap: '20px' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{ width: '40px', height: '40px', border: '3px solid var(--primary)', borderRadius: '50%', borderTopColor: 'transparent' }}
                />
                {userHint && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ textAlign: 'center' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dim)', fontSize: '15px' }}>
                            {userHint.avatar && (
                                <UserAvatar user={userHint} size={32} showFrame={false} />
                            )}
                            <span>مرحباً مجدداً، <strong style={{ color: 'white' }}>{userHint.username}</strong> 👋</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>جاري التحقق من جلستك...</div>
                    </motion.div>
                )}
            </div>
        );
    }

    return (
        <div className="app-container" dir="rtl">
            {user && <ServerColumn guilds={guilds} activeId={activeGuildId} user={user} />}

            {isDashboardPage && <DashboardSidebar user={user} />}

            <div style={{ flex: 1, position: 'relative', overflowY: 'auto', overflowX: 'hidden' }}>
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        <Route path="/" element={user ? <DashboardHome /> : <LandingPage />} />
                        <Route path="/profile" element={user ? <ProfilePage /> : <LandingPage />} />
                        <Route path="/wallet" element={user ? <WalletPage /> : <LandingPage />} />
                        <Route path="/shop" element={user ? <ShopPage /> : <LandingPage />} />
                        <Route path="/guild/:id" element={user ? <GuildOverview /> : <LandingPage />} />
                        <Route path="/transactions" element={user ? <TransactionsPage /> : <LandingPage />} />
                        <Route path="/leaderboard/:type" element={user ? <LeaderboardPage /> : <LandingPage />} />
                        <Route path="/daily" element={user ? <DailyPage /> : <LandingPage />} />
                        <Route path="/badges" element={user ? <BadgesPage /> : <LandingPage />} />
                        <Route path="/premium" element={user ? <PremiumPage /> : <LandingPage />} />
                        <Route path="/manage-bots" element={user ? <PremiumBotsPage /> : <LandingPage />} />
                        <Route path="/admin" element={user?.username === 'oq18x' ? <AdminPage /> : <LandingPage />} />
                        <Route path="*" element={user ? <DashboardHome /> : <LandingPage />} />
                    </Routes>
                </AnimatePresence>
            </div>
        </div>
    );
}

export default AppContent;
