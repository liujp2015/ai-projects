import { DictionaryService } from './dictionary.service';
export declare class DictionaryController {
    private readonly dictionaryService;
    constructor(dictionaryService: DictionaryService);
    lookup(word: string): Promise<import("@prisma/client/runtime/library").JsonValue | {
        word: string;
        phonetic: any;
        phonetics: any;
        translation: string;
        definitionZh: string;
        meanings: any;
    }>;
}
