import React, {useState} from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.tsx";
import { useProfile } from "../../contexts/ProfileContext.tsx";
import LoginForm from "./LoginForm.tsx";
import {supabase} from "../../supabaseClient.ts";
import Avatar from "./Avatar.tsx";
import {useUserProfile} from "../../contexts/UserProfileContext.tsx";

const Header: React.FC = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false); // Profile dropdown state
    const [menuOpen, setMenuOpen] = useState(false); // Hamburger menu state
    //const navigate = useNavigate();
    const { user } = useAuth();
    const { profile } = useProfile();
    const { userProfile } = useUserProfile();
    // Toggle the profile dropdown if logged in.
    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

    // Handle logout (you can plug in your actual logout logic here)
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut(); // Call Supabase's signOut method
        if (error) {
            console.error("Error logging out:", error.message);
        } else {
            console.log("Logged out successfully!");
        }

    };

    return (
        <header className="bg-blue-600 text-white w-full h-[22]">
            {/* Outer container with justify-between splits left and right sections */}
            <div className="container mx-auto flex items-center py-4 px-6 justify-between">
                {/* Left Section: Logo (and optional left-side nav links) */}
                <div className="flex items-center space-x-6">
                    <Link
                        to="/"
                        className="text-3xl font-bold hover:underline text-blue-400 hover:text-blue-500"
                        aria-label="Go to Main Page"
                    >
                        AI-Jeopardy.com
                    </Link>
                    {/* You can optionally keep additional links here */}
                    <nav className="hidden md:flex items-center space-x-3 ">
                        <Link
                            to="/recent-boards"
                            className="px-4 text-xl py-2 hover:underline hover:bg-blue-500 rounded text-white hover:text-white"
                        >
                            Recent Boards
                        </Link>
                    </nav>
                </div>

                {/* Right Section: Login/Profile Button and Hamburger Menu */}
                <div className="flex items-center space-x-4">
                    {user && profile && userProfile ? (
                        // If logged in, show a profile button with a dropdown
                        <div className="hidden relative md:block">
                            <button
                                onClick={toggleDropdown}
                                className="flex items-center text-xl px-4 py-2 rounded hover:bg-blue-400 focus:outline-none"
                            >
                                <Avatar name={profile.username} size="10" color={userProfile.color} textColor={userProfile.text_color}/>
                                <span className="ml-3" >{profile.displayname}</span>
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
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-gray-100 text-black rounded shadow-lg z-50">
                                    <Link
                                        to={`/profile/${profile.username}`}
                                        className="block px-4 py-2 text-blue-600 hover:bg-gray-200"
                                    >
                                        Your Profile
                                    </Link>
                                    <Link
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
                                </div>
                            )}
                        </div>
                    ) : (
                        // If not logged in, show a Login button
                        <LoginForm/>
                    )}
                    {/* Hamburger Menu Button (visible only on small screens) */}
                    <button
                        className="md:hidden flex items-center px-3 py-2 rounded text-white hover:bg-blue-500 focus:outline-none"
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
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
            {menuOpen && (
                <nav className="md:hidden bg-blue-700 flex flex-col">
                    <Link
                        to="/recent-boards"
                        className="block px-4 py-2 hover:bg-blue-500"
                        onClick={() => setMenuOpen(false)}
                    >
                        Recent Boards
                    </Link>
                    {user && profile && (
                        <>
                            <Link
                                to={`/profile/${profile.username}`}
                                className="block px-4 py-2 hover:bg-blue-500"
                                onClick={() => setMenuOpen(false)}
                            >
                                Your Profile
                            </Link>
                            <Link
                                to="/history"
                                className="block px-4 py-2 hover:bg-blue-500"
                                onClick={() => setMenuOpen(false)}
                            >
                                History
                            </Link>
                        </>
                    )}
                    {user && profile && (
                        <span
                            onClick={() => {
                                setMenuOpen(false);
                                handleLogout();
                            }}
                            className="block px-4 py-2 text-red-600 hover:bg-blue-500 cursor-pointer"
                        >
              Log out
            </span>
                    )}
                </nav>
            )}
        </header>
    );
};

export default Header;
