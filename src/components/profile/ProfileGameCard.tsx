import { useState } from "react";
import { Board } from "../../types/Board";
import CollapsibleCategory from "../recentboards/CollapsibleCategory";

type ProfileGameCardProps = {
    game: Board;
};

const ProfileGameCard = ({ game }: ProfileGameCardProps) => {
    const [isCollapsed, setIsCollapsed] = useState(true);

    // Toggle collapsible state
    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    return (
        <div className="bg-[#AAA] border-[#ddd] border shadow-md rounded-lg p-4 mb-4"> {/* Reduced padding and margin */}
            {/* Header with toggle button */}
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold"> {/* Reduced text size */}
                    Model: <span className="font-normal"> {game.model}</span>
                </h2>
                <button
                    onClick={toggleCollapse}
                    className="bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-700"> {/* Smaller button */}
                    {isCollapsed ? "Expand" : "Collapse"}
                </button>
            </div>

            {/* Collapsible content */}
            {!isCollapsed && (
                <div className="mt-3"> {/* Reduced margin-top */}
                    {/* First Board */}
                    <div className="mb-4"> {/* Reduced spacing */}
                        <h3 className="text-lg font-bold mb-2">First Board</h3>
                        {game.firstBoard?.categories.map((cat, idx) => (
                            <CollapsibleCategory
                                key={idx}
                                category={cat.category}
                                values={cat.values}
                            />
                        ))}
                    </div>

                    {/* Second Board */}
                    <div className="mb-4">
                        <h3 className="text-lg font-bold mb-2">Second Board</h3>
                        {game.secondBoard?.categories.map((cat, idx) => (
                            <CollapsibleCategory
                                key={idx}
                                category={cat.category}
                                values={cat.values}
                            />
                        ))}
                    </div>

                    {/* Final Jeopardy */}
                    <div>
                        <h3 className="text-lg font-bold mb-2">Final Jeopardy</h3>
                        {game.finalJeopardy?.categories.map((cat, idx) => (
                            <CollapsibleCategory
                                key={idx}
                                category={cat.category}
                                values={cat.values.map((value) => ({
                                    value: 0,
                                    question: value.question,
                                    answer: value.answer,
                                }))}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileGameCard;