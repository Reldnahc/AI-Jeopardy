import { useState } from "react";
import { supabase } from "../../supabaseClient";

const Signup = () => {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState(""); // New username field
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState(""); // Error message
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
            console.log(data);
            if (error && error.code !== "PGRST116") {
                // If the error is not because the username doesn't exist
                console.error("Error checking username:", error);
                return true;
            }
            return !!data; // If data exists, the username is taken
        } catch (err) {
            console.error("Unexpected error during username check:", err);
            return true; // Assume username is taken in case of error
        }
    };

    // Function to handle signup process
    const handleSignup = async (e: { preventDefault: () => void }) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        // Validate inputs
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

        try {
            // Check if the username is already taken
            const taken = await isUsernameTaken(username);
            if (taken) {
                setError("Username is already taken. Please choose another.");
                setLoading(false);
                return;
            }

            // Create the user via Supabase Auth
            const { error } = await supabase.auth.signUp({
                email: email.trim(),
                password: password.trim(),
                options: {
                    data: {
                        username: username.trim(),
                    },
                },
            });

            if (error) {
                setError(error.message);
            } else {
                setSuccess("Please check your Email for a confirmation link.");
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
                {/* New Username Field */}
                <div>
                    <label htmlFor="username" className="block text-blue-500 font-medium">
                        Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        required
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-gray-700 font-medium">
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
                    <label htmlFor="confirmPassword" className="block text-gray-700 font-medium">
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