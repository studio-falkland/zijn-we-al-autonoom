
export interface TaskRenderProps {
    hasFinished: boolean;
    hasError: boolean;
    finishMessage: string | null;
    total: number | null;
    progress: number | null;
    progressPercentage: number | null;
    expectedRemainder: number | null;
}