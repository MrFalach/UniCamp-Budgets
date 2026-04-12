'use client';

import { useState, useEffect, useRef } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
const HEART_COLORS = [
    '#ff6b6b', '#ff85a1', '#ffa07a', '#ffb347', '#ff6ec7',
    '#da70d6', '#ff4500', '#ff1493', '#ff69b4', '#e74c3c',
    '#f39c12', '#e056fd', '#ff7979', '#fd79a8', '#e17055',
];

const NAME_EFFECTS: Array<{
    style: React.CSSProperties;
    className?: string;
    keyframes?: string;
}> = [
    // 0 — Neon glow pulse
    {
        style: {
            color: '#00ffff',
            textShadow: '0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 20px #0088ff, 0 0 30px #0088ff',
            animation: 'credit-neon-pulse 1.5s ease-in-out infinite',
        },
        keyframes: `@keyframes credit-neon-pulse {
            0%, 100% { opacity: 1; text-shadow: 0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 20px #0088ff; }
            50% { opacity: 0.8; text-shadow: 0 0 2px #00ffff, 0 0 5px #00ffff, 0 0 10px #0088ff; }
        }`,
    },
    // 1 — Rainbow gradient scroll
    {
        style: {
            background: 'linear-gradient(90deg, #ff0000, #ff7700, #ffff00, #00ff00, #0077ff, #8800ff, #ff0000)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            animation: 'credit-rainbow 2s linear infinite',
        },
        keyframes: `@keyframes credit-rainbow {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
        }`,
    },
    // 2 — Glitch flicker
    {
        style: {
            color: '#ff3366',
            animation: 'credit-glitch 0.3s ease-in-out infinite alternate',
        },
        keyframes: `@keyframes credit-glitch {
            0% { text-shadow: 2px 0 #00ffff, -2px 0 #ff0066; transform: translate(0); }
            25% { text-shadow: -2px 0 #00ffff, 2px 0 #ff0066; transform: translate(1px, -1px); }
            50% { text-shadow: 1px 0 #00ffff, -1px 0 #ff0066; transform: translate(-1px, 1px); }
            75% { text-shadow: -1px 0 #00ffff, 1px 0 #ff0066; transform: translate(1px, 0); }
            100% { text-shadow: 2px 0 #00ffff, -2px 0 #ff0066; transform: translate(0); }
        }`,
    },
    // 3 — Gold shimmer
    {
        style: {
            background: 'linear-gradient(90deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)',
            backgroundSize: '300% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            animation: 'credit-gold 2s ease-in-out infinite',
        },
        keyframes: `@keyframes credit-gold {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }`,
    },
    // 4 — Electric zap
    {
        style: {
            color: '#ffff00',
            textShadow: '0 0 8px #ffff00, 0 0 15px #ff8800',
            animation: 'credit-zap 0.15s ease-in-out infinite alternate',
        },
        keyframes: `@keyframes credit-zap {
            0% { opacity: 1; text-shadow: 0 0 8px #ffff00, 0 0 15px #ff8800; }
            100% { opacity: 0.7; text-shadow: 0 0 3px #ffff00, 0 0 8px #ff8800; }
        }`,
    },
    // 5 — Floating bounce
    {
        style: {
            color: '#a78bfa',
            textShadow: '0 0 10px #a78bfa80',
            animation: 'credit-float 2s ease-in-out infinite',
            display: 'inline-block',
        },
        keyframes: `@keyframes credit-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
        }`,
    },
    // 6 — Fire gradient
    {
        style: {
            background: 'linear-gradient(180deg, #ff4500, #ff8c00, #ffd700, #ff4500)',
            backgroundSize: '100% 300%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            animation: 'credit-fire 1.5s ease-in-out infinite',
        },
        keyframes: `@keyframes credit-fire {
            0% { background-position: 50% 100%; }
            50% { background-position: 50% 0%; }
            100% { background-position: 50% 100%; }
        }`,
    },
    // 7 — Matrix green typewriter
    {
        style: {
            color: '#00ff41',
            textShadow: '0 0 5px #00ff41, 0 0 10px #00ff4180',
            fontWeight: 'bold',
            animation: 'credit-matrix 1s steps(1) infinite',
        },
        keyframes: `@keyframes credit-matrix {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.85; text-shadow: 0 0 8px #00ff41, 0 0 16px #00ff4160; }
        }`,
    },
    // 8 — Pulsing scale
    {
        style: {
            color: '#f472b6',
            textShadow: '0 0 8px #f472b680',
            animation: 'credit-pulse-scale 1.2s ease-in-out infinite',
            display: 'inline-block',
        },
        keyframes: `@keyframes credit-pulse-scale {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
        }`,
    },
    // 9 — Aurora borealis
    {
        style: {
            background: 'linear-gradient(90deg, #00c6ff, #0072ff, #7c3aed, #f472b6, #00c6ff)',
            backgroundSize: '300% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            animation: 'credit-aurora 3s ease-in-out infinite',
        },
        keyframes: `@keyframes credit-aurora {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }`,
    },
];

const WALK_DURATION = 6000; // ms for heart to walk across screen
const WALK_INTERVAL = 25000; // ms between walks

// Split text into parts
const BEFORE = 'Made With ';
const HEART = '❤️';
const AFTER = ' By ';
const NAME = 'MrFalach';
const TARGET_TEXT = BEFORE + HEART + AFTER + NAME;

/** Walking heart component — fixed overlay that walks across the bottom of the screen */
const WalkingHeart = ({ color, onDone }: { color: string; onDone: () => void }) => {
    const [phase, setPhase] = useState<'grow' | 'walk'>('grow');
    const onDoneRef = useRef(onDone);
    onDoneRef.current = onDone;

    useEffect(() => {
        // Grow legs for 0.6s at left edge, then walk across
        const t1 = setTimeout(() => setPhase('walk'), 600);
        const t2 = setTimeout(() => onDoneRef.current(), WALK_DURATION);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    return (
        <div
            className="fixed z-[9999] pointer-events-none"
            style={{
                bottom: '24px',
                left: '-30px',
                animation: phase === 'walk'
                    ? `credit-heart-walk ${WALK_DURATION - 600}ms linear forwards`
                    : undefined,
            }}
        >
            {/* Heart body with bounce */}
            <div
                style={{
                    fontSize: '20px',
                    filter: `drop-shadow(0 0 8px ${color})`,
                    animation: phase === 'walk' ? 'credit-heart-bob 0.3s ease-in-out infinite' : undefined,
                }}
            >
                ❤️
            </div>
            {/* Legs container */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '4px',
                    marginTop: '-4px',
                    opacity: 1,
                    transform: 'scaleY(1)',
                    transformOrigin: 'top',
                    transition: 'transform 0.4s ease-in-out, opacity 0.4s ease-in-out',
                }}
            >
                {/* Left leg */}
                <div
                    style={{
                        width: '2px',
                        height: '10px',
                        backgroundColor: color,
                        borderRadius: '0 0 2px 2px',
                        transformOrigin: 'top',
                        animation: phase === 'walk' ? 'credit-leg-left 0.3s ease-in-out infinite' : undefined,
                        boxShadow: `0 0 4px ${color}`,
                    }}
                >
                    {/* Left foot */}
                    <div style={{
                        position: 'absolute',
                        bottom: '-2px',
                        left: '-2px',
                        width: '5px',
                        height: '2px',
                        backgroundColor: color,
                        borderRadius: '1px',
                    }} />
                </div>
                {/* Right leg */}
                <div
                    style={{
                        width: '2px',
                        height: '10px',
                        backgroundColor: color,
                        borderRadius: '0 0 2px 2px',
                        transformOrigin: 'top',
                        animation: phase === 'walk' ? 'credit-leg-right 0.3s ease-in-out infinite' : undefined,
                        boxShadow: `0 0 4px ${color}`,
                    }}
                >
                    {/* Right foot */}
                    <div style={{
                        position: 'absolute',
                        bottom: '-2px',
                        left: '-1px',
                        width: '5px',
                        height: '2px',
                        backgroundColor: color,
                        borderRadius: '1px',
                    }} />
                </div>
            </div>
            {/* Sweat drops while walking */}
            {phase === 'walk' && (
                <>
                    <div style={{
                        position: 'absolute',
                        top: '2px',
                        right: '-6px',
                        fontSize: '8px',
                        animation: 'credit-sweat 0.8s ease-in-out infinite',
                    }}>💧</div>
                </>
            )}
        </div>
    );
};

/** Credit line that decodes character by character, with color-shifting heart and rotating name effects */
export const CreditLine = () => {
    const [displayText, setDisplayText] = useState('');
    const [decoded, setDecoded] = useState(false);
    const [heartColor, setHeartColor] = useState(HEART_COLORS[0]);
    const [effectIndex, setEffectIndex] = useState(0);
    const [effectActive, setEffectActive] = useState(false);
    const [heartState, setHeartState] = useState<'idle' | 'walking' | 'gone'>('idle');
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Decode loop
    useEffect(() => {
        function runDecode() {
            setDecoded(false);
            let resolvedCount = 0;

            intervalRef.current = setInterval(() => {
                setDisplayText(() => {
                    let result = '';
                    for (let i = 0; i < TARGET_TEXT.length; i++) {
                        if (TARGET_TEXT[i] === ' ' || TARGET_TEXT[i] === '❤' || TARGET_TEXT[i] === '️') {
                            result += TARGET_TEXT[i];
                        } else if (i < resolvedCount) {
                            result += TARGET_TEXT[i];
                        } else {
                            result += CHARS[Math.floor(Math.random() * CHARS.length)];
                        }
                    }
                    return result;
                });

                resolvedCount += 0.5;
                if (resolvedCount >= TARGET_TEXT.length) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    setDisplayText(TARGET_TEXT);
                    setDecoded(true);
                }
            }, 40);
        }

        runDecode();
        const loopInterval = setInterval(runDecode, 3000);

        return () => {
            clearInterval(loopInterval);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Heart color cycle
    useEffect(() => {
        let colorIndex = 0;
        const colorInterval = setInterval(() => {
            colorIndex = (colorIndex + 1) % HEART_COLORS.length;
            setHeartColor(HEART_COLORS[colorIndex]);
        }, 1500);
        return () => clearInterval(colorInterval);
    }, []);

    // Name effect rotation — flash for 1.5s every 6.5s
    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;

        function triggerEffect() {
            setEffectIndex((prev) => (prev + 1) % NAME_EFFECTS.length);
            setEffectActive(true);
            timeoutId = setTimeout(() => {
                setEffectActive(false);
            }, 1500);
        }

        const intervalId = setInterval(triggerEffect, 6500);

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, []);

    // Walking heart — every WALK_INTERVAL
    useEffect(() => {
        let goneTimeout: ReturnType<typeof setTimeout>;
        const walkInterval = setInterval(() => {
            setHeartState('walking');
        }, WALK_INTERVAL);
        return () => {
            clearInterval(walkInterval);
            clearTimeout(goneTimeout);
        };
    }, []);

    // Split display text into before/heart/after/name for rendering
    const heartIndex = displayText.indexOf('❤');
    const beforeText = heartIndex >= 0 ? displayText.slice(0, heartIndex) : displayText;
    const afterHeart = heartIndex >= 0 ? displayText.slice(heartIndex + 2) : '';
    const byIndex = afterHeart.indexOf(' By ');
    const byText = byIndex >= 0 ? afterHeart.slice(0, byIndex + 4) : afterHeart;
    const nameText = byIndex >= 0 ? afterHeart.slice(byIndex + 4) : '';

    const currentEffect = NAME_EFFECTS[effectIndex];

    return (
        <>
            {heartState === 'walking' && (
                <WalkingHeart
                    color={heartColor}
                    onDone={() => {
                        setHeartState('gone');
                    }}
                />
            )}
            <a
                href="https://mr-falach.vercel.app/he"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-12 pointer-events-auto group relative"
            >
                <span
                    className="text-xs font-mono tracking-[0.12em] relative inline-block"
                    style={{
                        color: decoded ? 'rgba(255, 210, 140, 0.5)' : 'rgba(255, 210, 140, 0.3)',
                        transition: 'color 0.5s ease-out',
                    }}
                >
                    {beforeText}
                    {heartIndex >= 0 && (
                        <span
                            style={{
                                transition: 'all 0.5s ease-in-out',
                                ...(heartState === 'idle' ? {
                                    color: heartColor,
                                    filter: `drop-shadow(0 0 4px ${heartColor}40)`,
                                } : {})
                            }}
                        >
                            {heartState === 'gone' ? (
                                <span style={{
                                    display: 'inline-block',
                                    fontSize: '16px',
                                    position: 'relative',
                                    zIndex: 10,
                                    animation: 'credit-finger-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                                }}>
                                    🖕
                                </span>
                            ) : heartState === 'walking' ? (
                                <span style={{ opacity: 0.2 }}>❤️</span>
                            ) : (
                                <>❤️</>
                            )}
                        </span>
                    )}
                    {byText}
                    {nameText && (
                        <span
                            key={effectActive ? effectIndex : 'idle'}
                            style={effectActive ? {
                                ...currentEffect.style,
                                transition: 'all 0.3s ease-out',
                            } : {
                                color: 'inherit',
                                transition: 'all 0.4s ease-out',
                            }}
                            className={effectActive ? currentEffect.className : undefined}
                        >
                            {nameText}
                        </span>
                    )}

                    {decoded && heartState === 'idle' && (
                        <span
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,200,100,0.4) 50%, transparent 100%)',
                                backgroundSize: '200% 100%',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                color: 'transparent',
                                animation: 'shimmer 3s ease-in-out infinite',
                            }}
                        >
                            {BEFORE}<span style={{ opacity: 0 }}>{HEART}</span>{AFTER}<span style={{ opacity: 0 }}>{NAME}</span>
                        </span>
                    )}
                </span>

                <span
                    className="block h-[0.5px] bg-amber-300/0 group-hover:bg-amber-300/30 transition-all duration-500 mt-1"
                    style={{ transformOrigin: 'left', transform: 'scaleX(0)', transition: 'transform 0.4s ease-out, background-color 0.4s' }}
                />
                <style>{`
                    .group:hover span:last-child {
                        transform: scaleX(1) !important;
                    }
                    @keyframes shimmer {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                    }
                    ${effectActive ? (currentEffect.keyframes || '') : ''}
                    @keyframes credit-heart-walk {
                        0% { left: -30px; }
                        100% { left: calc(100vw + 30px); }
                    }
                    @keyframes credit-heart-bob {
                        0%, 100% { transform: translateY(0) rotate(-5deg); }
                        50% { transform: translateY(-3px) rotate(5deg); }
                    }
                    @keyframes credit-leg-left {
                        0%, 100% { transform: rotate(25deg); }
                        50% { transform: rotate(-25deg); }
                    }
                    @keyframes credit-leg-right {
                        0%, 100% { transform: rotate(-25deg); }
                        50% { transform: rotate(25deg); }
                    }
                    @keyframes credit-sweat {
                        0% { transform: translate(0, 0) scale(1); opacity: 0.8; }
                        100% { transform: translate(4px, -8px) scale(0.5); opacity: 0; }
                    }
                    @keyframes credit-finger-pop {
                        0% { transform: scale(0) rotate(-20deg); opacity: 0; }
                        60% { transform: scale(1.3) rotate(5deg); opacity: 1; }
                        100% { transform: scale(1) rotate(0deg); opacity: 1; }
                    }
                `}</style>
            </a>
        </>
    );
};
