import { Injectable } from '@nestjs/common';

@Injectable()
export class SRSService {
  /**
   * SM-2 算法实现
   * @param quality 评分 (0-5): 0=完全忘记, 5=完全记得
   * @param currentInterval 当前间隔 (天)
   * @param reps 连续正确次数
   * @param difficulty 难度系数 (E-Factor)
   */
  calculateNextReview(quality: number, currentInterval: number, reps: number, difficulty: number) {
    let nextInterval: number;
    let nextReps: number;
    let nextDifficulty: number;

    if (quality >= 3) {
      // 成功记得
      if (reps === 0) {
        nextInterval = 1;
      } else if (reps === 1) {
        nextInterval = 6;
      } else {
        nextInterval = Math.round(currentInterval * difficulty);
      }
      nextReps = reps + 1;
      // 更新难度系数 (E-Factor)
      nextDifficulty = difficulty + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    } else {
      // 忘记了
      nextReps = 0;
      nextInterval = 1;
      nextDifficulty = difficulty;
    }

    // 难度系数最小不低于 1.3
    if (nextDifficulty < 1.3) {
      nextDifficulty = 1.3;
    }

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + nextInterval);
    // 强制设为当天的凌晨，方便按天筛选
    nextReviewAt.setHours(0, 0, 0, 0);

    return {
      interval: nextInterval,
      reps: nextReps,
      difficulty: nextDifficulty,
      nextReviewAt,
    };
  }
}

