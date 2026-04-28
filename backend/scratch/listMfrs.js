import prisma from '../config/prisma.js';
async function main() {
  const mfrs = await prisma.manufacturerProfile.findMany({
    include: { user: true }
  });
  console.log('--- MANUFACTURER CREDENTIALS ---');
  mfrs.forEach(m => {
    console.log(`Company: ${m.company} | MNG ID: ${m.listing_code} | Email: ${m.user.email}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
