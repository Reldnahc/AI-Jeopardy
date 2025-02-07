// BuzzAnimation.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BuzzAnimationProps {
    playerName: string | null;
}

const BuzzAnimation: React.FC<BuzzAnimationProps> = ({ playerName }) => {
    const [showAnimation, setShowAnimation] = useState(false);

    useEffect(() => {
        if (playerName) {
            setShowAnimation(true);
            // Auto hide after animation
            const timer = setTimeout(() => {
                setShowAnimation(false);
            }, 1000); // Match this with animation duration
            return () => clearTimeout(timer);
        }
    }, [playerName]);

    return (
        <AnimatePresence>
            {showAnimation && playerName && (
                <motion.div
                    initial={{ opacity: 0, y: 0, scale: 0.5 }}
                    animate={{ opacity: 1, y: -100, scale: 2 }}
                    exit={{ opacity: 0 }}
                    transition={{
                        duration: 1,
                        ease: "easeOut"
                    }}
                    className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 text-center"
                >
                    <div className="text-6xl font-extrabold" style={{
                        color: '#FFF',
                        textShadow: `
                            -2px -2px 0 #000,  
                            2px -2px 0 #000,
                            -2px 2px 0 #000,
                            2px 2px 0 #000,
                            0 0 20px rgba(255, 223, 0, 0.8),
                            0 0 30px rgba(255, 223, 0, 0.6),
                            0 0 40px rgba(255, 223, 0, 0.4)
                        `
                    }}>
                        {playerName}
                        <div className="text-red-500 text-4xl mt-2">
                            BUZZED!
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BuzzAnimation;