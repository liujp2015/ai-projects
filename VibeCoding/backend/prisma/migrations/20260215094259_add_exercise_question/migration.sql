-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SCRAMBLE', 'CHOICE');

-- CreateTable
CREATE TABLE "ExerciseQuestion" (
    "id" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "promptZh" TEXT NOT NULL,
    "answerEn" TEXT NOT NULL,
    "scrambledTokens" TEXT[],
    "blankedEn" TEXT,
    "options" TEXT[],
    "documentId" TEXT NOT NULL,
    "sentenceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExerciseQuestion_documentId_idx" ON "ExerciseQuestion"("documentId");

-- CreateIndex
CREATE INDEX "ExerciseQuestion_sentenceId_idx" ON "ExerciseQuestion"("sentenceId");

-- AddForeignKey
ALTER TABLE "ExerciseQuestion" ADD CONSTRAINT "ExerciseQuestion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseQuestion" ADD CONSTRAINT "ExerciseQuestion_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
