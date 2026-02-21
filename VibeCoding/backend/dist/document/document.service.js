"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DocumentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const common_1 = require("@nestjs/common");
const mammoth = __importStar(require("mammoth"));
const prisma_service_1 = require("../prisma/prisma.service");
const ocr_service_1 = require("../ai/ocr.service");
const ai_service_1 = require("../ai/ai.service");
let DocumentService = DocumentService_1 = class DocumentService {
    prisma;
    ocrService;
    aiService;
    logger = new common_1.Logger(DocumentService_1.name);
    constructor(prisma, ocrService, aiService) {
        this.prisma = prisma;
        this.ocrService = ocrService;
        this.aiService = aiService;
    }
    async parseAndSaveDocument(file, title) {
        let text = '';
        const mimeType = file.mimetype;
        try {
            if (mimeType === 'application/pdf') {
                const pdfjs = await import('pdfjs-dist');
                if (pdfjs.GlobalWorkerOptions) {
                    pdfjs.GlobalWorkerOptions.workerSrc = '';
                }
                const loadingTask = pdfjs.getDocument({ data: new Uint8Array(file.buffer) });
                const pdf = await loadingTask.promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const pageText = content.items
                        .map((item) => item.str)
                        .join(' ');
                    fullText += pageText + '\n\n';
                }
                text = fullText;
            }
            else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                mimeType === 'application/msword') {
                const result = await mammoth.extractRawText({ buffer: file.buffer });
                text = result.value;
            }
            else if (mimeType === 'text/plain') {
                text = file.buffer.toString('utf-8');
            }
            else {
                throw new Error('Unsupported file type');
            }
            return this.saveStructuredContent(text, title, file.originalname, file.size, mimeType);
        }
        catch (error) {
            this.logger.error(`Failed to parse document: ${error.message}`);
            throw error;
        }
    }
    async parseAndSaveImages(files, title) {
        const originalTexts = [];
        const chineseTexts = [];
        const englishTexts = [];
        for (const file of files) {
            const mimeType = file.mimetype;
            if (!mimeType.startsWith('image/')) {
                throw new Error(`Unsupported image type: ${mimeType}`);
            }
            const ocrResult = await this.ocrService.imageToTextStructured(file);
            originalTexts.push(ocrResult.originalText);
            chineseTexts.push(ocrResult.chineseText);
            englishTexts.push(ocrResult.englishText);
        }
        const mergedOriginal = originalTexts.join('\n\n');
        const mergedChinese = chineseTexts.filter((t) => t.trim()).join('\n');
        const mergedEnglish = englishTexts.filter((t) => t.trim()).join('\n');
        return this.saveStructuredContentWithOCR(mergedOriginal, mergedChinese, mergedEnglish, title, `${title}.images`, files.reduce((sum, f) => sum + f.size, 0), 'image/*');
    }
    async saveRawText(content, title) {
        return this.saveStructuredContent(content, title, 'manual-input.txt', Buffer.byteLength(content), 'text/plain');
    }
    async saveStructuredContentWithOCR(originalText, chineseText, englishText, title, filename, fileSize, mimeType) {
        const document = await this.prisma.document.create({
            data: {
                title: title,
                filename: filename,
                fileSize: fileSize,
                mimeType: mimeType,
                originalText: originalText,
                chineseText: chineseText,
                englishText: englishText,
            },
        });
        return this.saveStructuredContent(originalText, title, filename, fileSize, mimeType, document.id);
    }
    async saveStructuredContent(text, title, filename, fileSize, mimeType, existingDocumentId) {
        let document;
        if (existingDocumentId) {
            document = await this.prisma.document.findUnique({ where: { id: existingDocumentId } });
            if (!document) {
                throw new Error('Document not found');
            }
        }
        else {
            document = await this.prisma.document.create({
                data: {
                    title: title,
                    filename: filename,
                    fileSize: fileSize,
                    mimeType: mimeType,
                },
            });
        }
        const paragraphTexts = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        for (let i = 0; i < paragraphTexts.length; i++) {
            const pText = paragraphTexts[i].trim();
            const paragraph = await this.prisma.paragraph.create({
                data: {
                    content: pText,
                    orderIndex: i,
                    documentId: document.id,
                },
            });
            const sentenceTexts = pText.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [pText];
            await this.prisma.sentence.createMany({
                data: sentenceTexts
                    .map(s => s.trim())
                    .filter(s => s.length > 0)
                    .map((s, index) => ({
                    content: s,
                    orderIndex: index,
                    paragraphId: paragraph.id,
                })),
            });
        }
        return document;
    }
    async findAll() {
        return this.prisma.document.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        return this.prisma.document.findUnique({
            where: { id },
            include: {
                paragraphs: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        sentences: { orderBy: { orderIndex: 'asc' } },
                    },
                },
            },
        });
    }
    async appendText(documentId, newText) {
        const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
        if (!doc)
            throw new Error('Document not found');
        this.logger.log(`Appending text to document ${documentId}...`);
        const alignedPairsRaw = await this.aiService.extractAlignedSentencePairsFromEnglishArticle(newText);
        const containsChinese = (s) => /[\u3400-\u9FFF]/.test(s);
        const sanitizeEnglishSentence = (input) => {
            let s = String(input ?? '').trim();
            s = s.replace(/\s*[\(（][^\)）]*[\u3400-\u9FFF][^\)）]*[\)）]\s*/g, ' ');
            s = s.replace(/[\u3400-\u9FFF]/g, '');
            s = s.replace(/[，。！？、“”‘'《》【】（）]/g, '');
            s = s.replace(/\s+/g, ' ').trim();
            return s;
        };
        const alignedPairs = alignedPairsRaw
            .map((p) => ({
            en: sanitizeEnglishSentence(p.en),
            zh: String(p.zh ?? '').trim(),
        }))
            .filter((p) => p.en.length > 0 && !containsChinese(p.en) && /[A-Za-z]/.test(p.en));
        if (alignedPairs.length === 0) {
            throw new Error('AI failed to extract valid aligned sentence pairs from new text');
        }
        const newZhLines = alignedPairs.map(p => p.zh);
        const newEnLines = alignedPairs.map(p => p.en);
        const newOCRResult = {
            originalText: newText,
            chineseText: newZhLines.join('\n'),
            englishText: newEnLines.join('\n'),
        };
        const mergedResult = await this.ocrService.mergeAndStructureContent(doc.originalText || '', doc.chineseText || '', doc.englishText || '', [newOCRResult]);
        await this.prisma.document.update({
            where: { id: documentId },
            data: {
                originalText: mergedResult.originalText,
                chineseText: mergedResult.chineseText,
                englishText: mergedResult.englishText,
            },
        });
        this.logger.log(`Successfully appended text to document ${documentId}. Content merged and structured.`);
        this.logger.log(`Updated originalText length: ${mergedResult.originalText.length}`);
        this.logger.log(`Updated chineseText lines: ${mergedResult.chineseText.split(/\r?\n/).length}`);
        this.logger.log(`Updated englishText lines: ${mergedResult.englishText.split(/\r?\n/).length}`);
        return this.findOne(documentId);
    }
    async appendImages(documentId, files) {
        const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
        if (!doc)
            throw new Error('Document not found');
        this.logger.log(`Appending ${files.length} image(s) to document ${documentId}...`);
        const newImagesOCRResults = [];
        for (const file of files) {
            const ocrResult = await this.ocrService.imageToTextStructured(file);
            newImagesOCRResults.push(ocrResult);
        }
        const mergedResult = await this.ocrService.mergeAndStructureContent(doc.originalText || '', doc.chineseText || '', doc.englishText || '', newImagesOCRResults);
        await this.prisma.document.update({
            where: { id: documentId },
            data: {
                originalText: mergedResult.originalText,
                chineseText: mergedResult.chineseText,
                englishText: mergedResult.englishText,
            },
        });
        this.logger.log(`Successfully appended ${files.length} image(s) to document ${documentId}. Content merged and structured.`);
        this.logger.log(`Updated originalText length: ${mergedResult.originalText.length}`);
        this.logger.log(`Updated chineseText lines: ${mergedResult.chineseText.split(/\r?\n/).length}`);
        this.logger.log(`Updated englishText lines: ${mergedResult.englishText.split(/\r?\n/).length}`);
        return this.findOne(documentId);
    }
    async translateAlignRebuild(documentId, overrideFullText) {
        const doc = await this.prisma.document.findUnique({
            where: { id: documentId },
            include: {
                paragraphs: {
                    orderBy: { orderIndex: 'asc' },
                    include: { sentences: { orderBy: { orderIndex: 'asc' } } },
                },
            },
        });
        if (!doc)
            throw new Error('Document not found');
        let fullEnglishText = '';
        if (overrideFullText) {
            fullEnglishText = overrideFullText;
        }
        else {
            fullEnglishText = doc.paragraphs
                .map((p) => p.sentences.map((s) => s.content).join(' '))
                .join('\n\n');
        }
        this.logger.log(`Realigning document ${documentId}. Text length: ${fullEnglishText.length}`);
        await this.prisma.document.update({
            where: { id: documentId },
            data: { originalText: fullEnglishText },
        });
        const alignedPairsRaw = await this.aiService.extractAlignedSentencePairsFromEnglishArticle(fullEnglishText);
        const containsChinese = (s) => /[\u3400-\u9FFF]/.test(s);
        const sanitizeEnglishSentence = (input) => {
            let s = String(input ?? '').trim();
            s = s.replace(/\s*[\(（][^\)）]*[\u3400-\u9FFF][^\)）]*[\)）]\s*/g, ' ');
            s = s.replace(/[\u3400-\u9FFF]/g, '');
            s = s.replace(/[，。！？、“”‘’《》【】（）]/g, '');
            s = s.replace(/\s+/g, ' ').trim();
            return s;
        };
        const alignedPairs = alignedPairsRaw
            .map((p) => ({
            en: sanitizeEnglishSentence(p.en),
            zh: String(p.zh ?? '').trim(),
        }))
            .filter((p) => p.en.length > 0 && !containsChinese(p.en) && /[A-Za-z]/.test(p.en));
        if (alignedPairs.length === 0) {
            throw new Error('AI failed to extract valid aligned sentence pairs');
        }
        const allSentenceIds = doc.paragraphs.flatMap(p => p.sentences.map(s => s.id));
        if (allSentenceIds.length > 0) {
            await this.prisma.userWord.updateMany({
                where: { sourceSentenceId: { in: allSentenceIds } },
                data: { sourceSentenceId: null },
            });
        }
        await this.prisma.exerciseQuestion.deleteMany({ where: { documentId } });
        await this.prisma.$executeRaw `
      DELETE FROM "AlignedSentencePair" WHERE "documentId" = ${documentId}
    `;
        await this.prisma.paragraph.deleteMany({ where: { documentId } });
        const newParagraph = await this.prisma.paragraph.create({
            data: {
                content: fullEnglishText,
                orderIndex: 0,
                documentId: documentId,
            },
        });
        const sentenceData = alignedPairs.map((pair, index) => ({
            content: pair.en,
            translationZh: pair.zh,
            orderIndex: index,
            paragraphId: newParagraph.id,
        }));
        await this.prisma.sentence.createMany({
            data: sentenceData,
        });
        if (alignedPairs.length > 0) {
            await this.prisma.alignedSentencePair.createMany({
                data: alignedPairs.map((pair, index) => ({
                    orderIndex: index,
                    en: pair.en,
                    zh: pair.zh,
                    documentId,
                })),
            });
        }
        this.logger.log(`Successfully realigned ${documentId} into ${alignedPairs.length} sentences`);
        const mergedZh = alignedPairs.map(p => p.zh).join('\n');
        const mergedEn = alignedPairs.map(p => p.en).join('\n');
        await this.prisma.document.update({
            where: { id: documentId },
            data: {
                chineseText: mergedZh,
                englishText: mergedEn,
            },
        });
        return { total: alignedPairs.length, status: 'success' };
    }
    async translateMissingSentences(documentId) {
        const sentences = await this.prisma.sentence.findMany({
            where: {
                paragraph: {
                    documentId,
                },
                translationZh: null,
            },
            orderBy: { orderIndex: 'asc' },
        });
        if (sentences.length === 0) {
            return { total: 0, translated: 0 };
        }
        const translations = await this.aiService.translateEnglishToChinese(sentences.map((s) => s.content));
        await this.prisma.$transaction(sentences.map((s, idx) => this.prisma.sentence.update({
            where: { id: s.id },
            data: { translationZh: translations[idx] },
        })));
        return { total: sentences.length, translated: sentences.length };
    }
    async getDocumentTranslation(documentId) {
        const doc = await this.prisma.document.findUnique({
            where: { id: documentId },
            include: {
                paragraphs: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        sentences: { orderBy: { orderIndex: 'asc' } },
                    },
                },
            },
        });
        if (!doc)
            return null;
        const allSentences = doc.paragraphs.flatMap((p) => p.sentences);
        const total = allSentences.length;
        const translated = allSentences.filter((s) => !!s.translationZh).length;
        const sentenceData = allSentences
            .map((s) => ({
            id: s.id,
            content: s.content,
            translationZh: s.translationZh || null,
        }));
        const translationText = doc.paragraphs
            .map((p) => p.sentences
            .map((s) => (s.translationZh && s.translationZh.trim() ? s.translationZh.trim() : '（未翻译）'))
            .join(''))
            .join('\n\n');
        return { documentId, total, translated, translationText, sentenceData };
    }
    tokenizeForTest(text) {
        return text
            .split(/[^a-zA-Z0-9'-]+/)
            .filter((t) => t.length > 0 && !/^[0-9]+$/.test(t));
    }
    shuffleArray(arr) {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }
    async getRandomWordsFromDoc(documentId, exclude, count = 3) {
        const sentences = await this.prisma.sentence.findMany({
            where: { paragraph: { documentId } },
            select: { content: true },
        });
        const excludeSet = new Set(exclude.map((e) => e.toLowerCase()));
        const allWords = Array.from(new Set(sentences.flatMap((s) => this.tokenizeForTest(s.content))));
        const candidates = allWords
            .map((w) => w.trim())
            .filter((w) => w.length >= 4 && !excludeSet.has(w.toLowerCase()));
        const picked = this.shuffleArray(candidates).slice(0, count);
        const fallbackPool = ['feature', 'system', 'process', 'method', 'result', 'context', 'example', 'pattern', 'support', 'change'];
        const out = [];
        const used = new Set();
        for (const w of picked) {
            const k = w.toLowerCase();
            if (used.has(k) || excludeSet.has(k))
                continue;
            used.add(k);
            out.push(w);
        }
        for (const w of fallbackPool) {
            if (out.length >= count)
                break;
            const k = w.toLowerCase();
            if (used.has(k) || excludeSet.has(k))
                continue;
            used.add(k);
            out.push(w);
        }
        return out.slice(0, count);
    }
    normalizeForCompare(s) {
        return s
            .replace(/[“”"'.,!?;:()\[\]{}]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }
    async generateQuestions(documentId, force = false) {
        const doc = await this.prisma.document.findUnique({
            where: { id: documentId },
            include: {
                paragraphs: {
                    include: { sentences: true },
                },
            },
        });
        if (!doc)
            throw new Error('Document not found');
        if (force) {
            await this.prisma.exerciseQuestion.deleteMany({ where: { documentId } });
        }
        const zhLines = (doc.chineseText || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
        const enLines = (doc.englishText || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
        const sentencePairs = zhLines.map((zh, i) => ({ zh, en: enLines[i] }))
            .filter(item => item.en && (item.en.includes(' ') && item.en.length > 15));
        const wordPairs = zhLines.map((zh, i) => ({ zh, en: enLines[i] }))
            .filter(item => item.en && !(item.en.includes(' ') && item.en.length > 15));
        const sentences = doc.paragraphs.flatMap(p => p.sentences);
        let questionsCreated = 0;
        for (const pair of sentencePairs) {
            try {
                const matchedSent = sentences.find(s => this.normalizeForCompare(s.content).includes(this.normalizeForCompare(pair.en)) ||
                    this.normalizeForCompare(pair.en).includes(this.normalizeForCompare(s.content)));
                if (!matchedSent)
                    continue;
                if (!force) {
                    const hasQuestions = await this.prisma.exerciseQuestion.count({
                        where: { sentenceId: matchedSent.id }
                    });
                    if (hasQuestions > 0)
                        continue;
                }
                const aiRes = await this.aiService.generateAdvancedQuestions({
                    chinese_sentence: pair.zh,
                    chinese_words: [],
                    english_sentence: pair.en,
                    english_words: []
                });
                if (aiRes.sentence_completion) {
                    const sc = aiRes.sentence_completion;
                    await this.prisma.exerciseQuestion.create({
                        data: {
                            type: 'SENTENCE_COMPLETION',
                            promptZh: pair.zh,
                            answerEn: pair.en,
                            blankedEn: sc.template,
                            structuredData: sc,
                            documentId,
                            sentenceId: matchedSent.id,
                        },
                    });
                    if (aiRes.sentence_scramble) {
                        const ss = aiRes.sentence_scramble;
                        const shuffledTokens = this.shuffleArray((ss.tokens || []));
                        await this.prisma.exerciseQuestion.create({
                            data: {
                                type: 'SCRAMBLE',
                                promptZh: ss.promptZh || pair.zh,
                                answerEn: ss.answerEn || pair.en,
                                scrambledTokens: shuffledTokens,
                                documentId,
                                sentenceId: matchedSent.id,
                            },
                        });
                    }
                    questionsCreated += 2;
                }
            }
            catch (e) {
                this.logger.error(`Failed to generate sentence question: ${e.message}`);
            }
        }
        for (const pair of wordPairs) {
            try {
                if (!force) {
                    const hasWordQuestion = await this.prisma.exerciseQuestion.count({
                        where: {
                            documentId,
                            type: 'WORD_MATCHING',
                            answerEn: pair.en
                        }
                    });
                    if (hasWordQuestion > 0)
                        continue;
                }
                const aiRes = await this.aiService.generateAdvancedQuestions({
                    chinese_sentence: '',
                    chinese_words: [pair.zh],
                    english_sentence: '',
                    english_words: [pair.en]
                });
                if (Array.isArray(aiRes.word_matching)) {
                    for (const wm of aiRes.word_matching) {
                        const firstSentId = doc.paragraphs[0]?.sentences[0]?.id;
                        if (firstSentId) {
                            await this.prisma.exerciseQuestion.create({
                                data: {
                                    type: 'WORD_MATCHING',
                                    promptZh: wm.chinese_meaning,
                                    answerEn: wm.correct_word,
                                    options: wm.options,
                                    structuredData: wm,
                                    documentId,
                                    sentenceId: firstSentId,
                                },
                            });
                            questionsCreated++;
                        }
                    }
                }
            }
            catch (e) {
                this.logger.error(`Failed to generate word question: ${e.message}`);
            }
        }
        return { total: questionsCreated, generated: questionsCreated };
    }
    async getQuestions(documentId, limit = 20) {
        const questions = await this.prisma.exerciseQuestion.findMany({
            where: { documentId },
        });
        return this.shuffleArray(questions).slice(0, limit);
    }
    async generateWordQuiz(documentId, force = false) {
        const doc = await this.prisma.document.findUnique({
            where: { id: documentId },
            include: { extractedWords: true },
        });
        if (!doc)
            throw new Error('Document not found');
        let words = doc.extractedWords;
        if (words.length === 0) {
            await this.extractWordsFromDocument(documentId);
            const updated = await this.prisma.document.findUnique({
                where: { id: documentId },
                include: { extractedWords: true },
            });
            words = updated?.extractedWords ?? [];
        }
        if (words.length === 0) {
            throw new Error('未提取到可用于出题的单词，请先确保核心句子存在且可提取。');
        }
        if (force) {
            await this.prisma.wordQuizQuestion.deleteMany({ where: { documentId } });
        }
        else {
            const existing = await this.prisma.wordQuizQuestion.count({ where: { documentId } });
            if (existing > 0) {
                return { total: existing, generated: 0 };
            }
        }
        const usable = words.filter((w) => (w.translation ?? '').trim().length > 0);
        if (usable.length === 0) {
            throw new Error('提取到的单词缺少中文翻译，无法生成测试题。请先重新“提取词性”。');
        }
        const batchSize = 15;
        let generated = 0;
        for (let i = 0; i < usable.length; i += batchSize) {
            const batch = usable.slice(i, i + batchSize);
            try {
                const aiQuestions = await this.aiService.generateWordQuizQuestions(batch.map((w) => ({
                    word: w.word,
                    translation: w.translation ?? '',
                    partOfSpeech: w.partOfSpeech,
                    sentence: w.sentence,
                })));
                if (Array.isArray(aiQuestions) && aiQuestions.length > 0) {
                    await this.prisma.wordQuizQuestion.createMany({
                        data: aiQuestions
                            .filter((q) => q && q.type && q.prompt && q.answer && Array.isArray(q.options))
                            .map((q) => ({
                            type: q.type,
                            prompt: String(q.prompt),
                            answer: String(q.answer),
                            options: q.options.map((x) => String(x)),
                            sentenceContext: q.sentenceContext ? String(q.sentenceContext) : null,
                            documentId,
                        })),
                    });
                    generated += aiQuestions.length;
                }
            }
            catch (e) {
                this.logger.error(`Failed to generate word quiz batch: ${e.message}`);
            }
        }
        return { total: generated, generated };
    }
    async getWordQuiz(documentId, limit = 9999) {
        const questions = await this.prisma.wordQuizQuestion.findMany({
            where: { documentId },
            orderBy: { createdAt: 'desc' },
        });
        const shuffled = questions.map((q) => {
            const opts = Array.isArray(q.options) ? q.options.map((x) => String(x)) : [];
            const ans = String(q.answer ?? '').trim();
            let normalizedOpts = opts;
            if (ans && !normalizedOpts.some((o) => String(o).trim() === ans)) {
                normalizedOpts = [ans, ...normalizedOpts].slice(0, 4);
            }
            const shuffledOpts = this.shuffleArray(normalizedOpts);
            return { ...q, options: shuffledOpts };
        });
        return this.shuffleArray(shuffled).slice(0, limit);
    }
    async extractWordsFromDocument(documentId) {
        try {
            const doc = await this.prisma.document.findUnique({
                where: { id: documentId },
            });
            if (!doc) {
                throw new Error('Document not found');
            }
            const zhLines = (doc.chineseText || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
            const enLines = (doc.englishText || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
            const sentences = zhLines
                .map((zh, i) => ({ zh, en: enLines[i] }))
                .filter(item => item.en && (item.en.includes(' ') && item.en.length > 15))
                .map(item => item.en);
            if (sentences.length === 0) {
                this.logger.warn(`No core sentences found in document ${documentId} (chineseText/englishText)`);
                return { extracted: 0, message: 'No core sentences found in document' };
            }
            this.logger.log(`Extracting words from ${sentences.length} core sentences in document ${documentId}`);
            const batchSize = 50;
            const batches = [];
            for (let i = 0; i < sentences.length; i += batchSize) {
                batches.push(sentences.slice(i, i + batchSize));
            }
            this.logger.log(`Processing ${batches.length} batches of sentences`);
            const allExtractedWords = [];
            for (let i = 0; i < batches.length; i++) {
                try {
                    this.logger.log(`Processing batch ${i + 1}/${batches.length} (${batches[i].length} sentences)`);
                    const batchWords = await this.aiService.extractWordsFromSentences(batches[i]);
                    allExtractedWords.push(...batchWords);
                }
                catch (error) {
                    this.logger.error(`Failed to process batch ${i + 1}: ${error.message}`);
                }
            }
            const extractedWords = allExtractedWords;
            this.logger.log(`AI extracted ${extractedWords.length} words, saving to database...`);
            await this.prisma.extractedWord.deleteMany({
                where: { documentId },
            });
            if (extractedWords.length > 0) {
                await this.prisma.extractedWord.createMany({
                    data: extractedWords.map(w => ({
                        word: w.word,
                        partOfSpeech: w.partOfSpeech,
                        translation: w.translation || null,
                        sentence: w.sentence,
                        documentId,
                    })),
                });
                this.logger.log(`Successfully saved ${extractedWords.length} words to database`);
            }
            return {
                extracted: extractedWords.length,
                message: `Successfully extracted ${extractedWords.length} words`,
            };
        }
        catch (error) {
            this.logger.error(`Failed to extract words from document ${documentId}: ${error.message}`);
            this.logger.error(error.stack);
            throw error;
        }
    }
    async getExtractedWords(documentId, partOfSpeech) {
        const where = { documentId };
        if (partOfSpeech) {
            where.partOfSpeech = partOfSpeech;
        }
        const words = await this.prisma.extractedWord.findMany({
            where,
            orderBy: { word: 'asc' },
        });
        return words;
    }
};
exports.DocumentService = DocumentService;
exports.DocumentService = DocumentService = DocumentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ocr_service_1.OCRService,
        ai_service_1.AIService])
], DocumentService);
//# sourceMappingURL=document.service.js.map