"use client";

import { useState, useEffect } from "react";

interface Star {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
    minOpacity: number;
    maxOpacity: number;
}

function generateStars(): Star[] {
    const result: Star[] = [];
    for (let i = 0; i < 40; i++) {
        result.push({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 1.5 + 0.2,
            duration: Math.random() * 5 + 5,
            delay: Math.random() * 6,
            minOpacity: Math.random() * 0.05 + 0.02,
            maxOpacity: Math.random() * 0.2 + 0.08,
        });
    }
    return result;
}

export default function StarBackground() {
    // Start with empty — server renders nothing, avoiding SSR/client mismatch
    const [stars, setStars] = useState<Star[]>([]);

    useEffect(() => {
        // Only runs on the client after hydration is complete
        setStars(generateStars());
    }, []);

    return (
        <div className="star-field" aria-hidden="true">
            {stars.map((s) => (
                <div
                    key={s.id}
                    className="star"
                    style={
                        {
                            left: `${s.x}%`,
                            top: `${s.y}%`,
                            width: `${s.size}px`,
                            height: `${s.size}px`,
                            "--duration": `${s.duration}s`,
                            "--delay": `${s.delay}s`,
                            "--min-opacity": s.minOpacity,
                            "--max-opacity": s.maxOpacity,
                        } as React.CSSProperties
                    }
                />
            ))}
        </div>
    );
}

