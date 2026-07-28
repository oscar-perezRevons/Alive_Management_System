# 🛡️ ALIVE Management System (Sistema de Gestión Colectiva)

Bienvenido a **ALIVE Management System**, una plataforma web integral desarrollada para la administración, gestión de grupos pequeños, seguimiento de puntuaciones, eventos, programas y recursos de la organización **ALIVE — Maranata Adoración**.

---

## 📋 Tabla de Contenidos

1. [Visión General](#-visión-general)
2. [Características y Módulos](#-características-y-módulos)
3. [Stack Tecnológico](#-stack-tecnológico)
4. [Estructura del Proyecto](#-estructura-del-proyecto)
5. [Modelo de Base de Datos (Prisma & PostgreSQL)](#-modelo-de-base-de-datos-prisma--postgresql)
6. [Roles y Matriz de Permisos](#-roles-y-matriz-de-permisos)
7. [Guía de Instalación y Ejecución](#-guía-de-instalación-y-ejecución)
8. [Variables de Entorno](#-variables-de-entorno)
9. [Diseño y Temas (Light / Dark Mode)](#-diseño-y-temas-light--dark-mode)

---

## 🌟 Visión General

El **Sistema de Gestión Colectiva ALIVE** centraliza todas las operaciones operativas, dinámicas comunitarias y competencias de la iglesia/organización:
- **Administración de Grupos Pequeños (GP)**: Registro de lemas, versículos, miembros, líderes y puntuación acumulada.
- **Sistema Gamificado de Puntuación y Ranking**: Registro de actividades continuas y eventos especiales (Campamentos, Rallies, Olimpiadas).
- **Control de Asistencia y Secretaría**: Monitoreo de participación semanal de los miembros.
- **Gestión de Eventos y Materiales**: Inscripción por grupos, visualización y descarga de materiales oficiales (PDFs y multimedia).

---

## ✨ Características y Módulos

### 1. 🔑 Autenticación y Perfiles
- Registro e Inicio de sesión seguro mediante **JWT (JSON Web Tokens)** y hashing de contraseñas con **Bcrypt**.
- **Mi Perfil**: Personalización de avatar, fecha de nacimiento, actualización de contraseña y consulta del rol asignado.

### 2. 📊 Dashboard Principal
- Indicadores clave de rendimiento (KPIs): Total de miembros activos, Grupos Pequeños, actividades registradas y eventos vigentes.
- Tarjetas informativas con diseño moderno, sombras ambientales y accesos directos a los principales módulos.

### 3. 📝 Secretaría & Grupos Pequeños
- Gestión completa de asistencias y reportes periódicos por Grupo Pequeño.
- Generación y exportación de reportes oficiales en **PDF** (con membretes institucionales e integraciones de tablas autogeneradas).

### 4. 🏆 Puntuaciones Extra & Competencias (`/dashboard/scoreboards`)
*Módulo exclusivo para Administradores:*
- **Gestión de Tableros / Competencias**: Creación de eventos especiales (Campamentos, Rallies, Olimpiadas, Concursos) con imagen y convocatoria PDF.
- **Gestión de Desafíos**: Asignación de retos por categoría con puntajes máximos configurables.
- **Otorgamiento de Puntos Masivo (*Bulk Award*)**: Asignación simultánea de puntos a múltiples grupos o participantes seleccionados.
- **Podio y Clasificación en Tiempo Real**: Visualización de ranking por grupos y participantes individuales.
- **Impresión de Reportes Oficiales**: Generación de reportes PDF formateados de la competencia.

### 5. 🥇 Ranking General (`/dashboard/ranking`)
- Tabla de posiciones global de Grupos Pequeños.
- Visualización de podio dinámico (Oro, Plata, Bronce) con indicadores de variación de posiciones y desglose de puntos por categoría.

### 6. 📅 Programa General (`/dashboard/programa`)
- Cronograma de actividades con franjas horarias, temas y responsables asignados.
- Edición e inserción en tiempo real de nuevos bloques de programa.

### 7. 📖 Matinales (`/dashboard/matinales`)
- Módulo de seguimiento y control de lecturas devocionales y matinales.

### 8. 🎯 Eventos (`/dashboard/eventos`)
- Publicación de eventos especiales con control de cupos máximos, ubicaciones y estado de inscripción por GP.
- Descarga de convocatorias en formato PDF.

### 9. 📁 Materiales & Recursos (`/dashboard/materiales`)
- Biblioteca digital organizada por categorías (Reglamentos, Capacitaciones, Guías).
- Soporte para vista previa y descarga de archivos PDF e imágenes.

### 10. ⚙️ Control de Usuarios (`/dashboard/users`)
*Módulo exclusivo para Administradores:*
- Administración de usuarios, asignación de roles (`ADMIN`, `USER`), grupo de acceso (`MIEMBRO`, `LIDER_GP`) y vinculación a un Grupo Pequeño.

---

## 🛠 Stack Tecnológico

### **Frontend**
- **Framework / Librería**: React 19 (TypeScript)
- **Estilos & UI**: Tailwind CSS v3 (Diseño responsivo, modo claro/oscuro con clases Tailwind y glassmorphism)
- **Iconografía**: `lucide-react`, `react-icons`
- **Estado Global**: Zustand (`authStore`)
- **Enrutamiento**: React Router v7
- **Peticiones HTTP**: Axios
- **Generación de PDFs**: jsPDF + jsPDF-AutoTable

### **Backend**
- **Entorno de Ejecución**: Node.js + Express (TypeScript)
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma ORM 5.x
- **Autenticación**: JSON Web Tokens (`jsonwebtoken`) + `bcrypt` / `bcryptjs`
- **Carga de Archivos**: Multer

---

## 📁 Estructura del Proyecto

```
alive-management-system/
├── README.md                     # Documentación principal del proyecto
├── backend/                      # Servidor API RESTful
│   ├── prisma/
│   │   ├── schema.prisma         # Definición de modelos de la base de datos
│   │   └── migrations/           # Historial de migraciones SQL
│   ├── src/
│   │   ├── config/               # Configuraciones (Prisma Client, CORS, etc.)
│   │   ├── controllers/          # Lógica de negocio por entidad
│   │   ├── middleware/           # Middlewares de Autenticación y Roles
│   │   ├── routes/               # Definición de endpoints Express
│   │   ├── services/             # Servicios auxiliares
│   │   ├── types/                # Interfaces y tipos TypeScript
│   │   ├── create-admin.ts       # Script de creación inicial de administrador
│   │   └── index.ts              # Punto de entrada del servidor Express
│   ├── uploads/                  # Directorio de archivos subidos (imágenes/PDFs)
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                     # Aplicación SPA cliente
    ├── public/
    ├── src/
    │   ├── assets/               # Logotipos e imágenes estáticas
    │   ├── components/           # Componentes reutilizables (Modales, UI)
    │   ├── layouts/              # Layouts principales (DashboardLayout, etc.)
    │   ├── pages/                # Páginas / Vistas de la aplicación
    │   │   ├── DashboardPage.tsx
    │   │   ├── EventosPage.tsx
    │   │   ├── GroupsPage.tsx
    │   │   ├── LoginPage.tsx
    │   │   ├── MaterialesPage.tsx
    │   │   ├── MatinalesPage.tsx
    │   │   ├── ProfilePage.tsx
    │   │   ├── ProgramaPage.tsx
    │   │   ├── PuntuacionesPage.tsx
    │   │   ├── RankingPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   ├── ScoreboardPage.tsx    # Vista de Puntuaciones Extra & Competencias
    │   │   ├── SecretariaPage.tsx
    │   │   └── UsersPage.tsx
    │   ├── services/             # Cliente API Axios (`api.ts`)
    │   ├── stores/               # Estado global Zustand (`authStore.ts`)
    │   ├── utils/                # Utilidades de acceso y formatos (`access.ts`)
    │   └── App.tsx               # Enrutador y componentes protegidos
    ├── package.json
    └── tailwind.config.js
```

---

## 🗄 Modelo de Base de Datos (Prisma & PostgreSQL)

A continuación se resumen las principales entidades definidas en `schema.prisma`:

| Modelo | Descripción |
| :--- | :--- |
| **`User`** | Representa a los usuarios del sistema. Contiene credenciales, rol (`ADMIN` / `USER`), grupo de función (`groupRole`) y relación con su Grupo Pequeño. |
| **`GroupSmall`** | Grupos Pequeños de la iglesia. Almacena lema, versículo bíblico, líder, co-líder, puntos acumulados y miembros. |
| **`Score`** | Registro de puntuaciones de actividades regulares vinculadas a un usuario y grupo. |
| **`Activity`** | Actividades de puntuación con categoría y valor de puntos. |
| **`PointCategory`** | Categorías organizativas para la clasificación de actividades (ej. Asistencia, Culto, Misión). |
| **`Penalty`** | Registro de penalizaciones impuestas a los Grupos Pequeños. |
| **`ProgramEvent`** | Franjas horarias y actividades del Programa General. |
| **`Event`** | Eventos organizados con cupos, fechas, ubicación y convocatoria PDF. |
| **`EventParticipation`** | Inscripciones de un Grupo Pequeño a un Evento específico. |
| **`Material`** | Archivos digitales y recursos (PDF/Imágenes) publicados en la plataforma. |
| **`ExtraScoreboard`** | Tableros de puntuación para eventos masivos (Campamentos, Olimpiadas, Rallies). |
| **`ScoreChallenge`** | Desafíos o pruebas creadas dentro de un `ExtraScoreboard`. |
| **`ExtraGroupScore`** | Puntos asignados a un Grupo Pequeño dentro de un evento masivo/desafío. |
| **`ExtraParticipantScore`** | Puntos asignados a un participante individual dentro de un evento masivo/desafío. |

---

## 🔒 Roles y Matriz de Permisos

El sistema gestiona el acceso mediante roles asignados a los usuarios (`user.role` y `user.groupRole`):

| Módulo / Ruta | Admin (`ADMIN`) | Líder GP (`LIDER_GP`) | Miembro (`USER`) |
| :--- | :---: | :---: | :---: |
| **Inicio (`/dashboard`)** | ✅ | ✅ | ✅ |
| **Secretaría (`/dashboard/secretaria`)** | ✅ | ✅ | ❌ |
| **Puntuaciones Regulares (`/dashboard/puntuaciones`)** | ✅ | ❌ | ❌ |
| **Programa General (`/dashboard/programa`)** | ✅ | ✅ | ❌ |
| **Matinales (`/dashboard/matinales`)** | ✅ | ✅ | ✅ |
| **Eventos (`/dashboard/eventos`)** | ✅ | ✅ | ✅ |
| **Ranking General (`/dashboard/ranking`)** | ✅ | ✅ | ✅ |
| **Puntuaciones Extra (`/dashboard/scoreboards`)** | ✅ | ❌ | ❌ |
| **Materiales (`/dashboard/materiales`)** | ✅ | ✅ | ✅ |
| **Control de Usuarios (`/dashboard/users`)** | ✅ | ❌ | ❌ |

---

## 🚀 Guía de Instalación y Ejecución

### Requisitos Previos
- **Node.js**: v18.x o superior
- **npm**: v9.x o superior
- **PostgreSQL**: Instalado y en ejecución local o servidor remoto

---

### 1. Configuración del Backend

1. Navega a la carpeta del backend:
   ```bash
   cd backend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura el archivo `.env` en la carpeta `backend/`:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://usuario:password@localhost:5432/alive_db?schema=public"
   JWT_SECRET="tu_clave_secreta_super_segura"
   ```

4. Genera el cliente de Prisma y ejecuta las migraciones:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. *(Opcional)* Crea el usuario Administrador inicial:
   ```bash
   npx ts-node src/create-admin.ts
   ```

6. Inicia el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
   *El backend estará corriendo en `http://localhost:5000`.*

---

### 2. Configuración del Frontend

1. Abre una nueva terminal y navega a la carpeta del frontend:
   ```bash
   cd frontend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia la aplicación en modo desarrollo:
   ```bash
   npm run start
   ```
   *La aplicación estará accesible en `http://localhost:3000`.*

---

## 🎨 Diseño y Temas (Light / Dark Mode)

El sistema incorpora un diseño adaptativo de última generación:
- **Paleta de Colores**: Basada en Tailwind CSS (`indigo`, `violet`, `emerald`, `slate`).
- **Transiciones Suaves**: Alternancia instantánea entre el **Modo Claro** y el **Modo Oscuro** mediante el conmutador de la barra superior.
- **Glassmorphism & Micro-interacciones**: Translucidez `backdrop-blur`, gradientes elegantes y efectos hover reactivos en tarjetas, tablas y modales.

---

© 2026 **ALIVE — Maranata Adoración**. Todos los derechos reservados.
