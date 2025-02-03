import { useState, useRef, useEffect } from "react";
import Signup from "./Signup";
import Login from "./Login";

const LoginForm = () => {
    const [open, setOpen] = useState(false); // controls visibility of the login/signup menu
    const [showSignup, setShowSignup] = useState(false); // toggles between login and signup forms
    const menuRef = useRef<HTMLDivElement>(null);

    // Close the menu if a click is detected outside the menu area.
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open]);

    const toggleMenu = () => {
        setOpen(!open);
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* The button that toggles the dropdown menu */}
            <button
                onClick={toggleMenu}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Login / Signup
            </button>

            {/* The dropdown menu, conditionally rendered when open */}
            {open && (
                <div className="absolute right-0 mt-2 w-72 bg-gray-200 p-4 shadow-lg rounded">
                    {showSignup ? (
                        <>
                            <Signup />
                            <p className="mt-2 text-sm text-center text-black">
                                Already have an account?<br/>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowSignup(false);
                                    }}
                                    className="cursor-pointer text-blue-500 underline"
                                >
                                    Click here to log in!
                                </a>
                            </p>
                        </>
                    ) : (
                        <>
                            <Login />
                            <p className="mt-2 text-sm text-center text-blue-500">
                                Need an account?<br/>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowSignup(true);
                                    }}
                                    className="cursor-pointer text-blue-500 underline"
                                >
                                    Click here to sign up!
                                </a>
                            </p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default LoginForm;
