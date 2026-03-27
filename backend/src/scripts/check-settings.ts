import 'dotenv/config';
import prisma from '../config/database';

async function main() {
    const settings = await prisma.systemSettings.findUnique({
        where: { id: 'default' },
    });
    console.log('Current settings:', JSON.stringify(settings, null, 2));
}

main().catch(console.error);
