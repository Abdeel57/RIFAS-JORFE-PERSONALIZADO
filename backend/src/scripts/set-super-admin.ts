import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.admin.findUnique({ where: { email: 'Bismark' } });

  if (!admin) {
    console.error('❌ No se encontró el usuario Bismark');
    process.exit(1);
  }

  await prisma.admin.update({
    where: { email: 'Bismark' },
    data: { role: 'super_admin' },
  });

  console.log('✅ Bismark actualizado a super_admin correctamente');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
