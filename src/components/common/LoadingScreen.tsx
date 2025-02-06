import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
    message?: string; // Optional for flexibility
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
    const [dots, setDots] = useState('');

    // Animate the loading dots (cycles between ".", "..", "...")
    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prev) => (prev.length === 3 ? '' : prev + '.'));
        }, 600); // Updates dots every 500ms
        return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-5.5rem)] w-screen bg-gradient-to-r from-indigo-400 to-blue-700 text-white text-center">
            {/* Spinner */}
            <div className="relative w-16 h-16 mb-8">
                <div className="w-full h-full border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 w-12 h-12 bg-gradient-to-r from-indigo-400 to-blue-700 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>

            {/* Message */}
            <h1 className="text-4xl md:text-5xl font-bold tracking-wide animate-pulse">
                {message || 'Loading'}
                <span className="ml-2">{dots}</span>
            </h1>
        </div>
    );
};

export default LoadingScreen;