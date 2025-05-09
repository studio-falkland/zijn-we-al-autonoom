import { Box, Text } from 'ink';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import Loader from '@/components/Loader.js';
import React from 'react';
import convertMsToHumanTime from '@/lib/time.js';
import { TaskRenderProps } from './types.js';
import { ProgressBar } from '@inkjs/ui';

export class Task {
    name: string;
    description: string;

    constructor(
        protected finish: (message?: string) => void,
        protected updateTotal: Dispatch<SetStateAction<number>>,
        protected updateProgress: Dispatch<SetStateAction<number>>,
        protected log: (message: string, data?: unknown) => void,
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
        hasFinished,
        hasError,
        finishMessage,
        expectedRemainder,
    }: TaskRenderProps): ReactNode {
        return (
            <Box flexDirection='column'>
                <Box gap={2}>
                    {hasError
                        ? <Text>❌</Text>
                        : (hasFinished
                            ? <Text>✅</Text>
                            : <Loader />
                        )}
                    <Text>{this.description}</Text>
                    {(progress !== null && total !== null && !finishMessage)
                        ? (
                                <Text>
                                    :
                                    {progress}
                                    {' '}
                                    /
                                    {total}
                                    {' '}
                                    [
                                    {progressPercentage}%
                                    ]
                                </Text>
                            )
                        : null}
                    {expectedRemainder
                        ? (
                                <Text>
                                    (Remaining expected time:
                                    {convertMsToHumanTime(expectedRemainder)}
                                    )
                                </Text>
                            )
                        : null}
                    {finishMessage
                        ? (
                                <Text>{finishMessage}</Text>
                            )
                        : null}
                </Box>
                <Box height={1}>
                    <ProgressBar value={progressPercentage || 0} />
                </Box>
            </Box>
        );
    }
}
