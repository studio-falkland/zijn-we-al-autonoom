import React from 'react';
import { Text } from 'ink';
import { useEffect, useState } from 'react';

const emojis = ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'];

export default function Loader() {
    const [i, setIndex] = useState(0);

    useEffect(() => {
        const increment = () => setIndex((i) => (i + 1) % 12);

        const interval = setInterval(increment, 250);

        return () => clearInterval(interval);
    }, []);

    return <Text>{emojis[i]}</Text>;
}
