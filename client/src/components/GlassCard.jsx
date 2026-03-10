import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, className = "", delay = 0, style = {}, onClick }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: delay
            }}
            whileHover={{
                y: onClick ? -5 : -2,
                boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3)"
            }}
            onClick={onClick}
            className={`glass-card ${className}`}
            style={{
                ...style,
                cursor: onClick ? 'pointer' : 'default'
            }}
        >
            {children}
        </motion.div>
    );
};

export default GlassCard;
