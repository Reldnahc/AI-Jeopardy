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
        <div className="bg-white border border-gray-200 shadow-md rounded-lg p-6 mb-6">
            {/* Header with toggle button */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                    Model: <span className="font-normal">{game.model}</span>
                </h2>
                <button
                    onClick={toggleCollapse}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded transition-colors duration-200 hover:bg-blue-700"
                >
                    {isCollapsed ? "Expand" : "Collapse"}
                </button>
            </div>

            {/* Collapsible content */}
            {!isCollapsed && (
                <div className="mt-4 space-y-4">
                    {/* First Board */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">First Board</h3>
                        {game.firstBoard?.categories.map((cat, idx) => (
                            <CollapsibleCategory
                                key={idx}
                                category={cat.category}
                                values={cat.values}
                            />
                        ))}
                    </div>

                    {/* Second Board */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Second Board</h3>
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
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Final Jeopardy</h3>
                        {game.finalJeopardy?.categories.map((cat, idx) => (
                            <CollapsibleCategory
                                key={idx}
                                category={cat.category}
                                values={cat.values.map((value) => ({
                                    value: 0, // Final Jeopardy doesn't have a monetary value
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
