// A generic debounced value.
//
// Returns `value` only once it has stopped changing for `delay` ms — handy for
// search boxes that hit a remote API on every keystroke. The pending update is
// cleared whenever the value (or delay) changes again.
import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);

    // Restart the timer on every change; only the last one survives.
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);

    return debounced;
}
