import React from 'react';

interface LoadingScreenProps {
    message: string;
    loadingDots: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message, loadingDots }) => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                width: '100vw',
                backgroundColor: '#222',
                color: 'white',
                textAlign: 'center',
            }}
        >
            <div className="spinner" style={{ marginBottom: '20px' }}></div>
            <h1 style={{ display: 'flex', alignItems: 'center' }}>
                {message || 'Loading'}
                <span
                    style={{
                        display: 'inline-block',
                        width: '3ch',
                        textAlign: 'left',
                    }}
                >
                    {loadingDots}
                </span>
            </h1>
        </div>
    );
};
export default LoadingScreen;