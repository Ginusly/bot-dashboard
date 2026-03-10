import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Settings, Image as ImageIcon, Type, Move, Plus, Trash2, Layers, Download, Undo, Redo, ZoomIn, ZoomOut, Check, X, Users } from 'lucide-react';

const WelcomeEditor = ({ initialConfig, onChange, backgroundUrl }) => {
    // Default initial state
    const [elements, setElements] = useState(initialConfig?.elements || [
        { id: 'avatar', type: 'avatar', x: 50, y: 50, size: 80, color: '#ffffff', layer: 2 },
        { id: 'welcome', type: 'text', content: 'WELCOME', x: 350, y: 100, fontSize: 40, color: '#F0B232', align: 'center', fontFamily: 'Arial', fontWeight: 'bold', layer: 1 },
        { id: 'username', type: 'username', x: 350, y: 160, fontSize: 32, color: '#ffffff', align: 'center', fontFamily: 'Arial', fontWeight: 'normal', layer: 1 },
        { id: 'count', type: 'count', x: 350, y: 210, fontSize: 20, color: '#cccccc', align: 'center', fontFamily: 'Arial', fontWeight: 'normal', layer: 1 }
    ]);

    // Editor State
    const [selectedId, setSelectedId] = useState(null);
    const [scale, setScale] = useState(1);
    const containerRef = useRef(null);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Canvas Dimensions
    const CAN_W = 700;
    const CAN_H = 250;

    // Update parent only when elements change (debounced could be better but this is fine)
    useEffect(() => {
        onChange({ elements });
    }, [elements]);

    const addToHistory = (newElements) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newElements);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleUpdateElement = (id, updates) => {
        setElements(prev => {
            const next = prev.map(el => el.id === id ? { ...el, ...updates } : el);
            return next;
        });
    };

    const handleDragEnd = (id, info) => {
        // We need to calculate the actual position within the container
        // Since framer-motion drag uses transform, we want to update the actual x/y state
        // and reset the transform.
        // However, for a simple editor, updating state on drag end is easiest.
        // But getting exact coordinates relative to parent from 'info' can be tricky with scaling.
        // easier to track delta.

        // Actually, let's just stick to updating state.
        // NOTE: In a real advanced app, we'd use useDragControls or similar.
        // For now, we update state based on visual delta if possible, or simpler:
        // Let's rely on visuals first.
    };

    // Better Drag Approach: 
    // We bind component X/Y to state. When drag ends, we simply don't reset?
    // No, controlled drag in React is tricky. 
    // Let's use a simpler "Update on Drag" approach.

    const updatePosition = (id, newX, newY) => {
        handleUpdateElement(id, { x: newX, y: newY });
    };

    const selectedElement = elements.find(el => el.id === selectedId);

    // Tools
    const bringToFront = () => {
        if (!selectedElement) return;
        const maxLayer = Math.max(...elements.map(e => e.layer || 0));
        handleUpdateElement(selectedId, { layer: maxLayer + 1 });
    };

    const sendToBack = () => {
        if (!selectedElement) return;
        const minLayer = Math.min(...elements.map(e => e.layer || 0));
        handleUpdateElement(selectedId, { layer: minLayer - 1 });
    };

    const deleteElement = () => {
        if (!selectedId) return;
        setElements(prev => prev.filter(e => e.id !== selectedId));
        setSelectedId(null);
    };

    // Render Components
    return (
        <div className="welcome-editor" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Toolbar */}
            <div className="editor-toolbar" style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', gap: '8px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '12px' }}>
                    <button className="tool-btn" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}><ZoomOut size={18} /></button>
                    <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', width: '40px', justifyContent: 'center' }}>{Math.round(scale * 100)}%</span>
                    <button className="tool-btn" onClick={() => setScale(s => Math.min(2, s + 0.1))}><ZoomIn size={18} /></button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="tool-btn" onClick={bringToFront} disabled={!selectedId} title="Bring to Front"><Layers size={18} style={{ transform: 'rotate(180deg)' }} /></button>
                    <button className="tool-btn" onClick={sendToBack} disabled={!selectedId} title="Send to Back"><Layers size={18} /></button>
                    <button className="tool-btn danger" onClick={deleteElement} disabled={!selectedId} title="Delete"><Trash2 size={18} /></button>
                </div>
            </div>

            {/* Canvas Container */}
            <div className="canvas-wrapper" style={{
                width: '100%',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                background: '#0d0e12',
                padding: '40px',
                borderRadius: '16px',
                border: '1px solid var(--glass-border)'
            }}>
                <div
                    ref={containerRef}
                    className="canvas-area"
                    style={{
                        position: 'relative',
                        width: CAN_W,
                        height: CAN_H,
                        transform: `scale(${scale})`,
                        transformOrigin: 'center center',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        overflow: 'hidden',
                        backgroundColor: '#23272A', // default discord dark
                        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        transition: 'box-shadow 0.3s ease'
                    }}
                    onClick={() => setSelectedId(null)}
                >
                    {/* Content Overlay */}
                    <AnimateElements
                        elements={elements}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onUpdate={updatePosition}
                        onEdit={handleUpdateElement}
                    />

                    {/* Guidelines (Visual only) */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        border: '1px solid rgba(255,255,255,0.1)',
                        pointerEvents: 'none',
                        zIndex: 1000
                    }} />
                </div>
            </div>

            {/* Properties Panel */}
            {selectedElement && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="properties-panel"
                    style={{
                        background: 'rgba(30, 31, 34, 0.8)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '16px',
                        padding: '24px'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Settings size={18} /> خصائص العنصر
                        </h4>
                        <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                            {selectedElement.type.toUpperCase()}
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>

                        {/* Position */}
                        <div className="prop-group">
                            <label>الموقع (X, Y)</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="number" value={Math.round(selectedElement.x)} onChange={(e) => handleUpdateElement(selectedId, { x: Number(e.target.value) })} />
                                <input type="number" value={Math.round(selectedElement.y)} onChange={(e) => handleUpdateElement(selectedId, { y: Number(e.target.value) })} />
                            </div>
                        </div>

                        {/* Size / Font Size */}
                        <div className="prop-group">
                            <label>{selectedElement.type === 'avatar' ? 'الحجم' : 'حجم الخط'}</label>
                            <input
                                type="range"
                                min={selectedElement.type === 'avatar' ? 20 : 10}
                                max={selectedElement.type === 'avatar' ? 200 : 100}
                                value={selectedElement.type === 'avatar' ? selectedElement.size : selectedElement.fontSize}
                                onChange={(e) => handleUpdateElement(selectedId, selectedElement.type === 'avatar' ? { size: Number(e.target.value) } : { fontSize: Number(e.target.value) })}
                            />
                        </div>

                        {/* Color */}
                        <div className="prop-group">
                            <label>اللون</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input type="color" value={selectedElement.color} onChange={(e) => handleUpdateElement(selectedId, { color: e.target.value })} style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                                <input type="text" value={selectedElement.color} onChange={(e) => handleUpdateElement(selectedId, { color: e.target.value })} style={{ flex: 1 }} />
                            </div>
                        </div>

                        {/* Text Specific */}
                        {(selectedElement.type !== 'avatar') && (
                            <div className="prop-group" style={{ gridColumn: 'span 2' }}>
                                <label>المحتوى</label>
                                <input
                                    type="text"
                                    value={selectedElement.content || ''}
                                    onChange={(e) => handleUpdateElement(selectedId, { content: e.target.value })}
                                    disabled={selectedElement.type !== 'text'} // Other types have dynamic content
                                    style={{ width: '100%' }}
                                />
                            </div>
                        )}

                        {selectedElement.type !== 'avatar' && (
                            <div className="prop-group">
                                <label>المحاذاة</label>
                                <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
                                    {['left', 'center', 'right'].map(align => (
                                        <button
                                            key={align}
                                            onClick={() => handleUpdateElement(selectedId, { align })}
                                            style={{
                                                flex: 1,
                                                background: selectedElement.align === align ? 'rgba(255,255,255,0.1)' : 'transparent',
                                                border: 'none',
                                                color: 'white',
                                                padding: '4px',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {align === 'left' ? '←' : align === 'center' ? '↔' : '→'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </motion.div>
            )}

            <style>{`
                .tool-btn {
                    background: transparent;
                    border: none;
                    color: rgba(255,255,255,0.7);
                    padding: 8px;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .tool-btn:hover:not(:disabled) {
                    background: rgba(255,255,255,0.1);
                    color: white;
                }
                .tool-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
                .tool-btn.danger:hover:not(:disabled) {
                    background: rgba(239, 68, 68, 0.2);
                    color: #EF4444;
                }
                
                .prop-group label {
                    display: block;
                    font-size: 12px;
                    color: rgba(255,255,255,0.5);
                    margin-bottom: 8px;
                    font-weight: 600;
                }
                
                .prop-group input[type="text"], .prop-group input[type="number"] {
                    width: 100%;
                    background: rgba(0,0,0,0.2);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 10px;
                    border-radius: 8px;
                    color: white;
                    font-size: 14px;
                }
                .prop-group input[type="range"] {
                    width: 100%;
                }
            `}</style>
        </div>
    );
};

// Sub-component for rendering elements naturally in DOM
const AnimateElements = ({ elements, selectedId, onSelect, onUpdate, onEdit }) => {
    return (
        <>
            {elements
                .sort((a, b) => (a.layer || 0) - (b.layer || 0))
                .map(el => (
                    <DraggableItem
                        key={el.id}
                        element={el}
                        isSelected={selectedId === el.id}
                        onSelect={() => onSelect(el.id)}
                        onUpdateDelta={(dx, dy) => onUpdate(el.id, el.x + dx, el.y + dy)}
                    />
                ))
            }
        </>
    );
};

const DraggableItem = ({ element, isSelected, onSelect, onUpdateDelta }) => {
    return (
        <motion.div
            drag
            dragMomentum={false}
            onDragEnd={(e, info) => {
                onUpdateDelta(info.offset.x, info.offset.y);
            }}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            style={{
                position: 'absolute',
                top: element.y, // We use top/left for initial pos, but drag uses transform. 
                // NOTE: This simple approach has a flaw: framer motion drag leaves the element transformed.
                // Resetting key matches state updates.
                left: element.x,
                cursor: isSelected ? 'grab' : 'pointer',
                zIndex: element.layer || 1,
                // Visuals
                padding: '4px',
                border: isSelected ? '2px solid #5865F2' : '2px solid transparent',
                borderRadius: element.type === 'avatar' ? '50%' : '4px',
            }}
            // Force re-render on pos change to reset transform if we updated x/y in parent
            key={`${element.id}-${element.x}-${element.y}`}
        >
            {element.type === 'avatar' ? (
                <div style={{
                    width: element.size,
                    height: element.size,
                    borderRadius: '50%',
                    background: '#7289DA',
                    border: `4px solid ${element.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                }}>
                    <Users size={element.size / 2} color="white" />
                </div>
            ) : (
                <div style={{
                    fontSize: element.fontSize,
                    color: element.color,
                    fontFamily: element.fontFamily || 'Arial',
                    fontWeight: element.fontWeight || 'normal',
                    whiteSpace: 'nowrap',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    textAlign: element.align || 'center',
                    minWidth: '50px' // hit area
                }}>
                    {element.type === 'username' ? 'Username' :
                        element.type === 'count' ? 'Member #100' :
                            element.content}
                </div>
            )}

            {/* Selection Handles (Visual Only for now) */}
            {isSelected && (
                <>
                    <div style={{ position: 'absolute', top: -6, left: -6, width: 10, height: 10, background: 'white', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', top: -6, right: -6, width: 10, height: 10, background: 'white', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', bottom: -6, left: -6, width: 10, height: 10, background: 'white', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', bottom: -6, right: -6, width: 10, height: 10, background: 'white', borderRadius: '50%' }} />
                </>
            )}
        </motion.div>
    );
};

export default WelcomeEditor;
