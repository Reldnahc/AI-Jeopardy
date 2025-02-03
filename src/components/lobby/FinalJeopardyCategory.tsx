import React from 'react';

interface FinalJeopardyCategoryProps {
    category: string;
    isHost: boolean;
    onChangeCategory: (
        boardType: 'finalJeopardy',
        index: undefined,
        value: string
    ) => void;
    onRandomizeCategory: (boardType: 'finalJeopardy') => void;
}

const FinalJeopardyCategory: React.FC<FinalJeopardyCategoryProps> = ({
                                                                         category,
                                                                         isHost,
                                                                         onChangeCategory,
                                                                         onRandomizeCategory,
                                                                     }) => {
    return (
        <div>
            <h2 className="text-[1.8rem] mb-[20px] text-white">Final Jeopardy!</h2>
            <div className="flex items-center gap-[20px] flex-1 mt-[30px]">
                <input
                    type="text"
                    value={category}
                    onChange={(e) =>
                        onChangeCategory('finalJeopardy', undefined, e.target.value)
                    }
                    placeholder="Enter Final Jeopardy Category"
                    className="text-[1.2rem] p-[10px] rounded border border-gray-300 flex-[4]"
                />
                {isHost && (
                    <button
                        onClick={() => onRandomizeCategory('finalJeopardy')}
                        className="text-[1rem] py-[10px] px-[15px] bg-orange-500 text-white rounded cursor-pointer flex-[1]"
                    >
                        Randomize
                    </button>
                )}
            </div>
        </div>
    );
};

export default FinalJeopardyCategory;
