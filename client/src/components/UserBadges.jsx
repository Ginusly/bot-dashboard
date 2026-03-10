import React, { useState, useEffect } from 'react';
import { Globe, Cpu, Terminal, Crown, Heart, Star, Shield, Zap, Gem, Trophy } from 'lucide-react';
import { db, doc, onSnapshot } from '../firebase';
import axios from 'axios';

const iconMap = {
    Globe: <Globe />,
    Cpu: <Cpu />,
    Terminal: <Terminal />,
    Crown: <Crown />,
    Heart: <Heart />,
    Star: <Star />,
    Shield: <Shield />,
    Zap: <Zap />,
    Gem: <Gem />,
    Trophy: <Trophy />
};

const UserBadges = ({ userId, size = 20 }) => {
    const [profile, setProfile] = useState(null);
    const [badges, setBadges] = useState([]);

    useEffect(() => {
        if (!userId) return;

        // Fetch all badges to get icons
        axios.get('/api/user/badges').then(res => setBadges(res.data)).catch(() => { });

        const profRef = doc(db, 'user_profiles', userId);
        const unsub = onSnapshot(profRef, (docSnap) => {
            if (docSnap.exists()) setProfile(docSnap.data());
        });

        return unsub;
    }, [userId]);

    if (!profile?.badges || profile.badges.length === 0) return null;

    return (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {profile.badges.map(badgeId => {
                const badge = badges.find(b => b.id === badgeId);
                if (!badge) return null;
                return (
                    <div
                        key={badgeId}
                        title={badge.name}
                        style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '4px',
                            color: badge.color || '#fff'
                        }}
                    >
                        {React.cloneElement(iconMap[badge.icon] || <Star />, { size: size * 0.7 })}
                    </div>
                );
            })}
        </div>
    );
};

export default UserBadges;
