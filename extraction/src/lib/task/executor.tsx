import { Dispatch, SetStateAction, useState, useMemo, useRef, useCallback, useEffect } from 'react';
import logger from '../logger.js';
import { Task } from './index.jsx';

export interface TaskExecutorProps {
    onFinish: () => void;
    task: typeof Task;
}

export interface TaskHandlers {
    finish: (message?: string) => void;
    updateTotal: Dispatch<SetStateAction<number>>;
    updateProgress: Dispatch<SetStateAction<number>>;
    log: (message: string, data: unknown) => void;
}

export default function TaskExecutor({ task, onFinish }: TaskExecutorProps) {
    // State variables to keep track of task completion, total and progress
    const [hasFinished, setFinished] = useState(false);
    const [hasError, setError] = useState(false);
    const [total, updateTotal] = useState<number | null>(null);
    const [progress, updateProgress] = useState<number | null>(null);
    const [finishMessage, setFinishMessage] = useState<string | null>(null);
    const [expectedRemainder, setExpectedRemainder] = useState<number | null>(null);
    const log = useMemo(() => (message: string, data?: unknown) => (
        logger
            .child({ name: task.name, data })
            .info(message)
    ), [task.name]);

    // Maintain a ref to progress so we can update it in useEffect without causing an infinite loop
    const progressRef = useRef<{ progress: number | null; total: number | null }>({ progress: null, total: null });

    // Calculate the progress percentage using useMemo hook which will only re-calculate when total or progress changes
    
    const progressPercentage = useMemo(() => (
        progress !== null && total !== null ? Math.round((progress / total!) * 100) : null
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
            log,
        )
    ), [task]);

    // Effect hook which runs on mount and starts the task by calling onStart function of task with necessary props
    useEffect(() => {
        // Reset all task state
        setFinished(false);
        setError(false);
        setFinishMessage(null);
        setExpectedRemainder(null);
        updateTotal(null);
        updateProgress(null);

        log(`Starting task`);

        try {
            taskInstance.onStart();
        }
        catch (err) {
            logger.child({ name: task.name, err });
            setError(true);
            finish();
        }

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
    }, [task.name]);

    useEffect(() => {
        progressRef.current = { progress, total };
    }, [total, progress]);

    // If the task has an onRender function, call it with necessary props and return its result
    return taskInstance.onRender({
        progress,
        total,
        progressPercentage,
        expectedRemainder,
        finishMessage,
        hasFinished,
        hasError,
    });
}