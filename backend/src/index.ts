import express from 'express';
import cors from 'cors';
import path from 'path'; 
import dotenv from 'dotenv';

dotenv.config(); 

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