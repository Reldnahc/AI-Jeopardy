import React from 'react';

const Lobby: React.FC = () => {
    return (
        <div className="h-screen flex flex-col justify-center items-center bg-gray-100">
            <h1 className="text-4xl font-bold mb-4 text-gray-800">Lobby is Empty</h1>
            <p className="text-gray-600">No active sessions or participants are present at the moment.</p>
        </div>
    );
};

export default Lobby;