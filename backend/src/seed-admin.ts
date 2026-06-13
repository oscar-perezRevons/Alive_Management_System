import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs'; 

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando proceso de restauración del Administrador Global...');

  const adminEmail = 'admin@alive.com';
  const adminPassword = 'AdminPassword123*';
  const adminName = 'Administrador Sistema';

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    console.log(`El usuario con el correo ${adminEmail} ya existe en la base de datos.`);
    return;
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: 'ADMIN', 
      groupRole: 'SUPERVISOR',
      isActive: true,
    },
  });

  console.log('\n==================================================');
  console.log('¡ADMINISTRADOR CREADO CON ÉXITO EN LA DB!');
  console.log(`Email: ${admin.email}`);
  console.log(`Contraseña: ${adminPassword}`);
  console.log('==================================================\n');
}

main()
  .catch((e) => {
    console.error('Error al inyectar el administrador:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });