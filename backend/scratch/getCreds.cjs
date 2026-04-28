const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const mfrs = await prisma.manufacturerProfile.findMany({
    take: 3,
    include: { user: true }
  });
  const buyers = await prisma.user.findMany({
    where: { role: "buyer" },
    take: 3
  });
  console.log("--- TEST CREDENTIALS ---");
  mfrs.forEach(m => {
    console.log(`MANUFACTURER: ${m.company}`);
    console.log(`  MNG ID (Store Access Code): ${m.listing_code}`);
    console.log(`  Email: ${m.user.email}`);
    console.log(`  Password: Use the default password (likely 'password123' if seeded or your set password)`);
    console.log("-----------------------");
  });
  console.log("--- BUYER ACCOUNTS ---");
  buyers.forEach(b => {
    console.log(`Buyer Email: ${b.email}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
