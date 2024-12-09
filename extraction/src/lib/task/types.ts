
export interface TaskRenderProps {
    active: boolean;
    hasFinished: boolean;
    hasError: boolean;
    finishMessage: string | null;
    total: number | null;
    progress: number | null;
    progressPercentage: string | null;
    expectedRemainder: number | null;
}