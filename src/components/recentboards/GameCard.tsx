import { Board } from "../../types/Board.ts";
import CollapsibleCategory from "./CollapsibleCategory.tsx";

type GameCardProps = {
    game: Board;
};

const GameCard = ({ game }: GameCardProps) => {
    return (
        <div className="bg-white border border-gray-200 shadow-md rounded-lg p-6 mb-8">
            <div className="mb-4 border-b pb-2">
                <p className="text-xl font-semibold text-gray-800">
                    Host: <span className="font-normal">{game.host}</span>
                </p>
                <p className="text-xl font-semibold text-gray-800">
                    Model: <span className="font-normal">{game.model}</span>
                </p>
            </div>

            {/* First Board */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-3 text-gray-800">First Board</h2>
                {game.firstBoard?.categories.map((cat, idx) => (
                    <CollapsibleCategory
                        key={idx}
                        category={cat.category}
                        values={cat.values}
                    />
                ))}
            </div>

            {/* Second Board */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-3 text-gray-800">Second Board</h2>
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
                <h2 className="text-2xl font-bold mb-3 text-gray-800">Final Jeopardy</h2>
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
    );
};

export default GameCard;
