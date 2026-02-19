import { TTSService } from './tts.service';
import type { Response } from 'express';
export declare class TTSController {
    private readonly ttsService;
    constructor(ttsService: TTSService);
    streamAudio(text: string, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
