import express from 'express';
import cors from 'cors';
import path from 'path'; 
import dotenv from 'dotenv';

dotenv.config(); 

import prisma from './config/database';

import fs from 'fs';

async function runStartupMigrations() {
  try {
    console.log('Ejecutando migraciones de inicio...');
    await (prisma as any).$executeRawUnsafe('ALTER TABLE "EventParticipation" ADD COLUMN IF NOT EXISTS "confirmedMembers" TEXT DEFAULT \'\';');
    await (prisma as any).$executeRawUnsafe('ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT DEFAULT \'\';');
    await (prisma as any).$executeRawUnsafe('ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT DEFAULT \'\';');
    await (prisma as any).$executeRawUnsafe('ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "type2" TEXT DEFAULT \'\';');
    await (prisma as any).$executeRawUnsafe('ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "size2" TEXT DEFAULT \'\';');
    await (prisma as any).$executeRawUnsafe('ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "fileUrl2" TEXT DEFAULT \'\';');
    
    // Crear tabla de Materiales si no existe
    await (prisma as any).$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Material" (
        "id" SERIAL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "type" TEXT NOT NULL,
        "size" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "fileUrl" TEXT NOT NULL,
        "type2" TEXT DEFAULT '',
        "size2" TEXT DEFAULT '',
        "fileUrl2" TEXT DEFAULT '',
        "isVisible" BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Crear tabla de Categorías de Materiales si no existe
    await (prisma as any).$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MaterialCategory" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT UNIQUE NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Sembrar categorías iniciales
    await (prisma as any).$executeRawUnsafe(`
      INSERT INTO "MaterialCategory" ("name") VALUES ('Reglamentos') ON CONFLICT ("name") DO NOTHING;
    `);
    await (prisma as any).$executeRawUnsafe(`
      INSERT INTO "MaterialCategory" ("name") VALUES ('Convocatorias') ON CONFLICT ("name") DO NOTHING;
    `);
    await (prisma as any).$executeRawUnsafe(`
      INSERT INTO "MaterialCategory" ("name") VALUES ('Diseño') ON CONFLICT ("name") DO NOTHING;
    `);

    // Tabla ExtraScoreboard
    await (prisma as any).$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ExtraScoreboard" (
        "id" SERIAL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "eventType" TEXT NOT NULL DEFAULT 'Campamento',
        "status" TEXT NOT NULL DEFAULT 'ACTIVO',
        "imageUrl" TEXT DEFAULT '',
        "pdfUrl" TEXT DEFAULT '',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await (prisma as any).$executeRawUnsafe('ALTER TABLE "ExtraScoreboard" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT DEFAULT \'\';');
    await (prisma as any).$executeRawUnsafe('ALTER TABLE "ExtraScoreboard" ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT DEFAULT \'\';');

    // Tabla ScoreChallenge
    await (prisma as any).$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ScoreChallenge" (
        "id" SERIAL PRIMARY KEY,
        "scoreboardId" INTEGER NOT NULL REFERENCES "ExtraScoreboard"("id") ON DELETE CASCADE,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "category" TEXT NOT NULL DEFAULT 'Desafío General',
        "maxPoints" INTEGER NOT NULL DEFAULT 100,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla ExtraGroupScore
    await (prisma as any).$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ExtraGroupScore" (
        "id" SERIAL PRIMARY KEY,
        "scoreboardId" INTEGER NOT NULL REFERENCES "ExtraScoreboard"("id") ON DELETE CASCADE,
        "groupId" INTEGER NOT NULL REFERENCES "GroupSmall"("id") ON DELETE CASCADE,
        "challengeId" INTEGER REFERENCES "ScoreChallenge"("id") ON DELETE SET NULL,
        "points" INTEGER NOT NULL,
        "reason" TEXT NOT NULL,
        "awardedByName" TEXT DEFAULT 'Administración',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla ExtraParticipantScore
    await (prisma as any).$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ExtraParticipantScore" (
        "id" SERIAL PRIMARY KEY,
        "scoreboardId" INTEGER NOT NULL REFERENCES "ExtraScoreboard"("id") ON DELETE CASCADE,
        "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "groupId" INTEGER REFERENCES "GroupSmall"("id") ON DELETE SET NULL,
        "challengeId" INTEGER REFERENCES "ScoreChallenge"("id") ON DELETE SET NULL,
        "points" INTEGER NOT NULL,
        "reason" TEXT NOT NULL,
        "awardedByName" TEXT DEFAULT 'Administración',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Migración de inicio completada.');
    
    // Diagnóstico
    try {
      const testEvents = await (prisma as any).event.findMany();
      fs.writeFileSync('test-output.txt', 'Success: ' + JSON.stringify(testEvents));
    } catch (e: any) {
      fs.writeFileSync('test-output.txt', 'Error querying events: ' + e.stack);
    }
  } catch (error: any) {
    console.error('Error al ejecutar migración de inicio:', error);
    fs.writeFileSync('test-output.txt', 'Error running startup migration: ' + error.stack);
  }
}
runStartupMigrations();


import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import groupsRoutes from './routes/groups.routes';
import activitiesRoutes from './routes/activities.routes';
import dashboardRoutes from './routes/dashboard.routes';
import configRoutes from './routes/config.routes';
import secretariaRoutes from './routes/secretaria.routes'; 
import puntuacionesRoutes from './routes/puntuaciones.routes';
import programRoutes from './routes/program.routes';
import matinalesRoutes from './routes/matinales.routes'; 
import eventosRoutes from './routes/eventos.routes';
import rankingRoutes from './routes/ranking.routes';
import materialsRoutes from './routes/materials.routes';
import scoreboardsRoutes from './routes/scoreboards.routes';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.use('/static/brand', express.static(path.join(__dirname, '../uploads/brand')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/config', configRoutes);
app.use('/api/secretaria', secretariaRoutes); 
app.use('/api/puntuaciones', puntuacionesRoutes);
app.use('/api/programa', programRoutes);
app.use('/api/matinales', matinalesRoutes); 
app.use('/api/eventos', eventosRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/scoreboards', scoreboardsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend running', timestamp: new Date().toISOString() });
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor', message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\nServidor corriendo en http://localhost:${PORT}`);
});