import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // This resets videoUrl to null so the image gallery is shown instead
    // The admin can set a working YouTube embed URL from the admin panel
    const updated = await prisma.raffle.update({
        where: { id: 'cmm3vg13g00009ukk50e74yh4' },
        data: { videoUrl: null },
    });
    console.log('✅ videoUrl reseteado:', updated.videoUrl);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
