import { AIService } from './ai.service';
export declare class AIController {
    private readonly aiService;
    constructor(aiService: AIService);
    validate(word: string, scenario: string, sentence: string): Promise<any>;
    qwenImagesParse(files: Express.Multer.File[]): Promise<string>;
}
