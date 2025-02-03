import React from 'react';

interface CategoryBoardProps {
    title: string;
    categories: string[];
    isHost: boolean;
    boardType: 'firstBoard' | 'secondBoard';
    onChangeCategory: (
        boardType: 'firstBoard' | 'secondBoard',
        index: number,
        value: string
    ) => void;
    onRandomizeCategory: (
        boardType: 'firstBoard' | 'secondBoard',
        index: number
    ) => void;
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
        <div className="flex-1">
            <h2 className="text-[1.8rem] mb-[20px] text-white">{title}</h2>
            {categories.map((category, index) => (
                <div
                    key={index}
                    className="flex items-center mb-[15px] gap-[15px]"
                >
                    <input
                        id={`${title}-${index}`}
                        type="text"
                        value={category || ''}
                        onChange={(e) => onChangeCategory(boardType, index, e.target.value)}
                        placeholder={`Category ${index + 1}`}
                        className="text-[1.2rem] p-[10px] rounded border border-gray-300 flex-1 "
                    />
                    {isHost && (
                        <button
                            onClick={() => onRandomizeCategory(boardType, index)}
                            className="text-[1rem] py-[10px] px-[15px] bg-orange-500 text-white rounded cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                            </svg>
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default CategoryBoard;
