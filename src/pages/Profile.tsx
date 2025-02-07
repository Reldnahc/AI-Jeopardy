import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Supabase client
import { Board } from '../types/Board';
import ProfileGameCard from "../components/profile/ProfileGameCard.tsx";
import Avatar from "../components/common/Avatar.tsx";
import {useAuth} from "../contexts/AuthContext.tsx";
import {useUserProfile} from "../contexts/UserProfileContext.tsx"; // Import the `Board` type
import { motion } from 'framer-motion';

// Define the expected shape of the profile data from Supabase
interface ProfileData {
    username: string;
    avatar_url?: string | null;
    bio?: string | null;
    boards_generated?: number;
    games_won?: number;
    games_finished?: number;
    role: string;
    displayname: string;
    id: string;
}

interface RouteParams extends Record<string, string | undefined> {
    username: string;
}

const Profile: React.FC = () => {
    const { username } = useParams<RouteParams>(); // Current username from the route
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [boards, setBoards] = useState<Board[]>([]); // State for the user's boards
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedTextColor, setSelectedTextColor] = useState<string | null>(null);

    const { user } = useAuth();
    const { userProfile, updateColor} = useUserProfile();

    // Fetch profile and boards
    useEffect(() => {
        const fetchProfileAndBoards = async () => {
            setLoading(true);
            setError(null);

            // Step 1: Fetch profile data
            const { data: profileData, error: profileError } = await supabase
                .from('profiles') // Replace with your "profiles" table name
                .select('*')
                .eq('username', username)
                .single();

            if (profileError) {
                setError(profileError.message);
                setLoading(false);
                return;
            }

            setProfile(profileData);

            // Step 2: Fetch last 5 boards generated by the user
            const { data: boardsData, error: boardsError } = await supabase
                .from('jeopardy_boards') // Replace with your table name
                .select('*') // Select columns you need, including 'board'
                .eq('board->>host', profileData.displayname) // Use ->> to extract 'host' as text and compare with username
                .order('created_at', { ascending: false }) // Sort by most recent
                .limit(5); // Limit to the most recent 5 boards

            if (boardsError) {
                setError(boardsError.message);
            } else {
                const mappedBoards = boardsData?.map(({ board }) => board) || [];
                setBoards(mappedBoards);
            }

            // Step 3: Fetch user profile data
            const { data: userProfileData, error: userProfileError } = await supabase
                .from('user_profiles') // Replace with your "profiles" table name
                .select('*')
                .eq('id', profileData.id)
                .single();

            if (userProfileError) {
                setError(userProfileError.message);
                setLoading(false);
                return;
            }
            setSelectedColor(userProfileData.color);
            setSelectedTextColor(userProfileData.text_color);

            setLoading(false);
        };

        fetchProfileAndBoards();
    }, [username]); // Re-run if the profile username changes

    // Fetch the selected color on component load
    useEffect(() => {
        console.log("userProfile", userProfile);
        if (userProfile && user && userProfile.id === user.id){
            setSelectedColor(userProfile.color);
            setSelectedTextColor(userProfile.text_color);
        }
    }, [userProfile]);

    const saveSelectedColor = async (color: string, table: string) => {
        if (!user) return;
        await updateColor(color, table);

        switch (table){
            case 'color':
                setSelectedColor(color);
                break;
            case 'text_color':
                setSelectedTextColor(color);
                break
        }

    };

    const colors = [
        "bg-blue-500", "bg-indigo-500", "bg-cyan-500", "bg-sky-500",
        "bg-green-500", "bg-emerald-500", "bg-teal-500", "bg-lime-500",
        "bg-yellow-500", "bg-amber-500", "bg-orange-500", "bg-red-500",
        "bg-rose-500", "bg-pink-500", "bg-fuchsia-500", "bg-purple-500",
        "bg-violet-500", "bg-gray-500", "bg-stone-500", "bg-slate-500",
        "bg-zinc-500", "bg-black", "bg-white"
    ];

    const textColors = [
        "text-blue-500", "text-indigo-500", "text-cyan-500", "text-sky-500",
        "text-green-500", "text-emerald-500", "text-teal-500", "text-lime-500",
        "text-yellow-500", "text-amber-500", "text-orange-500", "text-red-500",
        "text-rose-500", "text-pink-500", "text-fuchsia-500", "text-purple-500",
        "text-violet-500", "text-gray-500", "text-stone-500", "text-slate-500",
        "text-zinc-500", "text-black", "text-white"
    ];


    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-r from-indigo-400 to-blue-700">
                <p className="text-xl">Loading...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-xl text-red-600">
                    {error ? error : 'Profile not found.'}
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-r from-indigo-400 to-blue-700 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl w-full bg-white rounded-xl shadow-2xl overflow-hidden p-6"
            >
                <div className="space-y-8">
                    {/* Profile Header */}
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 flex-shrink-0">
                            <Avatar
                                name={username || "A"}
                                size="16"
                                color={selectedColor}
                                textColor={selectedTextColor}
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-blue-500">
                                {profile.displayname}
                            </h1>
                            {profile.role === "admin" && (
                                <h3 className="text-sm mt-1 text-red-600">
                                    {profile.role.charAt(0).toUpperCase() +
                                        profile.role.slice(1).toLowerCase()}
                                </h3>
                            )}
                            {profile.bio && (
                                <p className="mt-1 text-gray-600">{profile.bio}</p>
                            )}
                        </div>
                    </div>

                    {/* Player Settings */}
                    {user?.id === profile.id && (
                        <div>
                            <h2 className="text-2xl font-semibold mb-4 text-gray-800">User Settings</h2>
                            <div className="space-y-6">
                                {/* Background Color */}
                                <div>
                                    <h3 className="text-xl font-semibold mb-2 text-gray-800">Background Color</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {colors.map((color) => (
                                            <div
                                                key={color}
                                                className={`w-8 h-8 rounded-full border border-gray-300 cursor-pointer ${color} ${
                                                    selectedColor === color
                                                        ? "ring-4 ring-blue-400"
                                                        : ""
                                                }`}
                                                onClick={() => saveSelectedColor(color, "color")}
                                            ></div>
                                        ))}
                                    </div>
                                </div>

                                {/* Icon Color */}
                                <div>
                                    <h3 className="text-xl font-semibold mb-2 text-gray-800">Icon Color</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {textColors.map((color) => (
                                            <div
                                                key={color}
                                                className={`w-8 h-8 rounded-full border border-gray-300 cursor-pointer ${color.replace(
                                                    "text",
                                                    "bg"
                                                )} ${
                                                    selectedTextColor === color
                                                        ? "ring-4 ring-blue-400"
                                                        : ""
                                                }`}
                                                onClick={() => saveSelectedColor(color, "text_color")}
                                            ></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Player Stats */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Player Stats</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-100 p-4 rounded-lg shadow">
                                <p className="text-gray-800">Boards Generated</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {profile.boards_generated ?? "Coming soon!"}
                                </p>
                            </div>
                            <div className="bg-gray-100 p-4 rounded-lg shadow">
                                <p className="text-gray-800">Games Finished</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {profile.games_finished ?? "Coming soon!"}
                                </p>
                            </div>
                            <div className="bg-gray-100 p-4 rounded-lg shadow">
                                <p className="text-gray-800">Games Won</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {profile.games_won ?? "Coming soon!"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Recently Generated Boards */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                            Recently Generated Boards
                        </h2>
                        <div className="space-y-4">
                            {boards.length > 0 ? (
                                boards.map((board, idx) => (
                                    <ProfileGameCard key={idx} game={board} />
                                ))
                            ) : (
                                <p className="text-gray-600 italic">No boards generated yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );

};

export default Profile;