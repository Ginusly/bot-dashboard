import React, { useState, useEffect } from 'react';
import { db, doc, onSnapshot } from '../firebase';
import axios from 'axios';

const UserAvatar = ({ userId, user, size = 48, showFrame = true, className = "" }) => {
    const [profile, setProfile] = useState(null);
    const [frameItem, setFrameItem] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
        : `https://api.dicebear.com/7.x/initials/svg?seed=${userId || 'U'}`);

    useEffect(() => {
        const uid = userId || user?.id;
        if (!uid) return;

        // Listen to profile for frame
        const profRef = doc(db, 'user_profiles', uid);
        const unsub = onSnapshot(profRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProfile(data);
                if (data.current_frame) {
                    try {
                        const itemRes = await axios.get(`/api/shop/items`);
                        const foundFrame = itemRes.data.find(i => i.id === data.current_frame);
                        if (foundFrame) setFrameItem(foundFrame);
                        else setFrameItem(null);
                    } catch (e) {
                        setFrameItem(null);
                    }
                } else {
                    setFrameItem(null);
                }
            }
        });

        // Update avatar if changed
        if (user?.avatar) {
            setAvatarUrl(`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`);
        }

        return unsub;
    }, [userId, user]);

    const frameSize = size * 1.35; // Frame is larger than avatar
    const offset = (frameSize - size) / 2;

    return (
        <div style={{
            position: 'relative',
            width: `${size}px`,
            height: `${size}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
        }} className={className}>

            {/* Real Avatar */}
            <img
                src={avatarUrl}
                alt=""
                onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${userId || 'U'}`; }}
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover'
                }}
            />

            {/* Frame Overlay */}
            {showFrame && frameItem && (
                <div style={{
                    position: 'absolute',
                    width: `${frameSize}px`,
                    height: `${frameSize}px`,
                    top: `-${offset}px`,
                    left: `-${offset}px`,
                    pointerEvents: 'none',
                    zIndex: 2,
                }}>
                    {frameItem.is_css ? (
                        <div dangerouslySetInnerHTML={{ __html: frameItem.css_content }} style={{ width: '100%', height: '100%' }} />
                    ) : frameItem.image_url && frameItem.image_url.startsWith('http') ? (
                        <img
                            src={frameItem.image_url}
                            alt=""
                            onError={(e) => { e.target.style.display = 'none'; }}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    ) : (
                        <div style={{
                            width: '100%', height: '100%',
                            borderRadius: '50%',
                            border: `${Math.max(2, size * 0.05)}px solid ${frameItem.image_url || '#5865F2'}`,
                            boxShadow: `0 0 10px ${(frameItem.image_url || '#5865F2')}66, inset 0 0 5px ${(frameItem.image_url || '#5865F2')}44`,
                            boxSizing: 'border-box'
                        }} />
                    )}
                </div>
            )}
        </div>
    );
};

export default UserAvatar;
