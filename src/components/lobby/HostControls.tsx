import React from 'react';

interface HostControlsProps {
    selectedModel: string;
    onModelChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onCreateGame: () => void;
}

const HostControls: React.FC<HostControlsProps> = ({ selectedModel, onModelChange, onCreateGame }) => {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginTop: '30px',
                alignItems: 'center',
                paddingLeft: '30px',
            }}
        >
            {/* Options Box */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center', // Align items centrally in the box
                    marginRight: '20px', // Add space to the right of the box
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center', // Center the content vertically
                        alignItems: 'flex-start', // Align content to the left
                        backgroundColor: '#1c2538', // Distinct background
                        padding: '20px 80px', // Padding inside the box
                        borderRadius: '8px', // Rounded corners
                        border: '1px solid #333', // Subtle border for contrast
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // Modern shadow for a floating effect
                        flexShrink: 0, // Prevent shrinking in case of flex wrapping
                        marginRight: '20px', // Space between the box and the "Start Game" button
                    }}
                >
                    {/* Dropdown for model selection */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                        }}
                    >
                        <label style={{ color: '#ccc', fontSize: '1.1rem' }}>Model Selection:</label>
                        <select
                            value={selectedModel} // Tie dropdown to state
                            onChange={onModelChange} // Update state on selection
                            style={{
                                padding: '10px',
                                borderRadius: '5px',
                                border: '1px solid #ccc',
                                fontSize: '1rem',
                                width: '100%',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                color: 'black',
                            }}
                        >
                            <option value="gpt-4o-mini">GPT-4o-mini</option>
                            <option value="o1-mini">o1-mini</option>
                            <option value="gpt-4o">GPT-4o</option>
                            <option value="claude-3-5-sonnet-20241022">Claude-3.5-sonnet</option>
                            <option value="deepseek">deepseek</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Start Game Button */}
            <button
                onClick={onCreateGame}
                style={{
                    fontSize: '1.8rem', // Larger text
                    padding: '20px 40px', // More padding for height and width
                    backgroundColor: 'blue',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    maxWidth: '500px',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)', // Optional: A modern shadow effect
                }}
            >
                Start Game
            </button>
        </div>
    );
};

export default HostControls;