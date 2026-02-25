import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
  console.log('🔍 Verificando administradores en la base de datos...');

  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (admins.length === 0) {
      console.log('❌ No hay administradores en la base de datos');
      console.log('💡 Ejecuta el seed: npm run prisma:setup o npx tsx src/scripts/seed.ts');
    } else {
      console.log(`✅ Se encontraron ${admins.length} administrador(es):`);
      admins.forEach((admin, index) => {
        console.log(`\n${index + 1}. Admin:`);
        console.log(`   ID: ${admin.id}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Nombre: ${admin.name}`);
        console.log(`   Rol: ${admin.role}`);
        console.log(`   Creado: ${admin.createdAt}`);
      });
    }
  } catch (error) {
    console.error('❌ Error verificando administradores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();





