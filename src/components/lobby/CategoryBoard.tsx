import React from 'react';

interface CategoryBoardProps {
    title: string;
    categories: string[];
    isHost: boolean;
    boardType: 'firstBoard' | 'secondBoard';
    onChangeCategory: (boardType: 'firstBoard' | 'secondBoard', index: number, value: string) => void;
    onRandomizeCategory: (boardType: 'firstBoard' | 'secondBoard', index: number) => void;
}

const CategoryBoard: React.FC<CategoryBoardProps> = ({
                                                         title,
                                                         categories,
                                                         isHost,
                                                         boardType,
                                                         onChangeCategory,
                                                         onRandomizeCategory,
                                                     }) => {
    return (
        <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>{title}</h2>
            {categories.map((category, index) => (
                <div
                    key={index}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '15px',
                        gap: '15px',
                    }}
                >
                    <input
                        id={`${title}-${index}`}
                        type="text"
                        value={category || ''}
                        onChange={(e) => onChangeCategory(boardType, index, e.target.value)}
                        placeholder={`Category ${index + 1}`}
                        style={{
                            fontSize: '1.2rem',
                            padding: '10px',
                            borderRadius: '5px',
                            border: '1px solid #ccc',
                            flex: 1,
                        }}
                    />
                    {isHost && (
                        <button
                            onClick={() => onRandomizeCategory(boardType, index)}
                            style={{
                                fontSize: '1rem',
                                padding: '10px 15px',
                                backgroundColor: 'orange',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                            }}
                        >
                            Randomize
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default CategoryBoard;