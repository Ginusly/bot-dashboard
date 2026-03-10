import React from 'react';
import { motion } from 'framer-motion';

const SidebarItem = ({ icon, label, active, onClick, dir = "rtl" }) => {
    return (
        <motion.div
            whileHover={{ x: dir === "rtl" ? -5 : 5, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`sidebar-nav-item ${active ? 'active' : ''}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 16px',
                borderRadius: '12px',
                cursor: 'pointer',
                color: active ? 'var(--text-main)' : 'var(--text-dim)',
                transition: 'color 0.2s ease',
                background: active ? 'var(--bg-card)' : 'transparent',
                border: active ? '1px solid var(--glass-border)' : '1px solid transparent',
            }}
        >
            <div style={{
                color: active ? 'var(--primary)' : 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {icon}
            </div>
            <span style={{ fontSize: '14px', fontWeight: active ? 600 : 500 }}>{label}</span>
            {active && (
                <motion.div
                    layoutId="active-pill"
                    className="active-indicator"
                    style={{
                        position: 'absolute',
                        [dir === "rtl" ? "right" : "left"]: 0,
                        width: '4px',
                        height: '20px',
                        background: 'var(--primary)',
                        borderRadius: '0 4px 4px 0',
                    }}
                />
            )}
        </motion.div>
    );
};

export default SidebarItem;
