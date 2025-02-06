import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.tsx";
import { useProfile } from "../../contexts/ProfileContext.tsx";
import LoginForm from "./LoginForm.tsx";
import { supabase } from "../../supabaseClient.ts";
import Avatar from "./Avatar.tsx";
import { useUserProfile } from "../../contexts/UserProfileContext.tsx";
import { motion, AnimatePresence } from "framer-motion";

const Header: React.FC = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false); // Profile dropdown state
    const [menuOpen, setMenuOpen] = useState(false); // Hamburger menu state
    const { user } = useAuth();
    const { profile } = useProfile();
    const { userProfile } = useUserProfile();
    const dropdownRef = useRef<HTMLDivElement>(null); // Reference to the dropdown menu
    const menuRef = useRef<HTMLDivElement>(null); // Reference to the hamburger menu
    const hamburgerButton = useRef<HTMLButtonElement>(null); // Reference to the hamburger menu

    // Toggle the profile dropdown
    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

    // Handle logout
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error logging out:", error.message);
        } else {
            console.log("Logged out successfully!");
        }
    };

    // Close dropdown or mobile menu when clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false); // Close the dropdown menu
            }
            if (menuRef.current && hamburgerButton.current && !menuRef.current.contains(event.target as Node) && !hamburgerButton.current.contains(event.target as Node)) {
                setMenuOpen(false); // Close the hamburger menu
            }
        };

        // Add event listener for clicks on the document
        document.addEventListener("mousedown", handleClickOutside);

        // Cleanup event listener on unmount
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="bg-gradient-to-r from-indigo-400 to-blue-700 text-white w-full h-[5.5rem] shadow-md">
            {/* Outer container with justify-between splits left and right sections */}
            <div className="container mx-auto flex items-center py-4 px-6 justify-between h-full">
                {/* Left Section: Logo (and optional left-side nav links) */}
                <div className="flex items-center space-x-6">
                    <Link
                        to="/"
                        className="text-3xl font-bold hover:underline text-blue-700 hover:text-blue-500"
                        aria-label="Go to Main Page"
                    >
                        AI-Jeopardy.com
                    </Link>
                    {/* Optional navigation links */}
                    <nav className="hidden md:flex items-center space-x-3">
                        <Link
                            to="/recent-boards"
                            className="px-4 text-xl py-2 hover:underline hover:bg-blue-500 rounded text-white hover:text-white"
                        >
                            Recent Boards
                        </Link>
                    </nav>
                </div>

                {/* Right Section: Login/Profile Button and Hamburger Menu */}
                <div className="flex items-center space-x-4 h-full">
                    {user && profile && userProfile ? (
                        // If logged in, show a profile dropdown menu
                        <div className="hidden relative md:block" ref={dropdownRef}>
                            <button
                                onClick={toggleDropdown}
                                className="flex items-center text-xl px-4 py-2 rounded hover:bg-blue-400 focus:outline-none"
                            >
                                <Avatar
                                    name={profile.displayname}
                                    size="10"
                                    color={userProfile.color}
                                    textColor={userProfile.text_color}
                                />
                                <span className="ml-3">{profile.displayname}</span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 ml-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>
                            <AnimatePresence>
                                {dropdownOpen && (
                                    <motion.div
                                        className="absolute right-0 mt-2 w-48 bg-gray-100 text-black rounded shadow-lg z-50"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Link
                                            onClick={() => setDropdownOpen(false)}
                                            to={`/profile/${profile.username}`}
                                            className="block px-4 py-2 text-blue-600 hover:bg-gray-200"
                                        >
                                            Your Profile
                                        </Link>
                                        <Link
                                            onClick={() => setDropdownOpen(false)}
                                            to="/history"
                                            className="block px-4 py-2 text-blue-600 hover:bg-gray-200"
                                        >
                                            History
                                        </Link>
                                        <span
                                            onClick={handleLogout}
                                            className="block px-4 py-2 text-red-600 hover:bg-gray-200 cursor-pointer"
                                        >
                                            Log out
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        // If not logged in, show a Login button
                        <LoginForm />
                    )}
                    {/* Hamburger Menu Button (visible only on small screens) */}
                    <button
                        className="md:hidden flex items-center px-3 py-2 rounded text-white hover:bg-blue-500 focus:outline-none"
                        onClick={() => setMenuOpen(!menuOpen)}
                        ref={hamburgerButton}
                    >
                        {user && profile && userProfile && (
                            <div className="mr-2">
                                <Avatar
                                    name={profile.displayname}
                                    size="10"
                                    color={userProfile.color}
                                    textColor={userProfile.text_color}
                                />
                            </div>
                        )}
                        <svg
                            className="h-6 w-6"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        className="absolute top-[5.5rem] inset-x-0 bg-gray-100 text-black rounded shadow-lg z-50"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={{
                            hidden: { height: 0, opacity: 0 },
                            visible: { height: "auto", opacity: 1 },
                        }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        ref={menuRef}
                    >
                        <motion.div
                            className="flex flex-col"
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={{
                                hidden: { opacity: 0, transition: { staggerChildren: 0.1, staggerDirection: -1 } }, // Stagger exit direction reversed
                                visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
                            }}
                        >
                            <motion.div
                                className="block px-4 py-2 hover:bg-blue-500 cursor-pointer"
                                variants={{
                                    hidden: { opacity: 0, y: -10 },
                                    visible: { opacity: 1, y: 0 },
                                    exit: { opacity: 0, y: -10 } // Matches exit animation
                                }}
                            >
                                <Link
                                    to="/recent-boards"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Recent Boards
                                </Link>
                            </motion.div>

                            {user && profile && (
                                <>
                                    <motion.div
                                        className="block px-4 py-2 hover:bg-blue-500 cursor-pointer"
                                        variants={{
                                            hidden: { opacity: 0, y: -10 },
                                            visible: { opacity: 1, y: 0 },
                                            exit: { opacity: 0, y: -10 } // Matches exit animation
                                        }}
                                    >
                                        <Link
                                            to={`/profile/${profile.username}`}
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            Your Profile
                                        </Link>
                                    </motion.div>

                                    <motion.div
                                        className="block px-4 py-2 hover:bg-blue-500 cursor-pointer"
                                        variants={{
                                            hidden: { opacity: 0, y: -10 },
                                            visible: { opacity: 1, y: 0 },
                                            exit: { opacity: 0, y: -10 } // Matches exit animation
                                        }}
                                    >
                                        <Link
                                            to="/history"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            History
                                        </Link>
                                    </motion.div>

                                    <motion.span
                                        className="block px-4 py-2 text-red-600 hover:bg-blue-500 cursor-pointer"
                                        variants={{
                                            hidden: { opacity: 0, y: -10 },
                                            visible: { opacity: 1, y: 0 },
                                            exit: { opacity: 0, y: -10 } // Matches exit animation
                                        }}
                                        onClick={() => {
                                            handleLogout();
                                            setMenuOpen(false);
                                        }}
                                    >
                                        Log out
                                    </motion.span>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;