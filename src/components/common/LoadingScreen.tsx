import React from 'react';

interface LoadingScreenProps {
    message: string;
    loadingDots: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message, loadingDots }) => {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4.5rem)] w-screen bg-gray-900 text-white text-center">
            <div className="spinner mb-5"></div>
            <h1 className="flex items-center text-5xl">
                {message || 'Loading'}
                <span className="inline-block w-[3ch] text-left">{loadingDots}</span>
            </h1>
        </div>
    );
};

export default LoadingScreen;