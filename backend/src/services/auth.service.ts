import prisma from '../config/database';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { TokenPayload } from '../types';

export class AuthService {
  async register(email: string, password: string, name: string) {
    const userExists = await prisma.user.findUnique({ where: { email } });

    if (userExists) {
      throw new Error('El correo electrónico ya se encuentra registrado.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'USER', 
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new Error('Usuario o contraseña incorrectos.');
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw new Error('Usuario o contraseña incorrectos.');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  private generateToken(userId: number, email: string, role: 'ADMIN' | 'USER'): string {
    const payload: TokenPayload = { userId, email, role };
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('Configuración corrupta: JWT_SECRET no está configurado en las variables de entorno.');
    }

    console.log('🔑 Generando token seguro con SECRET:', secret.substring(0, 15) + '...');

    const options: SignOptions = {
      expiresIn: '24h', 
    };

    return jwt.sign(payload, secret, options);
  }
}