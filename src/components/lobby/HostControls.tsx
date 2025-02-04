import React from 'react';
import { models } from '../../data/models.ts';
import { useProfile } from "../../contexts/ProfileContext.tsx";

interface Model {
    value: string;
    label: string;
    price: number;
    disabled: boolean;
}

interface HostControlsProps {
    selectedModel: string;
    onModelChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onCreateGame: () => void;
}

const HostControls: React.FC<HostControlsProps> = ({ selectedModel, onModelChange, onCreateGame }) => {
    const { profile } = useProfile();

    // Group the models by price
    const groupedModels = models.reduce((groups, model) => {
        if (!groups[model.price]) {
            groups[model.price] = [];
        }
        groups[model.price].push(model);
        return groups;
    }, {} as Record<number, Model[]>);

    function checkCantAfford(model: Model) {
        if (model.price === 0) {
            return false;
        }
        if (profile) {
            if (profile.role === 'admin' || profile.role === 'privileged' || profile.tokens >= model.price) {
                return false;
            }
        }
        return true;
    }

    return (
        // Wrapper container with responsive layout
        <div className="flex flex-col sm:flex-row justify-start mt-8 items-center pl-8 gap-5">

            {/* Options Box */}
            <div className="flex flex-col justify-center sm:mr-5">
                <div className="flex flex-col justify-center items-start bg-gray-800 px-20 py-5 rounded-lg border border-gray-700 shadow-md flex-shrink-0">
                    {/* Dropdown for model selection */}
                    <div className="flex flex-col gap-2">
                        <label className="text-gray-400 text-lg">Model Selection:</label>
                        <select
                            value={selectedModel}
                            onChange={onModelChange}
                            className="p-2 rounded border border-gray-300 text-black w-full bg-white cursor-pointer"
                        >
                            {Object.entries(groupedModels).map(([price, models]) => (
                                <optgroup
                                    label={`Cost: ${price === "0" ? "Free" : `${price} tokens`}`}
                                    key={price}
                                >
                                    {models.map((model) => (
                                        <option
                                            key={model.value}
                                            value={model.value}
                                            disabled={checkCantAfford(model)} // Disable dynamically
                                        >
                                            {model.label}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Start Game Button */}
            <button
                onClick={onCreateGame}
                className="text-2xl px-10 py-5 bg-blue-600 text-white rounded-lg cursor-pointer max-w-[500px] shadow-md hover:bg-blue-500 transition sm:ml-5 sm:mt-0 mt-5"
            >
                Start Game
            </button>
        </div>
    );
};

export default HostControls;