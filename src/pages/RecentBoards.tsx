import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import GameCard from '../components/recentboards/GameCard';
import { Board } from '../types/Board.ts';
import { supabase } from '../supabaseClient.ts';

const RecentBoards = () => {
    const [boards, setBoards] = useState<Board[]>([]); // Holds the current list of boards
    const [loading, setLoading] = useState(false); // Controls request throttling
    const [hasMoreBoards, setHasMoreBoards] = useState(true); // Controls when to stop loading more
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    // Fetch boards from Supabase
    const fetchBoards = async (offset: number = 0, limit: number = 10) => {
        if (loading || !hasMoreBoards) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('jeopardy_boards') // Replace with your actual table name
            .select('board') // Fetch only the 'board' column
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching boards:', error.message);
        } else if (data) {
            setBoards((prevBoards) => [
                ...prevBoards,
                ...data.map(({ board }) => board)
            ]);
            if (data.length < limit) {
                setHasMoreBoards(false);
            }
        } else {
            setHasMoreBoards(false);
        }
        setLoading(false);
    };

    // Initial load on component mount
    useEffect(() => {
        fetchBoards();
    }, []);

    // Infinite scrolling logic
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMoreBoards && !loading) {
                    fetchBoards(boards.length);
                }
            },
            { threshold: 1.0 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => {
            if (loadMoreRef.current) {
                observer.unobserve(loadMoreRef.current);
            }
        };
    }, [boards.length, loading, hasMoreBoards]);

    return (
        <div className="min-h-screen bg-gradient-to-r from-indigo-400 to-blue-700 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-6xl"
            >
                <div className="p-10">
                    <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
                        Recent Boards
                    </h1>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {boards.map((game, idx) => (
                            <GameCard key={idx} game={game} />
                        ))}
                    </div>
                    {loading && (
                        <div className="text-center text-gray-700 my-4 italic">
                            Loading more boards...
                        </div>
                    )}
                    {!hasMoreBoards && !loading && (
                        <div className="text-center text-gray-700 my-4 italic">
                            No more boards to load.
                        </div>
                    )}
                    {/* Dummy div to trigger infinite scroll */}
                    <div ref={loadMoreRef} className="h-12"></div>
                </div>
            </motion.div>
        </div>
    );
};

export default RecentBoards;
