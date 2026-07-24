import prisma from '../config/database';

export class SecretariaService {
  async getAllGroups() {
    return await prisma.groupSmall.findMany({
      select: { 
        id: true, 
        name: true,
        motto: true,
        bibleVerse: true,
        anthemUrl: true,
        totalPoints: true
      },
      orderBy: { totalPoints: 'desc' }
    });
  }

  async getGroupPanel(groupId: number) {
    const group = await prisma.groupSmall.findUnique({
      where: { id: groupId },
      include: {
        members: {
          select: { id: true, name: true, birthDate: true, groupRole: true, isActive: true },
          orderBy: { name: 'asc' }
        },
        administrator: { select: { id: true, name: true } }
      }
    });

    if (!group) throw new Error('Grupo Pequeño no localizado.');

    const createdDate = new Date(group.createdAt);
    const now = new Date();
    let years = now.getFullYear() - createdDate.getFullYear();
    let months = now.getMonth() - createdDate.getMonth();
    if (months < 0) { years--; months += 12; }

    const formattedMembers = group.members.map((m) => {
      let formattedDate = 'No registrada';
      if (m.birthDate) {
        const d = new Date(m.birthDate);
        formattedDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      }
      return {
        id: m.id,
        name: m.name,
        birthDate: formattedDate,
        hasLifeInsurance: m.isActive,
        roleInGP: m.groupRole
      };
    });

    return {
      members: formattedMembers,
      identity: {
        id: group.id,
        name: group.name.toUpperCase(),
        description: group.description || '',
        motto: group.motto || 'Sin lema asignado.',
        verse: group.bibleVerse || 'Sin versículo oficial.',
        anthemUrl: group.anthemUrl || 'Sin himno configurado',
        administratorId: group.administratorId,
        administratorName: group.administrator?.name || 'No asignado',
        createdAtDate: createdDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
        timeElapsed: `${years} año(s), ${months} mes(es)`
      }
    };
  }

  async createGroup(data: { name: string; description?: string; motto?: string; bibleVerse?: string; anthemUrl?: string; administratorId: number }) {
    return await prisma.groupSmall.create({
      data: {
        name: data.name.toLowerCase(),
        description: data.description,
        motto: data.motto,
        bibleVerse: data.bibleVerse,
        anthemUrl: data.anthemUrl,
        administratorId: data.administratorId
      }
    });
  }

  async updateGroup(groupId: number, data: { name: string; description?: string; motto?: string; bibleVerse?: string; anthemUrl?: string; administratorId?: number }) {
    return await prisma.groupSmall.update({
      where: { id: groupId },
      data: {
        name: data.name.toLowerCase(),
        description: data.description,
        motto: data.motto,
        bibleVerse: data.bibleVerse,
        anthemUrl: data.anthemUrl,
        ...(data.administratorId && { administratorId: data.administratorId })
      }
    });
  }

  async unlinkMemberFromGroup(groupId: number, userId: number) {
    return await prisma.groupSmall.update({
      where: { id: groupId },
      data: { members: { disconnect: { id: userId } } }
    });
  }

  async getAvailableUsers() {
    return await prisma.user.findMany({
      where: { 
        isActive: true,
        groupSmallId: null
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' }
    });
  }

  async linkMemberToGroup(groupId: number, userId: number, groupRole: string) {
    const norm = (groupRole || '').toUpperCase().trim();
    if (norm === 'LÍDER' || norm === 'LIDER') {
      const existingLeader = await prisma.user.findFirst({
        where: {
          groupSmallId: groupId,
          id: { not: userId },
          groupRole: { in: ['Líder', 'LIDER', 'lider', 'Lider'] }
        },
        select: { id: true, name: true }
      });

      if (existingLeader) {
        throw new Error(`El grupo ya cuenta con un Líder asignado (${existingLeader.name}). Solo se permite 1 Líder por Grupo Pequeño.`);
      }
    }

    return await prisma.$transaction([
      prisma.groupSmall.update({
        where: { id: groupId },
        data: {
          members: {
            connect: { id: userId }
          }
        }
      }),
      prisma.user.update({
        where: { id: userId },
        data: { groupRole: groupRole }
      })
    ]);
  }
}