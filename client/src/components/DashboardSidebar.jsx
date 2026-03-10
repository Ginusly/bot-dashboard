import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, ShieldCheck, Cpu,
    Image, BadgeCheck, Palette,
    Trophy, Coins, Heart,
    Gift, ThumbsUp, History, LogOut, ShieldAlert
} from 'lucide-react';

const SidebarSection = ({ title, children }) => (
    <div style={{ marginBottom: '24px' }}>
        <div style={{
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            marginBottom: '12px',
            paddingRight: '12px'
        }}>
            {title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {children}
        </div>
    </div>
);

const SidebarLink = ({ to, icon: Icon, label, active, badge }) => (
    <Link to={to}>
        <motion.div
            whileHover={{ x: -4, backgroundColor: 'rgba(255,255,255,0.03)' }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                color: active ? 'var(--primary)' : 'var(--text-dim)',
                background: active ? 'rgba(88, 101, 242, 0.1)' : 'transparent',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                position: 'relative'
            }}
        >
            <Icon size={18} color={active ? 'var(--primary)' : 'currentColor'} />
            <span style={{ fontSize: '14px', fontWeight: active ? 700 : 600 }}>{label}</span>
            {badge && (
                <span style={{
                    position: 'absolute', left: '12px',
                    fontSize: '10px', background: 'var(--primary)',
                    color: 'white', padding: '2px 6px', borderRadius: '4px',
                    fontWeight: 800
                }}>{badge}</span>
            )}
        </motion.div>
    </Link>
);

import UserAvatar from './UserAvatar';
import UserBadges from './UserBadges';

const DashboardSidebar = ({ user }) => {
    const location = useLocation();

    return (
        <div className="sidebar-column" dir="rtl" style={{ padding: '24px 16px' }}>
            {/* User Profile Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px', padding: '0 8px' }}>
                <div style={{ position: 'relative' }}>
                    <UserAvatar user={user} size={44} />
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#22c55e', borderRadius: '50%', border: '2px solid var(--bg-darker)', zIndex: 10 }} />
                </div>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.username}</div>
                    <div style={{ marginTop: '4px' }}>
                        <UserBadges userId={user?.id} size={14} />
                    </div>
                </div>
            </div>

            <nav>
                <SidebarSection title="عام">
                    <SidebarLink to="/" icon={LayoutDashboard} label="نظرة عامة" active={location.pathname === '/'} />
                    <SidebarLink to="/premium" icon={ShieldCheck} label="عضوية التميز" active={location.pathname === '/premium'} badge="جديد" />
                    <SidebarLink to="/manage-bots" icon={Cpu} label="إدارة بوتات البريميوم" active={location.pathname === '/manage-bots'} />
                </SidebarSection>

                <SidebarSection title="متاجر الكريديت">
                    <SidebarLink to="/shop?cat=background" icon={Image} label="خلفيات البروفايل" active={location.pathname === '/shop' && !location.search.includes('frame')} />
                    <SidebarLink to="/badges" icon={BadgeCheck} label="شارات البروفايل" active={location.pathname === '/badges'} />
                    <SidebarLink to="/shop?cat=frame" icon={Palette} label="إطارات الأفاتار" active={location.pathname === '/shop' && location.search.includes('frame')} />
                </SidebarSection>

                <SidebarSection title="لائحة المتصدرين">
                    <SidebarLink to="/leaderboard/xp" icon={Trophy} label="أعلى 100 بواسطة XP" active={location.pathname === '/leaderboard/xp'} />
                    <SidebarLink to="/leaderboard/orbs" icon={Coins} label="أغنى 100 مليونير" active={location.pathname === '/leaderboard/orbs'} />
                    <SidebarLink to="/leaderboard/rep" icon={Heart} label="أعلى 100 بالسمعة" active={location.pathname === '/leaderboard/rep'} />
                </SidebarSection>

                <SidebarSection title="أخرى">
                    <SidebarLink to="/daily" icon={Gift} label="المكافآت اليومية" active={location.pathname === '/daily'} />
                    <SidebarLink to="/wallet" icon={Coins} label="المحفظة" active={location.pathname === '/wallet'} />
                    <SidebarLink to="/vote" icon={ThumbsUp} label="التصويت" active={location.pathname === '/vote'} />
                    <SidebarLink to="/transactions" icon={History} label="سجل العمليات" active={location.pathname === '/transactions'} />

                    <div style={{ marginTop: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
                        <div
                            onClick={() => {
                                localStorage.removeItem('umbral_user_hint');
                                window.location.href = '/api/auth/logout';
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                color: '#ef4444',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 700
                            }}
                        >
                            <LogOut size={18} />
                            <span>خروج</span>
                        </div>
                    </div>
                </SidebarSection>

                {user?.username === 'oq18x' && (
                    <SidebarSection title="المطور (oq18x)">
                        <SidebarLink to="/admin" icon={ShieldAlert} label="لوحة التحكم الحساسة" active={location.pathname === '/admin'} />
                    </SidebarSection>
                )}
            </nav>
        </div>
    );
};

export default DashboardSidebar;
