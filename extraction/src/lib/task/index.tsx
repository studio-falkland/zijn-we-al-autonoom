import { Box, Spacer, Text } from 'ink';
import { Dispatch, ReactNode, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Loader from '@/components/Loader.js';
import React from 'react';
import convertMsToHumanTime from '@/lib/time.js';

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

// export interface Task {
//     name: string;
//     description: string;
//     onStart(props: TaskHandlerProps): void | Promise<void>;
//     onFinish?(): void;
//     onRender?(props: TaskRenderProps): ReactNode;
// }

export class Task {
    name: string;
    description: string;

    constructor(
        protected finish: (message?: string) => void,
        protected updateTotal: Dispatch<SetStateAction<number>>,
        protected updateProgress: Dispatch<SetStateAction<number>>,
        protected log: (...args: any[]) => void,
    ) { }

    onStart(): void | Promise<void> {
        // EMPTY
    }

    onFinish(): void {
        // EMPTY
    }

    onRender({
        total,
        progress,
        progressPercentage,
        active,
        hasFinished,
        finishMessage,
        expectedRemainder
    }: TaskRenderProps): ReactNode {
        return (
            <Box gap={2}>
                {!active ? <Text>⏳</Text> : hasFinished ? <Text>✅</Text> : <Loader />}
                <Text>{this.description}</Text>
                {(progress !== null && total !== null && !finishMessage) ? (
                    <Text>: {progress} / {total} [{progressPercentage}]</Text>
                ) : null}
                {expectedRemainder ? (
                    <Text>(Remaining expected time: {convertMsToHumanTime(expectedRemainder)})</Text>
                ) : null}
                {finishMessage ? (
                    <Text>{finishMessage}</Text>
                ) : null}
            </Box>
        );
    }
}

export function TaskExecutor({ task, onFinish, active }: TaskExecutorProps) {
    // State variables to keep track of task completion, total and progress
    const [hasFinished, setFinished] = useState(false);
    const [total, updateTotal] = useState<number | null>(null);
    const [progress, updateProgress] = useState<number | null>(null);
    const [finishMessage, setFinishMessage] = useState<string | null>(null);
    const [expectedRemainder, setExpectedRemainder] = useState<number | null>(null);
    const log = useMemo(() => (...args: any[]) => console.log(`[${task.name}]`, ...args), [task.name]);

    // Maintain a ref to progress so we can update it in useEffect without causing an infinite loop
    const progressRef = useRef<{ progress: number | null, total: number | null }>({ progress: null, total: null });

    // Calculate the progress percentage using useMemo hook which will only re-calculate when total or progress changes
    const progressPercentage = useMemo(() => (
        progress !== null && total !== null ? `${Math.round((progress / total!) * 100)}%` : null
    ), [total, progress]);

    // Finish function which sets the task to finished and calls onFinish
    const finish = useCallback((message?: string) => {
        if (message) {
            setFinishMessage(message);
        }

        log('Finished task');

        setFinished(true);
        onFinish();
    }, []);

    const taskInstance = useMemo(() => (
        new task(
            finish,
            updateTotal as Dispatch<SetStateAction<number>>,
            updateProgress as Dispatch<SetStateAction<number>>,
            log
        )
    ), [task]);

    // Effect hook which runs on mount and starts the task by calling onStart function of task with necessary props
    useEffect(() => {
        if (!active) {
            return () => { };
        }

        log(`Starting task`);

        taskInstance.onStart();

        const start = new Date().getTime();

        function calculateRemainder() {
            const { total, progress } = progressRef.current;

            if (!progress || !total) {
                return;
            }

            const elapsedTime = new Date().getTime() - start;
            const timePerTask = elapsedTime / progress;
            const expectedRemainder = timePerTask * (total - progress);
            setExpectedRemainder(expectedRemainder);
        }

        const interval = setInterval(calculateRemainder, 1_000);

        return () => clearInterval(interval);
    }, [active]);

    useEffect(() => {
        progressRef.current = { progress, total };
    }, [total, progress])

    // If the task has an onRender function, call it with necessary props and return its result
    return taskInstance.onRender({
        progress,
        total,
        progressPercentage,
        active,
        expectedRemainder,
        finishMessage,
        hasFinished,
    });
}