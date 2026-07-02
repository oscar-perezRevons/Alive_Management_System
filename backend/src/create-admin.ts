import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  const adminName = "Oscar Samuel Perez Callizaya";
  const adminEmail = "oscar.admin@alive.com"; 
  const rawPassword = "AliveAdmin2026!!";

  console.log('⏳ Encriptando contraseña con Bcrypt...');
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  console.log('⏳ Insertando registro en PostgreSQL...');
  
  const nuevoAdmin = await (prisma as any).user.create({
    data: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      groupRole: 'ADMINISTRADOR',
      isActive: true,
      birthDate: new Date('2003-05-15') 
    }
  });

  console.log('\n ==========================================');
  console.log('¡USUARIO ADMINISTRADOR CREADO CON ÉXITO!');
  console.log(`Nombre: ${nuevoAdmin.name}`);
  console.log(`Email: ${nuevoAdmin.email}`);
  console.log(`Contraseña en bruto: ${rawPassword}`);
  console.log('============================================\n');
}

createAdmin()
  .catch((error) => {
    console.error('Error fatal al intentar inyectar el administrador:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });