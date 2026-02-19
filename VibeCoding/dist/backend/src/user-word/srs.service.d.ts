export declare class SRSService {
    calculateNextReview(quality: number, currentInterval: number, reps: number, difficulty: number): {
        interval: number;
        reps: number;
        difficulty: number;
        nextReviewAt: Date;
    };
}
