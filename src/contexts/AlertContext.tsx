import React, { createContext, useContext, useState, ReactNode } from "react";
import Alert from "../components/common/Alert"; // Adjust path if needed

interface AlertButton {
    label: string; // The text to display on the button
    actionValue: string; // Value to resolve the Promise with (e.g., "continue", "cancel")
    styleClass?: string; // Optional custom styles for the button
}

interface AlertContextProps {
    showAlert: (text: ReactNode, buttons: AlertButton[]) => Promise<string>; // Now returns a Promise
    closeAlert: () => void;
}

export const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error("useAlert must be used within an AlertProvider");
    }
    return context;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [alertText, setAlertText] = useState<ReactNode>("");
    const [alertButtons, setAlertButtons] = useState<AlertButton[]>([]);
    const [resolver, setResolver] = useState<(value: string) => void>(); // Stores the Promise resolver

    const showAlert = (text: ReactNode, buttons: AlertButton[]): Promise<string> => {
        setAlertText(text);
        setAlertButtons(buttons);
        setIsOpen(true);

        // Return a Promise that resolves when the user clicks a button
        return new Promise((resolve) => {
            setResolver(() => resolve); // Store the resolve function for later
        });
    };

    const closeAlert = () => {
        setIsOpen(false);
        setAlertText("");
        setAlertButtons([]);
    };

    const handleAction = (actionValue: string) => {
        if (resolver) {
            resolver(actionValue); // Resolve the Promise with the action value
        }
        closeAlert(); // Close the alert
    };

    return (
        <AlertContext.Provider value={{ showAlert, closeAlert }}>
            {children}
            <Alert
                isOpen={isOpen}
                text={alertText}
                buttons={alertButtons.map((button) => ({
                    label: button.label,
                    styleClass: button.styleClass,
                    onClick: () => handleAction(button.actionValue), // Pass the actionValue to resolve the Promise
                }))}
                closeAlert={closeAlert}
            />
        </AlertContext.Provider>
    );
};