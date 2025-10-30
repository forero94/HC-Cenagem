const { PrismaClient } = require('./cenagem-backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const now = new Date(Date.now() + 3600000);
    const res = await prisma.appointment.create({
      data: {
        scheduledFor: now,
        motive: 'Test',
        notes: 'Note',
      },
    });
    console.log(res);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
})();
