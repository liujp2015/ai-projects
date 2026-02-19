"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const document_module_1 = require("./document/document.module");
const dictionary_module_1 = require("./dictionary/dictionary.module");
const user_word_module_1 = require("./user-word/user-word.module");
const tts_module_1 = require("./tts/tts.module");
const exercise_module_1 = require("./exercise/exercise.module");
const sentence_builder_module_1 = require("./sentence-builder/sentence-builder.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            document_module_1.DocumentModule,
            dictionary_module_1.DictionaryModule,
            user_word_module_1.UserWordModule,
            tts_module_1.TTSModule,
            exercise_module_1.ExerciseModule,
            sentence_builder_module_1.SentenceBuilderModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map