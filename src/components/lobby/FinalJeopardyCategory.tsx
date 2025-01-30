import React from 'react';

interface FinalJeopardyCategoryProps {
    category: string;
    isHost: boolean;
    onChangeCategory: (boardType: 'finalJeopardy', index: undefined, value: string) => void;
    onRandomizeCategory: (boardType: 'finalJeopardy') => void;
}

const FinalJeopardyCategory: React.FC<FinalJeopardyCategoryProps> = ({
                                                                         category,
                                                                         isHost,
                                                                         onChangeCategory,
                                                                         onRandomizeCategory,
                                                                     }) => {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flex: 1, // Take up available space inside the container
                marginTop: '30px',
            }}
        >
            <label
                htmlFor="finalJeopardy"
                style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap', // Prevent wrapping for the text label
                }}
            >
                Final Jeopardy:
            </label>
            <input
                type="text"
                value={category}
                onChange={(e) => onChangeCategory('finalJeopardy', undefined, e.target.value)}
                placeholder="Enter Final Jeopardy Category"
                style={{
                    fontSize: '1.2rem',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                    flex: 4, // Take the majority of horizontal space
                }}
            />
            {isHost && (
                <button
                    onClick={() => onRandomizeCategory('finalJeopardy')}
                    style={{
                        fontSize: '1rem',
                        padding: '10px 15px',
                        backgroundColor: 'orange',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        flex: 1, // Allow the button to take some space but stay smaller
                    }}
                >
                    Randomize
                </button>
            )}
        </div>
    );
};

export default FinalJeopardyCategory;