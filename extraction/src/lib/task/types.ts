import { Dispatch, SetStateAction } from 'react';

export interface TaskExecutorProps {
    onFinish: () => void;
    task: typeof Task;
    active: boolean;
}

export interface TaskRenderProps {
    active: boolean;
    hasFinished: boolean;
    finishMessage: string | null;
    total: number | null;
    progress: number | null;
    progressPercentage: string | null;
    expectedRemainder: number | null;
}

export interface TaskHandlers {
    finish: (message?: string) => void;
    updateTotal: Dispatch<SetStateAction<number>>;
    updateProgress: Dispatch<SetStateAction<number>>;
    log: (...args: any[]) => void;
}
