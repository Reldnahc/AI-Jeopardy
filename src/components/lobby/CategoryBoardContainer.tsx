import React from 'react';
import CategoryBoard from './CategoryBoard';
import FinalJeopardyCategory from './FinalJeopardyCategory';

interface CategoryBoardContainerProps {
    categories: {
        firstBoard: string[];
        secondBoard: string[];
        finalJeopardy: string;
    };
    isHost: boolean;
    onChangeCategory: (
        boardType: 'firstBoard' | 'secondBoard' | 'finalJeopardy',
        index: number | undefined,
        value: string
    ) => void;
    onRandomizeCategory: (
        boardType: 'firstBoard' | 'secondBoard' | 'finalJeopardy',
        index?: number
    ) => void;
}

const CategoryBoardContainer: React.FC<CategoryBoardContainerProps> = ({
                                                                           categories,
                                                                           isHost,
                                                                           onChangeCategory,
                                                                           onRandomizeCategory,
                                                                       }) => {
    return (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap', // Allow flex items to wrap if necessary
                gap: '10px', // Add spacing between boards
                justifyContent: 'space-around', // Distribute evenly across the available space
                width: '100%', // Take full width
            }}
        >
            {/* First Board */}
            <CategoryBoard
                title="Categories for Jeopardy!"
                categories={categories.firstBoard}
                isHost={isHost}
                boardType="firstBoard"
                onChangeCategory={onChangeCategory}
                onRandomizeCategory={onRandomizeCategory}
            />

            {/* Second Board */}
            <CategoryBoard
                title="Categories for Double Jeopardy!"
                categories={categories.secondBoard}
                isHost={isHost}
                boardType="secondBoard"
                onChangeCategory={onChangeCategory}
                onRandomizeCategory={onRandomizeCategory}
            />

            {/* Final Jeopardy Section */}
            <div
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '-20px',
                }}
            >
                <FinalJeopardyCategory
                    category={categories.finalJeopardy}
                    isHost={isHost}
                    onChangeCategory={onChangeCategory}
                    onRandomizeCategory={(boardType) => onRandomizeCategory(boardType)} // Only needs board type
                />
            </div>

        </div>
    );
};

export default CategoryBoardContainer;