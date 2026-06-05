require('dotenv').config();
const prisma = require('./db');

async function main() {
  const users = await prisma.users.findMany();
  console.log("Users in DB:");
  console.log(users);
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
