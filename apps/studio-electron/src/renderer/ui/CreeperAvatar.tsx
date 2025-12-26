import React from 'react';

type Expression = 'idle' | 'happy' | 'working' | 'confused' | 'talking';

interface CreeperAvatarProps {
    size?: number;
    expression?: Expression;
    className?: string;
}

export function CreeperAvatar({ size = 64, expression = 'idle', className = '' }: CreeperAvatarProps) {
    // Colors
    const cMain = '#00AA00'; // Minecraft Green
    const cDark = '#008000'; // Darker Green
    const cBlack = '#000000';

    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 8 8" 
            xmlns="http://www.w3.org/2000/svg"
            shapeRendering="crispEdges" // pixel look
            className={className}
        >
            {/* Base Face */}
            <rect x="0" y="0" width="8" height="8" fill={cMain} />
            
            {/* While working, maybe shift offset or animate? keeping simple for now */}
            
            {/* Eyes */}
            <rect x="1" y="2" width="2" height="2" fill={cBlack} />
            <rect x="5" y="2" width="2" height="2" fill={cBlack} />

            {/* Mouth / Expressions */}
            {expression === 'idle' && (
                <>
                    <rect x="3" y="4" width="2" height="1" fill={cBlack} />
                    <rect x="2" y="5" width="4" height="1" fill={cBlack} />
                    <rect x="2" y="6" width="1" height="1" fill={cBlack} />
                    <rect x="5" y="6" width="1" height="1" fill={cBlack} />
                </>
            )}

            {expression === 'working' && (
                 <>
                    {/* Glasses? Or just focused */}
                    <rect x="3" y="4" width="2" height="1" fill={cBlack} />
                    <rect x="2" y="5" width="4" height="1" fill={cBlack} />
                </>
             )}

             {expression === 'happy' && (
                <>
                   {/* Higher mouth */}
                    <rect x="3" y="4" width="2" height="1" fill={cBlack} />
                    <rect x="2" y="5" width="1" height="1" fill={cBlack} />
                    <rect x="5" y="5" width="1" height="1" fill={cBlack} />
                    <rect x="1" y="4" width="1" height="1" fill={cBlack} />
                    <rect x="6" y="4" width="1" height="1" fill={cBlack} />
                </>
             )}
             
             {expression === 'confused' && (
                 <>
                    <rect x="3" y="5" width="2" height="1" fill={cBlack} />
                    <rect x="4" y="2" width="1" height="1" fill={cMain} /> {/* One eye squint */}
                 </>
             )}

            {/* Noise / Texture (Subtle pixels) */}
            <rect x="0" y="0" width="1" height="1" fill={cDark} opacity="0.2" />
            <rect x="7" y="7" width="1" height="1" fill={cDark} opacity="0.2" />
            <rect x="7" y="0" width="1" height="1" fill={cDark} opacity="0.2" />
            <rect x="0" y="7" width="1" height="1" fill={cDark} opacity="0.2" />
        </svg>
    );
}
