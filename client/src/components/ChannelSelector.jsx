import React, { useState, useEffect, useRef } from 'react';
import { Hash, Volume2, ChevronDown, Search, Megaphone, FolderOpen } from 'lucide-react';

const CHANNEL_TYPES = {
    0: { icon: <Hash size={14} />, label: 'نص' },
    2: { icon: <Volume2 size={14} />, label: 'صوت' },
    4: { icon: <FolderOpen size={14} />, label: 'فئة' },
    5: { icon: <Megaphone size={14} />, label: 'إعلانات' },
    13: { icon: <Volume2 size={14} />, label: 'ستاج' },
    15: { icon: <Hash size={14} />, label: 'فورم' },
};

const ChannelSelector = ({
    channels = [],
    value,
    onChange,
    placeholder = "اختر روم...",
    disabled = false,
    allowedTypes = null  // null = all text-like types, or pass array of type numbers
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    // Determine which channel types to show
    const visibleTypes = allowedTypes || [0, 5, 15]; // text, announcement, forum by default

    // Filter and sort channels
    const filteredChannels = channels
        .filter(ch => visibleTypes.includes(ch.type))
        .filter(ch => ch.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    // Group by parent category
    const grouped = {};
    const categoryMap = {};

    // Build category map
    channels.filter(ch => ch.type === 4).forEach(cat => {
        categoryMap[cat.id] = cat.name;
    });

    // Group channels
    filteredChannels.forEach(ch => {
        const catId = ch.parent_id || '__no_category__';
        if (!grouped[catId]) grouped[catId] = [];
        grouped[catId].push(ch);
    });

    const selectedChannel = channels.find(c => c.id === value);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getChannelIcon = (type) => {
        return CHANNEL_TYPES[type]?.icon || <Hash size={14} />;
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            {/* Trigger Button */}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isOpen ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '12px',
                    color: disabled ? 'rgba(255,255,255,0.3)' : 'white',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'border-color 0.2s ease'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedChannel ? (
                        <>
                            <span style={{ color: 'var(--primary)', display: 'flex' }}>
                                {getChannelIcon(selectedChannel.type)}
                            </span>
                            <span style={{ fontWeight: 600 }}>{selectedChannel.name}</span>
                        </>
                    ) : (
                        <span style={{ color: 'rgba(255,255,255,0.35)' }}>{placeholder}</span>
                    )}
                </div>
                <ChevronDown
                    size={16}
                    color="rgba(255,255,255,0.4)"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                />
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    background: '#1a1c2a',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    maxHeight: '320px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Search */}
                    <div style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px 10px'
                        }}>
                            <Search size={13} color="rgba(255,255,255,0.4)" />
                            <input
                                type="text"
                                placeholder="بحث عن روم..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    background: 'transparent', border: 'none', color: 'white',
                                    width: '100%', outline: 'none', padding: '0', fontSize: '13px'
                                }}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Clear option */}
                    {value && (
                        <div
                            onClick={() => { onChange(''); setIsOpen(false); setSearchTerm(''); }}
                            style={{
                                padding: '8px 12px', cursor: 'pointer', fontSize: '12px',
                                color: 'rgba(239,68,68,0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            ✕ إلغاء الاختيار
                        </div>
                    )}

                    {/* Channel list */}
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {filteredChannels.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>
                                لا توجد نتائج
                            </div>
                        ) : (
                            // Render grouped by category
                            Object.entries(grouped).map(([catId, chs]) => (
                                <div key={catId}>
                                    {catId !== '__no_category__' && categoryMap[catId] && (
                                        <div style={{
                                            padding: '8px 12px 4px',
                                            fontSize: '10px', fontWeight: 800,
                                            color: 'rgba(255,255,255,0.35)',
                                            textTransform: 'uppercase', letterSpacing: '1px'
                                        }}>
                                            {categoryMap[catId]}
                                        </div>
                                    )}
                                    {chs.map(ch => (
                                        <div
                                            key={ch.id}
                                            onClick={() => { onChange(ch.id); setIsOpen(false); setSearchTerm(''); }}
                                            style={{
                                                padding: '9px 16px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                background: ch.id === value ? 'rgba(88,101,242,0.15)' : 'transparent',
                                                transition: 'background 0.15s ease',
                                            }}
                                            onMouseEnter={e => { if (ch.id !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = ch.id === value ? 'rgba(88,101,242,0.15)' : 'transparent'; }}
                                        >
                                            <span style={{ color: ch.id === value ? 'var(--primary)' : 'rgba(255,255,255,0.4)', display: 'flex', flexShrink: 0 }}>
                                                {getChannelIcon(ch.type)}
                                            </span>
                                            <span style={{
                                                fontSize: '14px', fontWeight: ch.id === value ? 700 : 400,
                                                color: ch.id === value ? 'white' : 'rgba(255,255,255,0.8)'
                                            }}>
                                                {ch.name}
                                            </span>
                                            {ch.id === value && (
                                                <span style={{ marginRight: 'auto', marginLeft: 0, fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>✓</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>

                    <div style={{ padding: '6px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '11px', color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
                        {filteredChannels.length} قناة
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChannelSelector;
