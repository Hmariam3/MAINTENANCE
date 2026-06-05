require('dotenv').config();
const prisma = require('./db');

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE branches ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;`);
    console.log('Successfully added is_active to branches');
    
    // Also test lookupController query to see if it works
    const branches = await prisma.branches.findMany({ where: { is_active: true } });
    console.log('Branches fetch success:', branches.length);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
