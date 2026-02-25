import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── 1. Admin por defecto ──────────────────────────────────────────────────
  const adminEmail = 'admin@rifasnao.com';
  const adminPassword = 'admin123456';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.admin.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.admin.create({
      data: { email: adminEmail, passwordHash, name: 'Administrador', role: 'admin' },
    });
    console.log('✅ Admin creado:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
  } else {
    console.log('ℹ️  Admin ya existe');
  }

  // ── 2. Rifa de muestra ───────────────────────────────────────────────────
  const existingRaffle = await prisma.raffle.findFirst({ where: { title: 'iPhone 16 Pro Max 256GB' } });
  if (!existingRaffle) {
    const drawDate = new Date();
    drawDate.setDate(drawDate.getDate() + 30); // sorteo en 30 días

    const raffle = await prisma.raffle.create({
      data: {
        title: 'iPhone 16 Pro Max 256GB',
        subtitle: '¡El smartphone más potente de Apple!',
        description: 'iPhone 16 Pro Max en color Titanio Natural, 256GB de almacenamiento. Incluye cargador, cable USB-C y garantía Apple de 1 año.',
        prizeImage: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-deserttitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1726771009201',
        galleryImages: [
          'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-deserttitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1726771009201',
        ],
        ticketPrice: 50,
        totalTickets: 1000,
        drawDate,
        status: 'active',
        features: [
          { title: 'Chip A18 Pro', desc: 'El chip más rápido en un smartphone', icon: '⚡' },
          { title: 'Cámara Pro', desc: '48MP + Tetraprism 5x zoom óptico', icon: '📷' },
          { title: 'Pantalla 6.9"', desc: 'Super Retina XDR, 120Hz ProMotion', icon: '🖥️' },
          { title: 'Titanio', desc: 'Diseño premium en titanio grado aeroespacial', icon: '🔩' },
        ],
      },
    });

    // Crear los 1000 boletos
    const tickets = Array.from({ length: 1000 }, (_, i) => ({
      raffleId: raffle.id,
      number: i + 1,
      status: 'available' as const,
    }));

    await prisma.ticket.createMany({ data: tickets });

    console.log('✅ Rifa de muestra creada: iPhone 16 Pro Max (1000 boletos @ $50)');
    console.log(`   ID: ${raffle.id}`);
    console.log(`   Sorteo: ${drawDate.toLocaleDateString('es-MX')}`);
  } else {
    console.log('ℹ️  Rifa de muestra ya existe');
  }

  console.log('\n✅ Seeding completado');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
