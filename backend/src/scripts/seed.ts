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

  // ── 2. Rifa iPhone de prueba (999 boletos @ $1) ──────────────────────────
  const drawDate = new Date('2026-12-15T20:00:00.000Z'); // Sorteo: 15 dic 2026

  let raffle = await prisma.raffle.findFirst({ where: { title: 'iPhone 16 Pro Max 256GB' } });

  if (!raffle) {
    raffle = await prisma.raffle.create({
      data: {
        title: 'iPhone 16 Pro Max 256GB',
        subtitle: '¡El smartphone más potente de Apple!',
        description: 'iPhone 16 Pro Max en color Titanio Natural, 256GB de almacenamiento. Incluye cargador, cable USB-C, AirPods y garantía Apple de 1 año. Solo 999 boletos disponibles — ¡tus probabilidades son increíbles!',
        prizeImage: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-deserttitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1726771009201',
        // videoUrl: configura desde el admin panel — pega la URL de embed de YouTube
        // Ejemplo: https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1
        galleryImages: [
          'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-deserttitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1726771009201',
          'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-model-unselect-gallery-1-202409?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1726771018484',
          'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-model-unselect-gallery-2-202409?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1726771018484',
        ],
        ticketPrice: 1,
        totalTickets: 999,
        drawDate,
        status: 'active',
        features: [
          { title: 'Chip A18 Pro', desc: 'El chip más rápido en un smartphone', icon: '⚡' },
          { title: 'Cámara Pro 48MP', desc: 'Zoom Tetraprism 5x + modo Apple Intelligence', icon: '📷' },
          { title: 'Pantalla 6.9"', desc: 'Super Retina XDR, 120Hz ProMotion', icon: '🖥️' },
          { title: 'Titanio Premium', desc: 'Diseño en titanio grado aeroespacial + USB-C', icon: '🔩' },
        ],
      },
    });

    // Crear los 999 boletos
    const tickets = Array.from({ length: 999 }, (_, i) => ({
      raffleId: raffle!.id,
      number: i + 1,
      status: 'available' as const,
    }));
    await prisma.ticket.createMany({ data: tickets });

    console.log('✅ Rifa creada: iPhone 16 Pro Max — 999 boletos @ $1');
    console.log(`   ID: ${raffle.id}`);
  } else {
    // Si ya existe, actualizar precio y total si es necesario
    await prisma.raffle.update({
      where: { id: raffle.id },
      data: {
        ticketPrice: 1,
        totalTickets: 999,
        status: 'active',
        drawDate,
        // videoUrl: configura desde el admin panel
      },
    });
    // Verificar que tenga los 999 boletos
    const ticketCount = await prisma.ticket.count({ where: { raffleId: raffle.id } });
    if (ticketCount < 999) {
      const existing = await prisma.ticket.findMany({ where: { raffleId: raffle.id }, select: { number: true } });
      const existingNumbers = new Set(existing.map((t) => t.number));
      const missingTickets = Array.from({ length: 999 }, (_, i) => i + 1)
        .filter((n) => !existingNumbers.has(n))
        .map((n) => ({ raffleId: raffle!.id, number: n, status: 'available' as const }));
      if (missingTickets.length > 0) {
        await prisma.ticket.createMany({ data: missingTickets });
      }
      console.log(`✅ Boletos completados: ${ticketCount} → 999`);
    }
    console.log(`ℹ️  Rifa existente actualizada: 999 boletos @ $1 (ID: ${raffle.id})`);
  }

  console.log('\n✅ Seeding completado');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log('Rifa: iPhone 16 Pro Max — 999 boletos @ $1 MXN');
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
