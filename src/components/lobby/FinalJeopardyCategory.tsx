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
    lockedCategories: boolean[]; // Lock state for each input
    onToggleLock
        : (
        boardType: 'finalJeopardy',
        index: number
    ) => void;
}

const FinalJeopardyCategory: React.FC<FinalJeopardyCategoryProps> = ({
                                                                         category,
                                                                         isHost,
                                                                         onChangeCategory,
                                                                         onRandomizeCategory,
                                                                         lockedCategories,
                                                                         onToggleLock,
                                                                     }) => {
    return (
        <div>
            <h2 className="text-3xl -mt-3 text-black font-bold">Final Jeopardy!</h2>
            <div className="flex items-center gap-2.5 flex-1 mt-3">
                <input
                    type="text"
                    value={category}
                    disabled={lockedCategories[0]} // Disable input if locked
                    onChange={(e) =>
                        onChangeCategory('finalJeopardy', undefined, e.target.value)
                    }
                    placeholder="Enter Final Jeopardy Category"
                    className="text-[1.2rem] p-[10px] rounded border border-gray-300 text-black bg-gray-50 flex-[4]"
                />
                {isHost && (
                    <div>
                        <button
                            onClick={() => onToggleLock('finalJeopardy', 0)}
                            disabled={!isHost} // Only the host can toggle locks
                            className={`text-[1rem] py-[10px] px-[15px] ${
                                lockedCategories[0] ? 'bg-red-600' : 'bg-indigo-500'
                            } text-white rounded cursor-pointer mr-2`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="24"
                                height="24"
                                fill="currentColor"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <>
                                    {/* Locked Icon */}
                                    <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
                                    <path d="M8 11V7a4 4 0 1 1 8 0v4" />
                                </>
                            </svg>
                        </button>
                        <button
                            onClick={() => onRandomizeCategory('finalJeopardy')}
                            className="text-[1rem] py-[10px] px-[15px] bg-blue-700 text-white rounded cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinalJeopardyCategory;
