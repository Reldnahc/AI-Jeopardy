import React from "react";

interface AvatarProps {
    name: string; // Player name
    size?: string;
    color?: string | null;// CSS size for the avatar (optional, default is "8")
}

const Avatar: React.FC<AvatarProps> = ({ name, size = "8", color = "bg-blue-500"}) => {
    const avatarSize = `${parseInt(size) * 4}px`; // Convert size into pixel values (e.g., "8" -> "32px")

    return (
        <div
            className={`rounded-full ${color} flex justify-center items-center text-white font-bold`}
            style={{
                width: avatarSize,
                height: avatarSize,
                fontSize: `${parseInt(size) * 2}px`, // Dynamically scale font size
            }}
        >
            {name?.charAt(0).toUpperCase()}
        </div>
    );
};

export default Avatar;