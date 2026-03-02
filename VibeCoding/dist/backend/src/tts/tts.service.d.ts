export declare class TTSService {
    private readonly logger;
    private tts;
    private initialized;
    private initializing;
    private initAttempts;
    private readonly maxInitAttempts;
    constructor();
    private ensureInitialized;
    getAudioStream(text: string, voice?: string): Promise<Buffer<ArrayBufferLike>>;
}
