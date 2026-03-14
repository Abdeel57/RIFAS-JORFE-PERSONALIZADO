import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── 1. Admin por defecto (plantilla Bismark) ─────────────────────────────
  const adminUsuario = 'Bismark';
  const adminPassword = 'admin123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  let admin = await prisma.admin.findUnique({ where: { email: adminUsuario } });
  if (admin) {
    // Asegurarse que Bismark siempre sea super_admin
    if (admin.role !== 'super_admin') {
      await prisma.admin.update({
        where: { email: adminUsuario },
        data: { role: 'super_admin' },
      });
      console.log('✅ Bismark actualizado a super_admin');
    } else {
      console.log('ℹ️  Admin ya existe con rol super_admin');
    }
  } else {
    // Actualizar admins antiguos (admin@bismark.com, admin@rifasnao.com) a las nuevas credenciales
    const oldEmails = ['admin@bismark.com', 'admin@rifasnao.com'];
    for (const oldEmail of oldEmails) {
      const oldAdmin = await prisma.admin.findUnique({ where: { email: oldEmail } });
      if (oldAdmin) {
        await prisma.admin.update({
          where: { email: oldEmail },
          data: { email: adminUsuario, passwordHash, name: 'Administrador', role: 'super_admin' },
        });
        console.log(`✅ Admin actualizado: ${oldEmail} → ${adminUsuario} (super_admin)`);
        break;
      }
    }
    if (!admin && !(await prisma.admin.findUnique({ where: { email: adminUsuario } }))) {
      await prisma.admin.create({
        data: { email: adminUsuario, passwordHash, name: 'Administrador', role: 'super_admin' },
      });
      console.log('✅ Admin creado como super_admin:');
    }
    console.log(`   Usuario: ${adminUsuario}`);
    console.log(`   Password: ${adminPassword}`);
  }

  // ── 2. Rifa iPhone de prueba (999 boletos @ $1) ──────────────────────────
  const drawDate = new Date('2026-12-15T20:00:00.000Z'); // Sorteo: 15 dic 2026
  const iphoneTitle = 'iPhone 16 Pro Max 256GB';
  const iphoneDescription = '¡Participa y estrena el nuevo iPhone 16 Pro Max! Este increíble premio incluye el smartphone más potente de Apple en color Titanio Natural con 256GB de almacenamiento. Experimenta la velocidad del chip A18 Pro, la versatilidad de su sistema de cámaras pro y la belleza de su pantalla Super Retina XDR de 6.9 pulgadas. El paquete incluye caja original, cable de carga USB-C, AirPods Pro de regalo y garantía oficial de Apple por 1 año. Solo 999 boletos disponibles, ¡tus oportunidades de ganar son altísimas!';

  let raffle = await prisma.raffle.findFirst({ where: { title: iphoneTitle } });

  if (!raffle) {
    raffle = await prisma.raffle.create({
      data: {
        title: iphoneTitle,
        subtitle: '¡El smartphone más potente de Apple!',
        description: iphoneDescription,
        prizeImage: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-deserttitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1726771009201',
        videoUrl: 'https://www.youtube.com/embed/FdGMTjbdEXg',
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

    console.log(`✅ Rifa creada: ${iphoneTitle}`);
  } else {
    // Si ya existe, actualizar precio y total si es necesario
    await prisma.raffle.update({
      where: { id: raffle.id },
      data: {
        ticketPrice: 1,
        totalTickets: 999,
        status: 'active',
        drawDate,
        description: iphoneDescription,
        videoUrl: 'https://www.youtube.com/embed/FdGMTjbdEXg',
      },
    });
    console.log(`ℹ️ Rifa "${iphoneTitle}" actualizada`);
  }

  // Verificar boletos (Asegurar que existan pero NO estén vendidos)
  const ticketCount = await prisma.ticket.count({ where: { raffleId: raffle.id } });

  if (ticketCount !== 999) {
    console.log(`⏳ Generando 999 boletos para ${iphoneTitle}...`);
    // Borrar boletos previos si hay discrepancia (para resetear a 0% sold)
    await prisma.ticket.deleteMany({ where: { raffleId: raffle.id } });

    // Crear boletos disponibles
    const tickets = Array.from({ length: 999 }, (_, i) => ({
      number: i + 1,
      status: 'available' as any,
      raffleId: raffle.id,
    }));

    await prisma.ticket.createMany({ data: tickets });
    console.log(`✅ Todos los boletos marcados como disponibles`);
  }

  // --- Inicializar Configuración del Sistema ---
  console.log('⚙️ Verificando configuración del sistema...');
  await prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      siteName: 'Bismark',
      bankName: 'BBVA México',
      clabe: '012 180 0152 4895 2410',
      beneficiary: 'Bismark México S.A.',
      whatsapp: '+521234567890',
      contactEmail: 'contacto@bismark.com',
      instagram: '@bismark_oficial',
    },
  });
  console.log('✅ Configuración del sistema inicializada');

  console.log('\n✨ Seed completado con éxito');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Admin: ${adminUsuario} / ${adminPassword}`);
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
