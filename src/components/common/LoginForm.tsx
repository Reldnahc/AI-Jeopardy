import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Signup from "./Signup";
import Login from "./Login";

const LoginForm = () => {
    const [open, setOpen] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
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

    // Animation Variants
    const formVariants = {
        hidden: { height: 0, opacity: 0 }, // Collapse with no height
        visible: { height: "auto", opacity: 1 }, // Expand to full height
        exit: { height: 0, opacity: 0 }, // Collapse with transition
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Toggle Button */}
            <button
                onClick={toggleMenu}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none transition-colors duration-200 shadow-md"
            >
                Login / Signup
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        className="absolute right-0 mt-2 w-80 bg-white p-6 rounded-lg shadow-xl z-10 overflow-hidden"
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <AnimatePresence mode="wait"> {/* Switch between login and signup */}
                            {showSignup ? (
                                <motion.div
                                    key="signup"
                                    variants={formVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.2 }} // Adjust duration for smoothness
                                >
                                    <Signup />
                                    <p className="mt-4 text-center text-gray-700 text-sm">
                                        Already have an account?
                                        <br />
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setShowSignup(false);
                                            }}
                                            className="cursor-pointer text-blue-600 hover:underline"
                                        >
                                            Click here to log in!
                                        </a>
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="login"
                                    variants={formVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.2 }} // Adjust duration for smoothness
                                >
                                    <Login />
                                    <p className="mt-4 text-center text-gray-700 text-sm">
                                        Need an account?
                                        <br />
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setShowSignup(true);
                                            }}
                                            className="cursor-pointer text-blue-600 hover:underline"
                                        >
                                            Click here to sign up!
                                        </a>
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LoginForm;