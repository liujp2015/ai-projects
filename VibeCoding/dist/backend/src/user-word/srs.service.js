"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SRSService = void 0;
const common_1 = require("@nestjs/common");
let SRSService = class SRSService {
    calculateNextReview(quality, currentInterval, reps, difficulty) {
        let nextInterval;
        let nextReps;
        let nextDifficulty;
        if (quality >= 3) {
            if (reps === 0) {
                nextInterval = 1;
            }
            else if (reps === 1) {
                nextInterval = 6;
            }
            else {
                nextInterval = Math.round(currentInterval * difficulty);
            }
            nextReps = reps + 1;
            nextDifficulty = difficulty + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        }
        else {
            nextReps = 0;
            nextInterval = 1;
            nextDifficulty = difficulty;
        }
        if (nextDifficulty < 1.3) {
            nextDifficulty = 1.3;
        }
        const nextReviewAt = new Date();
        nextReviewAt.setDate(nextReviewAt.getDate() + nextInterval);
        nextReviewAt.setHours(0, 0, 0, 0);
        return {
            interval: nextInterval,
            reps: nextReps,
            difficulty: nextDifficulty,
            nextReviewAt,
        };
    }
};
exports.SRSService = SRSService;
exports.SRSService = SRSService = __decorate([
    (0, common_1.Injectable)()
], SRSService);
//# sourceMappingURL=srs.service.js.map