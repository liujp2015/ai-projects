export declare class TTSService {
    private readonly logger;
    private tts;
    constructor();
    getAudioStream(text: string, voice?: string): Promise<Buffer<ArrayBufferLike>>;
}
