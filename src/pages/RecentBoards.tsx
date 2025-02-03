import { useState, useEffect, useRef } from 'react';
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
        if (loading || !hasMoreBoards) return; // Prevent loading when already in progress
        setLoading(true);

        const { data, error } = await supabase
            .from('jeopardy_boards') // Replace with your actual table name
            .select('board') // Fetch only the 'board' column
            .order('created_at', { ascending: false }) // Order by created_at
            .range(offset, offset + limit - 1); // Fetch rows from offset up to the limit

        if (error) {
            console.error('Error fetching boards:', error.message);
        } else {
            console.log('Fetched boards:', data); // Debugging log to ensure data is coming back

            // Map and extract the `board` field and add it to state
            if (data) {
                setBoards((prevBoards) => [
                    ...prevBoards,
                    ...data.map(({ board }) => board) // Extract `board` field from each object
                ]);

                // If fewer rows than the limit are returned, set hasMoreBoards to false
                if (data.length < limit) {
                    setHasMoreBoards(false);
                }
            } else {
                setHasMoreBoards(false); // No data returned, stop fetching
            }
        }

        setLoading(false);
    };

    // Initial load of boards on component mount
    useEffect(() => {
        fetchBoards(); // Fetch first set of boards (offset = 0)
    }, []); // No dependencies to ensure it only runs once

    // Infinite scrolling logic
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMoreBoards && !loading) {
                    fetchBoards(boards.length); // Fetch rows starting from the current length
                }
            },
            { threshold: 1.0 } // Trigger when the element is fully visible
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => {
            if (loadMoreRef.current) {
                observer.unobserve(loadMoreRef.current);
            }
        };
    }, [boards.length, loading, hasMoreBoards]); // Observe changes in length, loading, or hasMoreBoards

    return (
        <div className="bg-[#999] min-h-screen p-6">
            <div className="container mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Recent Boards</h1>
                {/* Grid with exactly two cards on large screens */}
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
        </div>
    );
};

export default RecentBoards;