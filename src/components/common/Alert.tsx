import React, {ReactNode} from "react";

interface AlertButton {
    label: string; // The text to display on the button
    onClick: () => void; // The callback when the button is clicked
    styleClass?: string; // Optional custom styles for the button
}

interface AlertProps {
    isOpen: boolean; // Whether the alert is visible or not
    text: ReactNode; // The message to display
    buttons: AlertButton[]; // Array of buttons, fully dynamic
    closeAlert: () => void; // Function to close the alert
}

const Alert: React.FC<AlertProps> = ({
                                         isOpen,
                                         text,
                                         buttons,
                                         closeAlert,
                                     }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-blue-100 rounded shadow-lg p-6 max-w-sm w-full">
                <p className="text-lg mb-4 text-black">{text}</p>
                <div className="flex justify-end space-x-3">
                    {buttons.map((button, index) => (
                        <button
                            key={index}
                            className={`px-4 py-2 rounded ${
                                button.styleClass || "bg-blue-500 text-white hover:bg-blue-600"
                            }`}
                            onClick={() => {
                                button.onClick(); // Trigger button action
                                closeAlert(); // Close the alert
                            }}
                        >
                            {button.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Alert;