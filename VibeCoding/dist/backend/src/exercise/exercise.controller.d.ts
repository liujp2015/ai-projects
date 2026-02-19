import { ExerciseService } from './exercise.service';
export declare class ExerciseController {
    private readonly exerciseService;
    constructor(exerciseService: ExerciseService);
    getExercises(documentId: string): Promise<import("./exercise.service").Exercise[]>;
}
