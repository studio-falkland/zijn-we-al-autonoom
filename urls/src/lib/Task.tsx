import { Box, Spacer, Text } from 'ink';
import { Dispatch, ReactNode, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Loader from '../components/Loader';
import React from 'react';
import convertMsToHumanTime from './time';

export interface TaskExecutorProps {
    onFinish: () => void;
    task: Task;
    active: boolean;
}

export interface TaskHandlerProps {
    finish: (message?: string) => void;
    updateTotal: Dispatch<SetStateAction<number>>;
    updateProgress: Dispatch<SetStateAction<number>>;
}

export interface TaskRenderProps {
    name: string;
    description: string;
    total: number | null;
    progress: number | null;
    progressPercentage: string | null;
}

export interface Task {
    name: string;
    description: string;
    onStart(props: TaskHandlerProps): void | Promise<void>;
    onFinish?(): void;
    onRender?(props: TaskRenderProps): ReactNode;
}

export function TaskExecutor({ task, onFinish, active }: TaskExecutorProps) {
    // State variables to keep track of task completion, total and progress
    const [hasFinished, setFinished] = useState(false);
    const [total, updateTotal] = useState<number | null>(null);
    const [progress, updateProgress] = useState<number | null>(null);
    const [finishMessage, setFinishMessage] = useState<string | null>(null);
    const [expectedRemainder, setExpectedRemainder] = useState<number | null>(null);

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

        setFinished(true);
        task.onFinish?.();
        onFinish();
    }, []);

    // Effect hook which runs on mount and starts the task by calling onStart function of task with necessary props
    useEffect(() => {
        if (!active) {
            return () => { };
        }

        task.onStart({
            finish,
            updateProgress: updateProgress as Dispatch<SetStateAction<number>>,
            updateTotal: updateTotal as Dispatch<SetStateAction<number>>,
        });

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
    if (task.onRender) {
        return task.onRender({
            description: task.description,
            name: task.name,
            progress,
            total,
            progressPercentage,
        });
    }

    // If the task does not have an onRender function, render a Text component with task details and progress information
    return (
        <Box gap={2}>
            {!active ? <Text>⏳</Text> : hasFinished ? <Text>✅</Text> : <Loader />}
            <Text>{task.description}</Text>
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