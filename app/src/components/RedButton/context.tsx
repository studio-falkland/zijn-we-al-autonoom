'use client'
import { createContext, Dispatch, PropsWithChildren, SetStateAction, useContext, useEffect, useState } from 'react';

export type RedButtonContextValue = [boolean, Dispatch<SetStateAction<boolean>>];

/**
 * The context that keeps track of the red button state
 */
export const RedButtonContext = createContext<RedButtonContextValue>(
    [false, () => {}]
);

/**
 * Access the red button state using a hook
 */
export const useRedButton = () => useContext(RedButtonContext);

/**
 * Inject the state for the RedButton state in the React tree
 */
export const RedButtonProvider = ({ children }: PropsWithChildren) => {
    const state = useState(false);

    return (
        <RedButtonContext.Provider value={state}>
            {children}
        </RedButtonContext.Provider>
    );
};