import prisma from '../config/database';

export class ProgramService {
  async getProgramEvents() {
    return await (prisma as any).programEvent.findMany({ orderBy: { order: 'asc' } });
  }

  async createEvent(data: any) {
    return await (prisma as any).programEvent.create({ data: { ...data, isActive: true } });
  }

  async updateEvent(id: number, data: any) {
    return await (prisma as any).programEvent.update({ where: { id }, data });
  }

  async deleteEvent(id: number) {
    return await (prisma as any).programEvent.delete({ where: { id } });
  }
}