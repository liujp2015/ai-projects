"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserWordModule = void 0;
const common_1 = require("@nestjs/common");
const user_word_service_1 = require("./user-word.service");
const user_word_controller_1 = require("./user-word.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const dictionary_module_1 = require("../dictionary/dictionary.module");
const srs_service_1 = require("./srs.service");
let UserWordModule = class UserWordModule {
};
exports.UserWordModule = UserWordModule;
exports.UserWordModule = UserWordModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, dictionary_module_1.DictionaryModule],
        controllers: [user_word_controller_1.UserWordController],
        providers: [user_word_service_1.UserWordService, srs_service_1.SRSService],
    })
], UserWordModule);
//# sourceMappingURL=user-word.module.js.map