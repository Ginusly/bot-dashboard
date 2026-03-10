import React, { useState, useEffect, useRef } from 'react';
import { Move, Type, Image as ImageIcon, MousePointer2, Plus, Trash2, Maximize, Users } from 'lucide-react';

const CanvasEditor = ({ initialConfig, backgroundUrl, onChange, type = 'welcome' }) => {
    // Default configs based on type
    const defaults = type === 'welcome' ? [
        { id: 'avatar', type: 'avatar', x: 100, y: 125, size: 80, color: '#ffffff' },
        { id: 'title', type: 'text', content: 'WELCOME', x: 350, y: 100, fontSize: 50, color: '#F0B232', align: 'center' },
        { id: 'username', type: 'username', x: 350, y: 150, fontSize: 40, color: '#ffffff', align: 'center' },
        { id: 'count', type: 'count', x: 350, y: 190, fontSize: 25, color: '#cccccc', align: 'center' }
    ] : [
        { id: 'avatar', type: 'avatar', x: 80, y: 100, size: 60, color: '#f47fff' },
        { id: 'title', type: 'text', content: 'THANK YOU', x: 300, y: 80, fontSize: 45, color: '#f47fff', align: 'center' },
        { id: 'username', type: 'username', x: 300, y: 130, fontSize: 35, color: '#ffffff', align: 'center' },
        { id: 'msg', type: 'text', content: 'FOR BOOSTING!', x: 300, y: 170, fontSize: 25, color: '#cccccc', align: 'center' }
    ];

    const [elements, setElements] = useState(initialConfig?.elements || defaults);
    const [selectedId, setSelectedId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Sync changes
    useEffect(() => {
        onChange({ elements });
    }, [elements]);

    // Draw Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        ctx.fillStyle = '#23272A';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const drawContent = () => {
            // Overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Elements
            elements.forEach(el => {
                ctx.save();
                if (el.type === 'avatar') {
                    ctx.beginPath();
                    ctx.arc(el.x, el.y, el.size, 0, Math.PI * 2);
                    ctx.fillStyle = '#7289DA';
                    ctx.fill();
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = el.color;
                    ctx.stroke();
                    // Icon
                    ctx.fillStyle = 'rgba(255,255,255,0.5)';
                    ctx.font = '20px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('Avatar', el.x, el.y + 5);
                } else {
                    ctx.font = `bold ${el.fontSize}px Arial`;
                    ctx.fillStyle = el.color;
                    ctx.textAlign = el.align || 'center';
                    const text = el.content || (el.type === 'username' ? 'Username' : 'Text');
                    ctx.fillText(text, el.x, el.y);
                }
                ctx.restore();

                // Selection Box
                if (selectedId === el.id) {
                    ctx.strokeStyle = '#00ff00';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);

                    if (el.type === 'avatar') {
                        ctx.strokeRect(el.x - el.size - 5, el.y - el.size - 5, el.size * 2 + 10, el.size * 2 + 10);
                        // Resize Handle
                        ctx.fillStyle = '#00ff00';
                        ctx.fillRect(el.x + el.size, el.y + el.size, 10, 10);
                    } else {
                        const metrics = ctx.measureText(el.content || 'Text');
                        const w = metrics.width;
                        const h = el.fontSize;
                        let x = el.x;
                        if (el.align === 'center') x -= w / 2;
                        if (el.align === 'right') x -= w;
                        ctx.strokeRect(x - 5, el.y - h, w + 10, h + 10);
                    }
                    ctx.setLineDash([]);
                }
            });
        };

        if (backgroundUrl) {
            const img = new window.Image();
            img.src = backgroundUrl;
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                drawContent();
            };
            img.onerror = drawContent;
        } else {
            drawContent();
        }

    }, [elements, backgroundUrl, selectedId]);

    // Mouse Handlers
    const getMousePos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (700 / rect.width),
            y: (e.clientY - rect.top) * (250 / rect.height)
        };
    };

    const handleMouseDown = (e) => {
        const pos = getMousePos(e);
        // Check hit
        // Reverse order to select top-most
        const hit = [...elements].reverse().find(el => {
            if (el.type === 'avatar') {
                return Math.hypot(el.x - pos.x, el.y - pos.y) < el.size;
            } else {
                return Math.abs(el.x - pos.x) < 100 && Math.abs(el.y - pos.y) < 30; // Approx Text Hitbox
            }
        });

        if (hit) {
            setSelectedId(hit.id);
            setIsDragging(true);
            setDragOffset({ x: pos.x - hit.x, y: pos.y - hit.y });
        } else {
            setSelectedId(null);
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !selectedId) return;
        const pos = getMousePos(e);

        setElements(prev => prev.map(el => {
            if (el.id === selectedId) {
                return { ...el, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
            }
            return el;
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const updateSelected = (key, val) => {
        if (!selectedId) return;
        setElements(prev => prev.map(el => el.id === selectedId ? { ...el, [key]: val } : el));
    };

    const addElement = (type) => {
        const newEl = {
            id: Date.now(),
            type,
            x: 350,
            y: 125,
            size: 60,
            fontSize: 30,
            color: '#ffffff',
            content: 'New Text',
            align: 'center'
        };
        setElements(prev => [...prev, newEl]);
        setSelectedId(newEl.id);
    };

    const deleteSelected = () => {
        if (!selectedId) return;
        setElements(prev => prev.filter(e => e.id !== selectedId));
        setSelectedId(null);
    };

    const selectedEl = elements.find(e => e.id === selectedId);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn-secondary" onClick={() => addElement('text')}><Type size={16} /> نص</button>
                <button className="btn-secondary" onClick={() => addElement('avatar')}><MousePointer2 size={16} /> صورة العضو</button>
                {type === 'welcome' && <button className="btn-secondary" onClick={() => addElement('count')}><Users size={16} /> عداد الأعضاء</button>}
                <div style={{ flex: 1 }}></div>
                <button className="btn-secondary" onClick={deleteSelected} disabled={!selectedId} style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
            </div>

            {/* Canvas */}
            <div
                style={{ border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'grab' }}
                onMouseLeave={handleMouseUp}
            >
                <canvas
                    ref={canvasRef}
                    width={700}
                    height={250}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                />
            </div>

            {/* Properties Panel */}
            {selectedEl && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>

                    <div className="form-group">
                        <label>حجم الخط / الحجم</label>
                        <input
                            type="range" min="10" max="200"
                            value={selectedEl.type === 'avatar' ? selectedEl.size : selectedEl.fontSize}
                            onChange={(e) => updateSelected(selectedEl.type === 'avatar' ? 'size' : 'fontSize', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-group">
                        <label>اللون (Color)</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="color" value={selectedEl.color} onChange={(e) => updateSelected('color', e.target.value)} />
                            <input type="text" value={selectedEl.color} onChange={(e) => updateSelected('color', e.target.value)} style={{ width: '100%' }} />
                        </div>
                    </div>

                    {(selectedEl.type === 'text') && (
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>النص (Text)</label>
                            <input type="text" value={selectedEl.content} onChange={(e) => updateSelected('content', e.target.value)} />
                        </div>
                    )}
                    {(selectedEl.type !== 'avatar') && (
                        <div className="form-group">
                            <label>المحاذاة</label>
                            <select value={selectedEl.align} onChange={(e) => updateSelected('align', e.target.value)}>
                                <option value="left">يسار</option>
                                <option value="center">وسط</option>
                                <option value="right">يمين</option>
                            </select>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CanvasEditor;
