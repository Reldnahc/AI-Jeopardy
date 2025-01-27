export interface DrawingPath {
    drawMode: boolean;
    strokeColor: string;
    strokeWidth: number;
    paths: { x: number; y: number }[];
}

export const convertToSVG = (drawingData: DrawingPath[]) => {
    try {
        return (
            <svg width="300" height="125" viewBox="0 0 700 250" xmlns="http://www.w3.org/2000/svg" style={{ background: 'white', border: '1px solid black' }}>
        {drawingData.map((item, index) => (
            <path
                key={index}
            d={item.paths.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')}
            stroke={item.strokeColor}
            strokeWidth={item.strokeWidth}
            fill="none"
                />
        ))}
        </svg>
    );
    } catch (error) {
        console.error('Invalid drawing data:', error);
        return <p>Error rendering drawing.</p>;
    }
};