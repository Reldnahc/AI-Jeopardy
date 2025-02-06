import React from 'react';
import { useNavigate } from 'react-router-dom';

interface FinalScoreScreenProps {
    scores: Record<string, number>;
}

const FinalScoreScreen: React.FC<FinalScoreScreenProps> = ({ scores }) => {
    const navigate = useNavigate();

    // Sort players by score in descending order
    const sortedScores = Object.entries(scores).sort(([, scoreA], [, scoreB]) => scoreB - scoreA);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                width: '100vw', // Full width of the screen
                background: 'linear-gradient(to bottom, #192841, #1d3557)',
                color: '#FFF',
                fontFamily: "'Poppins', sans-serif",
                textAlign: 'center',
                padding: '40px',
                boxSizing: 'border-box',
            }}
        >
            <h1
                style={{
                    fontSize: '4rem',
                    fontWeight: 'bold',
                    marginBottom: '50px',
                    color: '#FFD700',
                    textShadow: '0px 4px 6px rgba(0, 0, 0, 0.3)', // Add some depth to the text
                }}
            >
                Final Scores
            </h1>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', // Responsive grid
                    gap: '40px', // Space between score entries
                    width: '85%', // Take up more of the screen width
                    maxWidth: '1400px', // Cap maximum width for readability
                }}
            >
                {sortedScores.map(([player, score], index) => (
                    <div
                        key={player}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '2rem',
                            fontWeight: index === 0 ? 'bold' : 'normal',
                            padding: '20px 30px',
                            backgroundColor: index === 0 ? '#FFD700' : 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '15px', // Rounded corners for modern look
                            color: index === 0 ? '#1C1C1C' : '#FFF', // Contrast for first place
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // More polished shadow effect
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                    >
                        <span>{player}</span>
                        <span>${score}</span>
                    </div>
                ))}
            </div>
            <button
                onClick={() => navigate('/')} // Navigate Home
                style={{
                    marginTop: '50px',
                    padding: '20px 50px',
                    fontSize: '1.8rem',
                    fontWeight: 'bold',
                    color: 'white',
                    background: 'rgba(255, 87, 34, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1.0)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.2)';
                }}
            >
                Home
            </button>
        </div>
    );
};

export default FinalScoreScreen;