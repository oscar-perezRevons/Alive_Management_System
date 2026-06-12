import prisma from '../config/database';
import { UserRole } from '@prisma/client';

export class UsersService {
  async getAllUsers() {
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        id: 'asc'
      }
    });
  }

  async getUserById(id: number) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async updateUser(
    id: number,
    data: { name?: string; role?: UserRole; isActive?: boolean }
  ) {
    const userExists = await prisma.user.findUnique({ where: { id } });
    if (!userExists) {
      throw new Error('El usuario que intenta actualizar no existe.');
    }

    return await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async deleteUser(id: number) {
    const userExists = await prisma.user.findUnique({ where: { id } });
    if (!userExists) {
      throw new Error('El usuario que intenta eliminar no existe.');
    }

    return await prisma.user.delete({
      where: { id },
    });
  }
}