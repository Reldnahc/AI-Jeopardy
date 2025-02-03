import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../supabaseClient"; // Import your Supabase client
import { User } from "@supabase/supabase-js"; // Import Supabase types

// Define the shape of the context's value
interface AuthContextType {
    user: User | null; // Supabase User object or null if not logged in
    setUser: React.Dispatch<React.SetStateAction<User | null>>; // Function to update the user state
    loading: boolean; // Loading state during session check
}

// Create the context with a default value of `null`, which will later be overridden
const AuthContext = createContext<AuthContextType | null>(null);

// Define the props for the AuthProvider component
interface AuthProviderProps {
    children: ReactNode; // ReactNode allows any valid React children
}

// AuthProvider component to wrap the application
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null); // State to hold the authenticated user
    const [loading, setLoading] = useState<boolean>(true); // To indicate loading state during session fetch

    useEffect(() => {
        // Fetch the current session when the app starts
        const getSession = async () => {
            const { data: result, error } = await supabase.auth.getSession();

            if (error) {
                console.error("Error fetching session:", error.message);
            }

            setUser(result.session?.user || null); // Update user state from the session
            setLoading(false); // Stop loading once session is checked
        };

        getSession();

        // Listen to auth state changes (login/logout/token refresh)
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null); // Update user state on auth change
        });

        // Cleanup listener on component unmount
        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);

    // If no AuthProvider is wrapping the component, throw an error
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider.");
    }

    return context;
};