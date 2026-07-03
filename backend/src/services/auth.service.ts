import prisma from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class AuthService {
  async loginUser(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new Error('El usuario no existe o se encuentra inactivo.');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Contraseña incorrecta.');

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'ALIVE_SECRET_KEY_2026',
      { expiresIn: '24h' }
    );

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, groupRole: user.groupRole }
    };
  }

  async registerUser(data: any) {
    const existe = await prisma.user.findUnique({ where: { email: data.email } });
    if (existe) throw new Error('El correo electrónico ya se encuentra registrado.');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        role: 'USER',
        groupRole: 'MIEMBRO'
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
  }
}

export const authService = new AuthService();