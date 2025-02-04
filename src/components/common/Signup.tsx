import { useState } from "react";
import { supabase } from "../../supabaseClient";

const Signup = () => {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState(""); // New username field
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState(""); // General error message
    const [usernameError, setUsernameError] = useState(""); // Specific real-time error for username
    const [success, setSuccess] = useState(""); // Success message
    const [loading, setLoading] = useState(false); // Loading state

    // Function to check if the username is already taken
    const isUsernameTaken = async (username: string): Promise<boolean> => {
        try {
            const { data, error } = await supabase
                .from("profiles") // Replace "users" with the name of your table
                .select("username")
                .eq("username", username)
                .single(); // Fetch the first match
            if (error && error.code !== "PGRST116") {
                console.error("Error checking username:", error);
                return true;
            }
            return !!data; // If data exists, the username is taken
        } catch (err) {
            console.error("Unexpected error during username check:", err);
            return true; // Assume username is taken in case of error
        }
    };

    const validateUsernameRegex = (username: string): string | null => {
        const normalizedUsername = username.toLowerCase(); // Normalize to lowercase
        const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_ ]{2,15}$/; // Allow letters, numbers, underscores, and spaces

        if (!usernameRegex.test(normalizedUsername)) {
            return "Username must be 3-16 characters, start with a letter, and contain only letters, numbers, spaces, or underscores.";
        }

        if (/\s{2,}/.test(normalizedUsername)) {
            return "Username cannot contain consecutive spaces.";
        }

        return null; // Username is valid
    };


    const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        setUsername(input);

        const normalizedInput = input.toLowerCase(); // Normalize to lowercase before validation

        // Validate username format
        const errorMessage = validateUsernameRegex(normalizedInput);
        if (errorMessage) {
            setUsernameError(errorMessage);
        } else {
            // Check if username is taken
            const taken = await isUsernameTaken(normalizedInput);
            if (taken) {
                setUsernameError("Username is already taken. Please choose another.");
            } else {
                setUsernameError(""); // No error
            }
        }
    };


    const handleSignup = async (e: { preventDefault: () => void }) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        // General form validation
        if (!email || !username || !password || !confirmPassword) {
            setError("All fields are required.");
            setLoading(false);
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }
        if (usernameError) {
            setError("Please resolve username issues before signing up.");
            setLoading(false);
            return;
        }

        try {
            // Check if the username is taken (final validation)
            const taken = await isUsernameTaken(username);
            if (taken) {
                setError("Username is already taken. Please choose another.");
                setLoading(false);
                return;
            }

            const { error } = await supabase.auth.signUp({
                email: email.trim(),
                password: password.trim(),
                options: {
                    data: {
                        username: username.trim().toLowerCase(),
                        displayname: username.trim()
                    },
                },
            });

            if (error) {
                setError(error.message);
            } else {
                setSuccess("Please check your email for a confirmation link.");
            }
        } catch (err) {
            console.error("Unexpected error during signup:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-sm mx-auto rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-center text-blue-500">Sign Up</h2>
            <form onSubmit={handleSignup} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-blue-500 font-medium">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="username" className="block text-blue-500 font-medium">
                        Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={handleUsernameChange}
                        placeholder="Enter your username"
                        required
                        className={`w-full p-3 border rounded focus:outline-none focus:ring-2 ${
                            usernameError
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-300 focus:ring-blue-500"
                        }`}
                    />
                    {usernameError && <p className="text-red-500 text-sm mt-1">{usernameError}</p>}
                </div>
                <div>
                    <label htmlFor="password" className="block text-blue-500 font-medium">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter a strong password"
                        required
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword" className="block text-blue-500 font-medium">
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                {success && <p className="text-green-500 text-sm mt-2">{success}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
                        loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                >
                    {loading ? "Signing up..." : "Sign Up"}
                </button>
            </form>
        </div>
    );
};

export default Signup;