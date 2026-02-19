const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Delete leaf tables first to avoid FK issues in environments without cascade constraints.
  await prisma.exerciseQuestion.deleteMany();
  await prisma.userWord.deleteMany();
  await prisma.sentence.deleteMany();
  await prisma.paragraph.deleteMany();

  if (prisma.alignedSentencePair?.deleteMany) {
    await prisma.alignedSentencePair.deleteMany();
  } else {
    try {
      await prisma.$executeRawUnsafe('DELETE FROM "AlignedSentencePair"');
    } catch {
      // ignore if table doesn't exist
    }
  }

  await prisma.document.deleteMany();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('OK: cleared all data');
  })
  .catch(async (e) => {
    console.error('FAILED:', e?.message || e);
    await prisma.$disconnect();
    process.exitCode = 1;
  });




