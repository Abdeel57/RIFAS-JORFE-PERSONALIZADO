import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  console.log('🧪 Probando login con credenciales...');

  const email = 'admin@bismark.com';
  const password = 'admin123456';

  try {
    // Buscar admin
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      console.log('❌ Admin no encontrado');
      return;
    }

    console.log('✅ Admin encontrado:', {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      passwordHashLength: admin.passwordHash.length,
    });

    // Comparar contraseña
    console.log('🔑 Comparando contraseña...');
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
    
    console.log('📊 Resultado de comparación:', {
      isValidPassword,
      passwordProvided: password,
      passwordHashStartsWith: admin.passwordHash.substring(0, 20) + '...',
    });

    if (isValidPassword) {
      console.log('✅ Contraseña válida - Login debería funcionar');
    } else {
      console.log('❌ Contraseña inválida - Este es el problema');
      
      // Intentar crear un nuevo hash para comparar
      console.log('🔄 Generando nuevo hash para comparar...');
      const newHash = await bcrypt.hash(password, 10);
      console.log('📝 Nuevo hash generado:', newHash.substring(0, 30) + '...');
      console.log('📝 Hash en BD:', admin.passwordHash.substring(0, 30) + '...');
      console.log('⚠️  Los hashes son diferentes (esto es normal), pero la comparación debería funcionar');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();





