import { Controller, Get, Param } from '@nestjs/common';
import { ExerciseService } from './exercise.service';

@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Get('document/:id')
  async getExercises(@Param('id') documentId: string) {
    return this.exerciseService.generateExercises(documentId);
  }
}

