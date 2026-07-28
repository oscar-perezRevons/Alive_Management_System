import React, { useEffect, useState, useCallback } from 'react';
import { eventosService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { 
  Calendar, Trophy, Plus, MoreVertical, CheckCircle2, ArrowRight,
  AlertCircle, X, CalendarDays, MapPin, Clock, Users, Eye, 
  Layers, Check, Info, Trash2, Edit2, FileText, Upload,
  ChevronLeft, ChevronRight, Search, Building2, Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import campamentoImg from '../assets/campamento.jpg';
import confraternizacionImg from '../assets/confraternizacion.jpg';
import viajesImg from '../assets/viajes.jpg';
import basquetImg from '../assets/basquet.jpg';
import futbolImg from '../assets/futbol.jpg';
import recreacionImg from '../assets/recreacion.jpg';
import logoImage from '../assets/logo.png';

const backendBase = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export const EventosPage: React.FC = () => {
  const { user } = useAuthStore();
  const userCanManageEvents = user?.role === 'ADMIN';

  // Carrusel de Imágenes de Eventos Recreativos
  const [recreativoImgIndex, setRecreativoImgIndex] = useState(0);
  const recreativoImages = [campamentoImg, confraternizacionImg, viajesImg];
  
  useEffect(() => {
    const timer = setInterval(() => {
      setRecreativoImgIndex((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Carrusel de Imágenes de Deportes
  const [deporteImgIndex, setDeporteImgIndex] = useState(0);
  const deporteImages = [basquetImg, futbolImg, recreacionImg];
  
  useEffect(() => {
    const timer = setInterval(() => {
      setDeporteImgIndex((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Normalización de roles grupales
  // Helper centralizado para asignación precisa de cargos de GP (Líder, Colíder, Secretario, Tesorero, Integrante)
  const getGroupRoleBadge = (rawRoleInput: any) => {
    const rawRole = (typeof rawRoleInput === 'string' ? rawRoleInput : '') || 'INTEGRANTE';
    const roleNorm = rawRole
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[_\s-]+/g, '')
      .trim();

    if (roleNorm === 'LIDER') {
      return {
        roleLabel: 'LÍDER GP',
        roleBadgeStyle: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/30',
        roleIcon: '👑',
        avatarGradient: 'from-indigo-500 to-violet-600'
      };
    }
    if (['COLIDER', 'SUBLIDER', 'CO_LIDER', 'CO-LIDER'].includes(roleNorm)) {
      return {
        roleLabel: 'COLÍDER GP',
        roleBadgeStyle: 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm shadow-blue-500/30',
        roleIcon: '🛡️',
        avatarGradient: 'from-blue-500 to-cyan-600'
      };
    }
    if (['SECRETARIO', 'SECRETARIA'].includes(roleNorm)) {
      return {
        roleLabel: roleNorm === 'SECRETARIA' ? 'SECRETARIA GP' : 'SECRETARIO GP',
        roleBadgeStyle: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-500/30',
        roleIcon: '📋',
        avatarGradient: 'from-emerald-500 to-teal-600'
      };
    }
    if (['TESORERO', 'TESORERA'].includes(roleNorm)) {
      return {
        roleLabel: roleNorm === 'TESORERA' ? 'TESORERA GP' : 'TESORERO GP',
        roleBadgeStyle: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-sm shadow-amber-500/30',
        roleIcon: '💰',
        avatarGradient: 'from-amber-500 to-orange-600'
      };
    }
    return {
      roleLabel: 'INTEGRANTE',
      roleBadgeStyle: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600',
      roleIcon: '👤',
      avatarGradient: 'from-slate-400 to-slate-500'
    };
  };

  // Obtenedor dinámico del Líder real del Grupo Pequeño según la lista de integrantes
  const getGroupLeaderName = (group: any) => {
    if (group && group.members && Array.isArray(group.members)) {
      const leaderMember = group.members.find((m: any) => {
        const norm = (m.groupRole || m.roleInGP || m.role || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase()
          .replace(/[_\s-]+/g, '')
          .trim();
        return norm === 'LIDER';
      });
      if (leaderMember && leaderMember.name) return leaderMember.name;
    }
    if (group && group.leaderName && group.leaderName.trim() && group.leaderName.trim() !== 'Oscar Samuel Perez Callizaya') {
      return group.leaderName.trim();
    }
    return 'Sin Líder Asignado';
  };

  const normGroupRole = (user?.groupRole || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[_\s-]+/g, '')
    .trim();

  const userIsAdmin = user?.role === 'ADMIN';

  // SOLO el Líder y el Colíder pueden inscribir (participar) al evento como Grupo Pequeño. El Admin no se inscribe a sí mismo como GP.
  const canRegisterGroup = !userIsAdmin && ['LIDER', 'SUBLIDER', 'COLIDER'].includes(normGroupRole);

  // SOLO el Líder y el Colíder del Grupo Pequeño ven y gestionan el botón de Asistencia. El Admin NO ve este botón en las tarjetas.
  const canManageAttendance = !userIsAdmin && ['LIDER', 'SUBLIDER', 'COLIDER'].includes(normGroupRole);

  // SOLO el Administrador o el Líder del Grupo Pequeño pueden cancelar la participación del GP del evento
  const canCancelParticipation = userIsAdmin || ['LIDER', 'SUBLIDER'].includes(normGroupRole);

  // Estados del modal de Asistencia
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedAttendanceEvent, setSelectedAttendanceEvent] = useState<any | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [checkedMemberIds, setCheckedMemberIds] = useState<number[]>([]);
  const [groupName, setGroupName] = useState('');
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const openAttendanceModal = async (event: any, participation: any) => {
    setSelectedAttendanceEvent(event);
    setIsAttendanceModalOpen(true);
    setAttendanceLoading(true);
    try {
      const res = await eventosService.getMyGroupMembers();
      setGroupMembers(res.data.members || []);
      setGroupName(res.data.groupName || '');
      
      const confirmedStr = participation.confirmedMembers || '';
      const ids = confirmedStr ? confirmedStr.split(',').map(Number).filter((id: number) => !isNaN(id)) : [];
      setCheckedMemberIds(ids);
    } catch (error) {
      triggerNotification('Error', 'No se pudieron cargar los integrantes del grupo.', 'error');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleToggleMember = (memberId: number) => {
    if (!canManageAttendance) return;
    setCheckedMemberIds(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId) 
        : [...prev, memberId]
    );
  };

  const saveAttendance = async () => {
    if (!selectedAttendanceEvent) return;
    setSavingAttendance(true);
    try {
      await eventosService.updateConfirmedMembers(selectedAttendanceEvent.id, checkedMemberIds);
      triggerNotification('Asistencia Guardada', 'La lista de participantes del grupo ha sido actualizada.', 'success');
      setIsAttendanceModalOpen(false);
      loadData();
    } catch (error: any) {
      triggerNotification('Error', error.response?.data?.message || 'No se pudo guardar la asistencia.', 'error');
    } finally {
      setSavingAttendance(false);
    }
  };

  const [events, setEvents] = useState<any[]>([]);
  const [myParticipations, setMyParticipations] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [kpis, setKpis] = useState({ eventosProgramados: 0, gpInscritosMes: 0, eventosProximos: 0, participacionesTotales: 0 });
  const [loading, setLoading] = useState(false);
  
  const [activeTabRecreativos, setActiveTabRecreativos] = useState<'Próximos' | 'En Curso' | 'Finalizados'>('Próximos');
  const [activeTabDeportes, setActiveTabDeportes] = useState<'Próximos' | 'En Curso' | 'Finalizados'>('Próximos');
  const [selectedCategoryView, setSelectedCategoryView] = useState<'ALL' | 'RECREATIVO' | 'DEPORTE'>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventIdToDelete, setEventIdToDelete] = useState<number | null>(null);

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [eventIdToLeave, setEventIdToLeave] = useState<number | null>(null);
  const [targetGroupIdToLeave, setTargetGroupIdToLeave] = useState<number | null>(null);

  // Estados para Modal Informativo del Evento (para todos los usuarios)
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedInfoEvent, setSelectedInfoEvent] = useState<any | null>(null);

  const openEventInfoModal = (event: any) => {
    setSelectedInfoEvent(event);
    setIsInfoModalOpen(true);
  };

  // Estados para Modal Admin de Grupos Pequeños Inscritos y No Inscritos con sus Integrantes
  const [isAdminDetailModalOpen, setIsAdminDetailModalOpen] = useState(false);
  const [adminDetailData, setAdminDetailData] = useState<any | null>(null);
  const [adminDetailLoading, setAdminDetailLoading] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<'ENROLLED' | 'NOT_ENROLLED'>('ENROLLED');
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);
  const [adminDetailSearch, setAdminDetailSearch] = useState('');

  const openAdminDetailModal = async (event: any) => {
    setIsAdminDetailModalOpen(true);
    setAdminDetailLoading(true);
    setActiveAdminTab('ENROLLED');
    setExpandedGroupId(null);
    setAdminDetailSearch('');
    try {
      const res = await eventosService.getEventAdminDetails(event.id);
      setAdminDetailData(res.data.data);
    } catch (err) {
      triggerNotification('Error', 'No se pudieron obtener los detalles completos del evento.', 'error');
    } finally {
      setAdminDetailLoading(false);
    }
  };

  const toggleExpandGroup = (groupId: number) => {
    setExpandedGroupId(prev => prev === groupId ? null : groupId);
  };

  const [isAdminGroupsModalOpen, setIsAdminGroupsModalOpen] = useState(false);
  const [selectedAdminGroupsEvent, setSelectedAdminGroupsEvent] = useState<any | null>(null);
  const [adminGroupSearch, setAdminGroupSearch] = useState('');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openAdminGroupsModal = (event: any) => {
    setSelectedAdminGroupsEvent(event);
    setAdminGroupSearch('');
    setIsAdminGroupsModalOpen(true);
  };

  const openAdminGroupAttendanceModal = (event: any, participation: any) => {
    setSelectedAttendanceEvent(event);
    setGroupName(participation.groupSmall?.name || 'Grupo Pequeño');
    setGroupMembers(participation.groupSmall?.members || []);
    const confirmedStr = participation.confirmedMembers || '';
    const ids = confirmedStr ? confirmedStr.split(',').map(Number).filter((id: number) => !isNaN(id)) : [];
    setCheckedMemberIds(ids);
    setIsAttendanceModalOpen(true);
  };

  const handleAdminCancelGroup = async (eventId: number, groupId: number) => {
    try {
      await eventosService.leave(eventId, groupId);
      triggerNotification('Inscripción Cancelada', 'Se ha revocado la participación del grupo en el evento.', 'success');
      setIsAdminGroupsModalOpen(false);
      loadData();
    } catch (err: any) {
      triggerNotification('Error', err.response?.data?.message || 'No se pudo cancelar la inscripción.', 'error');
    }
  };

  // Estados de Previsualización e Impresión del PDF del Evento
  const [isPdfPreviewModalOpen, setIsPdfPreviewModalOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('Reporte_Evento.pdf');

  // Helper para convertir Assets a Base64 para el PDF
  const convertAssetToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        resolve('');
      };
    });
  };

  // Generador Oficial con Estilo Ejecutivo Limpio, Logo Oficial y Tipografía Institucional
  const buildEventReportPdf = (adminData: any, logoBase64?: string) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const event = adminData.event;
    const enrolled = adminData.enrolledGroups || [];
    const notEnrolled = adminData.notEnrolledGroups || [];

    let yPos = 16;
    const textX = logoBase64 ? 36 : 14;

    // Renderizado del Logo Oficial de ALIVE
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 14, 11, 18, 18);
      } catch (e) {
        console.warn('Could not add logo to PDF', e);
      }
    }

    // Subtítulo Superior Categoria / Badge
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CONVOCATORIA OFICIAL DE EVENTO', textX, yPos);

    // Contador KPI Destacado Superior Derecho (Estilo Limpio Screenshot 2)
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(`${enrolled.length}`, 196, yPos + 3, { align: 'right' });

    doc.setTextColor(100, 116, 139); // Slate 500
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('GRUPOS PEQUEÑOS INSCRITOS', 196, yPos + 8, { align: 'right' });

    // Título Principal del Evento
    yPos += 7;
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.text((event.title || 'CONVOCATORIA DE EVENTO').toUpperCase(), textX, yPos);

    yPos += 5;
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`ALIVE -- Categoria ${(event.category || 'RECREATIVO').toUpperCase()}`, textX, yPos);

    // Línea Divisoria Fina del Encabezado con Acento
    yPos += 6;
    doc.setDrawColor(203, 213, 225); // Slate 300
    doc.setLineWidth(0.6);
    doc.line(14, yPos, 196, yPos);

    // Pequeño acento de color Azul Eléctrico en la línea divisoria
    doc.setDrawColor(59, 130, 246); // Blue 500
    doc.setLineWidth(0.9);
    doc.line(14, yPos, 42, yPos);

    yPos += 7;

    // Tarjetas de Resumen KPI Estructuradas con Centrado Posicional y Texto Completo Sin Abreviaciones
    const cardWidth = 88;
    const cardHeight = 17.5;

    // Cuadro 1: Fecha y Horario Sub-estructurado (x: 14 a 102, divisoria en x: 58)
    doc.setFillColor(250, 251, 253);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, yPos, cardWidth, cardHeight, 3, 3, 'FD');

    // Sub-columna 1: Fecha (Centro en x: 36)
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text('FECHA DEL EVENTO', 36, yPos + 5.8, { align: 'center' });

    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${event.startDate || 'No especificada'}`, 36, yPos + 12.2, { align: 'center' });

    // Divisoria vertical interior centrada
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(58, yPos + 3.5, 58, yPos + 14);

    // Sub-columna 2: Horario (Centro en x: 80)
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text('HORARIO', 80, yPos + 5.8, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${event.timeSlot || 'Por definir'}`, 80, yPos + 12.2, { align: 'center' });

    // Cuadro 2: Lugar y Capacidad Sub-estructurado (x: 108 a 196, divisoria en x: 152)
    doc.setFillColor(250, 251, 253);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(108, yPos, cardWidth, cardHeight, 3, 3, 'FD');

    // Sub-columna 1: Lugar (Centro en x: 130)
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text('LUGAR DE CONVOCATORIA', 130, yPos + 5.8, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`${event.location || 'Por definir'}`, 130, yPos + 12.2, { align: 'center' });

    // Divisoria vertical interior centrada
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(152, yPos + 3.5, 152, yPos + 14);

    // Sub-columna 2: Capacidad (Centro en x: 174)
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text('CAPACIDAD MÁXIMA', 174, yPos + 5.8, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Máx. ${event.maxSpots} Grupos Pequeños`, 174, yPos + 12.2, { align: 'center' });

    yPos += 22;

    // Sección 1: GRUPOS PEQUEÑOS INSCRITOS
    const enrolledLabel = enrolled.length === 1 ? '1 GRUPO PEQUEÑO' : `${enrolled.length} GRUPOS PEQUEÑOS`;
    
    // Encabezado de Sección Destacado con Píldora Elegante
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.roundedRect(14, yPos - 3.5, 3, 5, 1, 1, 'F');
    
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`TABLA DE GRUPOS PEQUEÑOS INSCRITOS (${enrolledLabel})`, 20, yPos);
    yPos += 4.5;

    if (enrolled.length === 0) {
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('No hay Grupos Pequeños inscritos actualmente.', 14, yPos + 4);
      yPos += 12;
    } else {
      enrolled.forEach((group: any) => {
        if (yPos > 245) {
          doc.addPage();
          yPos = 20;
        }

        const realLeaderName = getGroupLeaderName(group).toUpperCase();
        const groupNameUpper = (group.name || '').toUpperCase();

        // Encabezado de la Tarjeta del Grupo (Caja Tinta Suave Slate/Indigo con Borde Fino)
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225); // Slate 300 border
        doc.roundedRect(14, yPos, 182, 10, 2, 2, 'FD');

        // Barra de Acento Esmeralda Lateral para Grupos Inscritos
        doc.setFillColor(5, 150, 105); // Emerald 600
        doc.roundedRect(14, yPos, 3, 10, 1.5, 1.5, 'F');

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.text(`GRUPO PEQUEÑO ${groupNameUpper}`, 20, yPos + 6.5);

        doc.setTextColor(51, 65, 85);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`Lider: ${realLeaderName}   |   Confirmados: ${group.confirmedCount} de ${group.totalMembersCount} personas`, 192, yPos + 6.5, { align: 'right' });

        yPos += 12;

        const sortedMembers = [...(group.members || [])].sort((a: any, b: any) => {
          const aConfirmed = Boolean(a.isConfirmed);
          const bConfirmed = Boolean(b.isConfirmed);
          if (aConfirmed === bConfirmed) return 0;
          return aConfirmed ? -1 : 1;
        });

        const tableData = sortedMembers.map((m: any, index: number) => {
          const { roleLabel } = getGroupRoleBadge(m.groupRole);
          const memberNameUpper = (m.name || '').toUpperCase();
          return [
            index + 1,
            memberNameUpper,
            roleLabel,
            m.isConfirmed ? 'CONFIRMADO' : 'SIN CONFIRMAR PARTICIPACION'
          ];
        });

        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Nombre', 'Cargo', 'Estado']],
          body: tableData,
          margin: { left: 14, right: 14 },
          tableLineWidth: 0.15,
          tableLineColor: [226, 232, 240], // Borde interior de cuadrícula slate fino
          styles: { fontSize: 8, cellPadding: 3.5, font: 'helvetica', textColor: [30, 41, 59] },
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5, halign: 'center', lineWidth: 0.2, lineColor: [30, 41, 59] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: {
            0: { cellWidth: 12, halign: 'center', fontStyle: 'bold', textColor: [100, 116, 139] },
            1: { fontStyle: 'bold', textColor: [15, 23, 42] },
            2: { cellWidth: 44, halign: 'center', textColor: [51, 65, 85] },
            3: { cellWidth: 62, halign: 'center' }
          },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 3) {
              // Ocultar texto por defecto de autoTable para dibujar badge personalizado perfecto
              data.cell.text = [];
            }
          },
          didDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 3) {
              const rawVal = String(data.cell.raw || '');
              const isConfirmed = rawVal === 'CONFIRMADO';
              const cell = data.cell;
              
              const paddingX = 3;
              const paddingY = 1.2;
              const pillW = cell.width - (paddingX * 2);
              const pillH = cell.height - (paddingY * 2);
              const pillX = cell.x + paddingX;
              const pillY = cell.y + paddingY;

              if (isConfirmed) {
                // Pastilla Verde Esmeralda Menta (#DCFCE7 / #A7F3D0 / #15803D)
                doc.setFillColor(220, 252, 231);
                doc.setDrawColor(167, 243, 208);
                doc.setLineWidth(0.2);
                doc.roundedRect(pillX, pillY, pillW, pillH, 1.5, 1.5, 'FD');

                doc.setTextColor(21, 128, 61);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7.5);
                doc.text('CONFIRMADO', cell.x + (cell.width / 2), pillY + (pillH / 2) + 1, { align: 'center' });
              } else {
                // Pastilla Ámbar Calido (#FEF3C7 / #FDE68A / #B45309)
                doc.setFillColor(254, 243, 199);
                doc.setDrawColor(253, 230, 138);
                doc.setLineWidth(0.2);
                doc.roundedRect(pillX, pillY, pillW, pillH, 1.5, 1.5, 'FD');

                doc.setTextColor(180, 83, 9);
                doc.setFont('helvetica', 'bold');
                doc.text('SIN CONFIRMAR PARTICIPACION', cell.x + (cell.width / 2), pillY + (pillH / 2) + 1, { align: 'center' });
              }
            }
          }
        });

        yPos = (doc as any).lastAutoTable.finalY + 9;
      });
    }

    // Sección 2: GRUPOS PEQUEÑOS NO INSCRITOS
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    const notEnrolledLabel = notEnrolled.length === 1 ? '1 GRUPO PEQUEÑO' : `${notEnrolled.length} GRUPOS PEQUEÑOS`;
    
    // Encabezado de Sección Destacado con Píldora Elegante
    doc.setFillColor(225, 29, 72); // Rose 600
    doc.roundedRect(14, yPos - 3.5, 3, 5, 1, 1, 'F');

    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`GRUPOS PEQUEÑOS NO INSCRITOS (${notEnrolledLabel})`, 20, yPos);
    yPos += 4.5;

    if (notEnrolled.length === 0) {
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('Todos los Grupos Pequeños registrados están inscritos en este evento.', 14, yPos + 4);
    } else {
      notEnrolled.forEach((group: any) => {
        if (yPos > 245) {
          doc.addPage();
          yPos = 20;
        }

        const realLeaderName = getGroupLeaderName(group).toUpperCase();
        const groupNameUpper = (group.name || '').toUpperCase();

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225); // Slate 300 border
        doc.roundedRect(14, yPos, 182, 10, 2, 2, 'FD');

        // Barra de Acento Rojo Rosa para Grupos No Inscritos
        doc.setFillColor(225, 29, 72); // Rose 600
        doc.roundedRect(14, yPos, 3, 10, 1.5, 1.5, 'F');

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.text(`GRUPO PEQUEÑO ${groupNameUpper}`, 20, yPos + 6.5);

        doc.setTextColor(51, 65, 85);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`Lider: ${realLeaderName}   |   Total Integrantes: ${group.totalMembersCount} personas`, 192, yPos + 6.5, { align: 'right' });

        yPos += 12;

        const tableData = (group.members || []).map((m: any, index: number) => {
          const { roleLabel } = getGroupRoleBadge(m.groupRole);
          const memberNameUpper = (m.name || '').toUpperCase();
          return [
            index + 1,
            memberNameUpper,
            roleLabel
          ];
        });

        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Nombre', 'Cargo']],
          body: tableData,
          margin: { left: 14, right: 14 },
          tableLineWidth: 0.15,
          tableLineColor: [226, 232, 240],
          styles: { fontSize: 8, cellPadding: 3.5, font: 'helvetica', textColor: [30, 41, 59] },
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5, halign: 'center', lineWidth: 0.2, lineColor: [30, 41, 59] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: {
            0: { cellWidth: 12, halign: 'center', fontStyle: 'bold', textColor: [100, 116, 139] },
            1: { fontStyle: 'bold', textColor: [15, 23, 42] },
            2: { cellWidth: 50, halign: 'center', textColor: [51, 65, 85] }
          }
        });

        yPos = (doc as any).lastAutoTable.finalY + 9;
      });
    }

    // Pie de Página Limpio Institucional
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.setLineWidth(0.5);
      doc.line(14, 284, 196, 284);

      doc.setTextColor(148, 163, 184); // Slate 400
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} * ${new Date().toLocaleTimeString('es-ES')}`, 14, 290);

      doc.setTextColor(51, 65, 85); // Slate 700
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('ALIVE - Sistema Oficial de Gestión', 196, 290, { align: 'right' });
    }

    return doc;
  };

  const openPdfPreviewModal = async (adminData: any) => {
    if (!adminData || !adminData.event) return;
    const logoBase64 = await convertAssetToBase64(logoImage);
    const doc = buildEventReportPdf(adminData, logoBase64);
    const blobUrl = String(doc.output('bloburl'));
    setPdfPreviewUrl(blobUrl);
    setPdfFileName(`Reporte_Evento_${(adminData.event.title || 'Convocatoria').replace(/\s+/g, '_')}.pdf`);
    setIsPdfPreviewModalOpen(true);
  };

  const downloadPdfReport = async (adminData: any) => {
    if (!adminData || !adminData.event) return;
    const logoBase64 = await convertAssetToBase64(logoImage);
    const doc = buildEventReportPdf(adminData, logoBase64);
    doc.save(`Reporte_Evento_${(adminData.event.title || 'Convocatoria').replace(/\s+/g, '_')}.pdf`);
  };

  // Estados para Calendario y Horario Personalizados (Custom Date & Time Pickers)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  const MONTH_NAMES_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const [formFields, setFormFields] = useState({
    title: '', description: '', category: 'RECREATIVO', typeTag: '',
    startDate: '', timeSlot: '', location: '', maxSpots: '15', status: 'Abierto',
    imageUrl: '', pdfUrl: ''
  });

  const [notification, setNotification] = useState({
    isOpen: false, title: '', message: '', type: 'success' as 'success' | 'error'
  });

  const triggerNotification = useCallback((title: string, message: string, type: 'success' | 'error') => {
    setNotification({ isOpen: true, title, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, isOpen: false })), 4000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [resEvents, resMy, resKpi] = await Promise.all([
        eventosService.getAll(),
        eventosService.getMyParticipations(),
        eventosService.getKpis().catch(() => ({ data: { stats: null } }))
      ]);
      
      const fetchedEvents = resEvents.data.events || [];
      setEvents(fetchedEvents);
      setMyParticipations(resMy.data.participations || []);
      
      if (resKpi.data?.stats) {
        setKpis({
          eventosProgramados: resKpi.data.stats.eventosProgramados,
          gpInscritosMes: resKpi.data.stats.gpInscritosMes,
          eventosProximos: resKpi.data.stats.eventosProximos,
          participacionesTotales: resKpi.data.stats.participacionesTotales
        });
      } else {
        setKpis({
          eventosProgramados: fetchedEvents.length,
          gpInscritosMes: 8, 
          eventosProximos: fetchedEvents.filter((e: any) => e.status === 'Abierto').length,
          participacionesTotales: fetchedEvents.reduce((acc: number, e: any) => acc + (e.participations?.length || 0), 0)
        });
      }
    } catch (err) {
      triggerNotification('Error', 'No se pudieron sincronizar los datos de las convocatorias.', 'error');
    } finally {
      setLoading(false);
    }
  }, [triggerNotification]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreateModal = (category: 'RECREATIVO' | 'DEPORTE') => {
    if (!userCanManageEvents) {
      triggerNotification('Acceso restringido', 'Tu rol solo permite consultar eventos.', 'error');
      return;
    }
    setEditingEvent(null);
    setFormFields({
      title: '', description: '', category, typeTag: '',
      startDate: '', timeSlot: '', location: '', maxSpots: '15', status: 'Abierto',
      imageUrl: '', pdfUrl: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (event: any) => {
    if (!userCanManageEvents) {
      triggerNotification('Acceso restringido', 'Tu rol solo permite consultar eventos.', 'error');
      return;
    }
    setEditingEvent(event);
    setFormFields({
      title: event.title, description: event.description || '', category: event.category,
      typeTag: event.typeTag, startDate: event.startDate, timeSlot: event.timeSlot,
      location: event.location, maxSpots: String(event.maxSpots), status: event.status,
      imageUrl: event.imageUrl || '', pdfUrl: event.pdfUrl || ''
    });
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const openDetailsModal = (participation: any) => {
    setSelectedDetails(participation);
    setIsDetailsModalOpen(true);
  };

  const triggerDeleteConfirm = (id: number) => {
    if (!userCanManageEvents) {
      triggerNotification('Acceso restringido', 'Tu rol no puede eliminar convocatorias.', 'error');
      return;
    }
    setEventIdToDelete(id);
    setIsDeleteModalOpen(true);
    setActiveMenuId(null);
  };

  const executeDelete = async () => {
    if (!eventIdToDelete) return;
    if (!userCanManageEvents) {
      triggerNotification('Acceso restringido', 'Tu rol no puede eliminar convocatorias.', 'error');
      return;
    }
    try {
      await eventosService.delete(eventIdToDelete);
      triggerNotification('Purgado', 'Convocatoria eliminada del cronograma de forma definitiva.', 'success');
      setIsDeleteModalOpen(false);
      setEventIdToDelete(null);
      loadData();
    } catch (err) {
      triggerNotification('Error', 'No se pudo procesar la eliminación del registro.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCanManageEvents) {
      triggerNotification('Acceso restringido', 'Tu rol no puede crear ni editar convocatorias.', 'error');
      return;
    }
    try {
      if (editingEvent) {
        await eventosService.update(editingEvent.id, formFields);
        triggerNotification('Modificado', 'Cambios guardados correctamente en el servidor.', 'success');
      } else {
        await eventosService.create(formFields);
        triggerNotification('Publicado', 'Nueva convocatoria subida con éxito.', 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      triggerNotification('Error', 'Por favor verifica la consistencia de los campos.', 'error');
    }
  };

  const handleJoin = async (event: any) => {
    try {
      const res = await eventosService.join(event.id);
      triggerNotification('¡Inscripción Exitosa!', 'Tu Grupo Pequeño ha asegurado su participación. Selecciona a los participantes a continuación.', 'success');
      await loadData();
      const participation = res.data?.participation || { confirmedMembers: '' };
      openAttendanceModal(event, participation);
    } catch (err: any) {
      triggerNotification('Denegado', err.response?.data?.message || 'Error de inscripción.', 'error');
    }
  };

  const handleLeave = (id: number, groupId?: number) => {
    if (!canCancelParticipation) {
      triggerNotification('Acceso Denegado', 'Solo el Administrador o el Líder del Grupo Pequeño pueden cancelar la inscripción.', 'error');
      return;
    }
    setEventIdToLeave(id);
    setTargetGroupIdToLeave(groupId || null);
    setIsLeaveModalOpen(true);
  };

  const executeLeave = async () => {
    if (!eventIdToLeave) return;
    try {
      await eventosService.leave(eventIdToLeave, targetGroupIdToLeave || undefined);
      triggerNotification('Inscripción Cancelada', 'Se ha revocado la participación del grupo.', 'success');
      setIsLeaveModalOpen(false);
      setEventIdToLeave(null);
      setTargetGroupIdToLeave(null);
      loadData();
    } catch (err: any) {
      triggerNotification('Error', err.response?.data?.message || 'No se pudo cancelar la inscripción.', 'error');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await eventosService.uploadFile(formData);
      setFormFields(prev => ({ ...prev, imageUrl: res.data.fileUrl }));
      triggerNotification('Subido', 'Imagen de evento cargada con éxito.', 'success');
    } catch (err) {
      triggerNotification('Error', 'No se pudo subir la imagen.', 'error');
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await eventosService.uploadFile(formData);
      setFormFields(prev => ({ ...prev, pdfUrl: res.data.fileUrl }));
      triggerNotification('Subido', 'PDF informativo cargado con éxito.', 'success');
    } catch (err) {
      triggerNotification('Error', 'No se pudo subir el PDF.', 'error');
    }
  };

  const filterEvents = (category: 'RECREATIVO' | 'DEPORTE', tab: string) => {
    return events.filter(e => {
      if (e.category !== category) return false;
      if (tab === 'Próximos') return e.status === 'Abierto';
      if (tab === 'En Curso') return e.status === 'En Curso';
      return e.status === 'Finalizado';
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 bg-[#f0f2fc] dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 px-2 sm:px-6 py-4 font-sans antialiased selection:bg-violet-500 selection:text-white select-none pb-12">
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes border-glow-indigo {
          0% { border-color: #818cf8; box-shadow: 0 0 15px rgba(129, 140, 248, 0.12); }
          50% { border-color: #f472b6; box-shadow: 0 0 25px rgba(244, 114, 182, 0.22); }
          100% { border-color: #818cf8; box-shadow: 0 0 15px rgba(129, 140, 248, 0.12); }
        }
        @keyframes border-glow-emerald {
          0% { border-color: #34d399; box-shadow: 0 0 15px rgba(52, 211, 153, 0.12); }
          50% { border-color: #2dd4bf; box-shadow: 0 0 25px rgba(45, 212, 191, 0.22); }
          100% { border-color: #34d399; box-shadow: 0 0 15px rgba(52, 211, 153, 0.12); }
        }
        @keyframes border-glow-orange {
          0% { border-color: #f59e0b; box-shadow: 0 0 15px rgba(245, 158, 11, 0.12); }
          50% { border-color: #f97316; box-shadow: 0 0 25px rgba(249, 115, 22, 0.22); }
          100% { border-color: #ec4899; box-shadow: 0 0 15px rgba(236, 72, 153, 0.12); }
        }
        .animate-glow-indigo {
          animation: border-glow-indigo 2.5s infinite ease-in-out;
        }
        .animate-glow-emerald {
          animation: border-glow-emerald 2.5s infinite ease-in-out;
        }
        .animate-glow-orange {
          animation: border-glow-orange 2.5s infinite ease-in-out;
        }
      `}</style>
      
      {/* HEADER PREMIUM */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 via-violet-500 via-fuchsia-500 to-orange-400" style={{backgroundSize: '200% 100%', animation: 'shimmer 4s linear infinite'}} />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 pt-6 sm:pt-7">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 sm:p-3 rounded-2xl shadow-lg shadow-indigo-500/30">
                <Calendar size={22} className="text-white sm:w-6 sm:h-6" />
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-700 dark:from-indigo-400 dark:to-violet-400 truncate">Eventos</h1>
              <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5 truncate">Sistema de Convocatorias y Participación GP</p>
            </div>
          </div>
          <div className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-2 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 shrink-0">
            <Layers size={13} className="animate-pulse" />
            Gestión de Eventos
          </div>
        </div>
      </div>

      {selectedCategoryView === 'ALL' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Resumen General Banner Horizontal */}
          <div className="bg-white/80 dark:bg-slate-900/20 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/50 shadow-xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
            {/* Top glowing accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-indigo-500 via-orange-500 to-rose-500" style={{backgroundSize: '200% 100%', animation: 'shimmer 4s linear infinite'}} />
            {/* Colorful glowing radial orbs behind the glass */}
            <div className="absolute -left-12 -top-12 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-rose-500/15 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1.5s'}} />
            
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="p-3 sm:p-3.5 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white rounded-2xl shadow-lg shadow-orange-500/20 hover:scale-110 transition duration-300 shrink-0">
                <Layers size={20} />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Resumen General</h2>
                <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-350 font-black uppercase tracking-widest mt-0.5">Estadísticas del periodo activo ALIVE</p>
              </div>
            </div>
            <div className="w-full lg:w-auto flex justify-end relative z-10">
              <div className="w-full sm:w-auto bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white px-6 sm:px-8 py-3.5 sm:py-4.5 rounded-2xl text-center shadow-lg shadow-orange-500/30 hover:scale-[1.03] active:scale-95 transition duration-300 min-w-0 sm:min-w-[200px] border border-white/20">
                <p className="text-2xl sm:text-3xl font-black leading-none tracking-tight">{events.length}</p>
                <p className="text-[9px] sm:text-[10px] font-black text-white/95 uppercase tracking-widest mt-1.5 sm:mt-2">Eventos Programados</p>
              </div>
            </div>
          </div>

          {/* Grid de Selección de Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div 
              onClick={() => setSelectedCategoryView('RECREATIVO')}
              className="group cursor-pointer relative overflow-hidden rounded-[2rem] border-2 border-indigo-500/40 animate-glow-indigo shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-between text-center min-h-[380px] p-8 gap-4"
            >
              {/* Background Carousel of movement */}
              <div className="absolute inset-0 z-0">
                {recreativoImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 bg-cover bg-center transition-all duration-[1500ms] ease-in-out transform ${
                      recreativoImgIndex === idx 
                        ? 'opacity-80 scale-105 z-10' 
                        : 'opacity-0 scale-100 z-0'
                    }`}
                    style={{ backgroundImage: `url(${img})` }}
                  />
                ))}
                {/* Lighter Gradient Tint Overlay for better image visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-indigo-955/20 to-slate-950/15 z-20" />
              </div>

              <div className="w-16 h-16 bg-white/10 backdrop-blur-md text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/10 border border-white/20 group-hover:scale-110 group-hover:rotate-3 transition duration-300 relative z-30">
                <Users size={30} />
              </div>
              <div className="space-y-3 flex-1 flex flex-col items-center justify-between w-full relative z-30">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block">Categoría 1</span>
                  <h3 className="font-black text-xl text-white uppercase tracking-tight">Eventos Recreativos</h3>
                  <p className="text-xs text-slate-200/90 font-bold leading-normal max-w-xs">Campamentos, confraternizaciones, integraciones y más.</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedCategoryView('RECREATIVO'); }} 
                  className="w-full mt-2 py-3 px-6 bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-black uppercase rounded-2xl shadow-md group-hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Ver Eventos Recreativos <ArrowRight size={14} className="group-hover:translate-x-1 transition duration-200" />
                </button>
              </div>
            </div>
            <div 
              onClick={() => setSelectedCategoryView('DEPORTE')}
              className="group cursor-pointer relative overflow-hidden rounded-[2rem] border-2 border-orange-500/40 animate-glow-orange shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-between text-center min-h-[380px] p-8 gap-4"
            >
              {/* Background Carousel of movement */}
              <div className="absolute inset-0 z-0">
                {deporteImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 bg-cover bg-center transition-all duration-[1500ms] ease-in-out transform ${
                      deporteImgIndex === idx 
                        ? 'opacity-80 scale-105 z-10' 
                        : 'opacity-0 scale-100 z-0'
                    }`}
                    style={{ backgroundImage: `url(${img})` }}
                  />
                ))}
                {/* Lighter Gradient Tint Overlay for better image visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-orange-950/20 to-slate-950/15 z-20" />
              </div>

              <div className="w-16 h-16 bg-white/10 backdrop-blur-md text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/10 border border-white/20 group-hover:scale-110 group-hover:-rotate-3 transition duration-300 relative z-20">
                <Trophy size={30} />
              </div>
              <div className="space-y-3 flex-1 flex flex-col items-center justify-between w-full relative z-20">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest block">Categoría 2</span>
                  <h3 className="font-black text-xl text-white uppercase tracking-tight">Deportes</h3>
                  <p className="text-xs text-slate-200/90 font-bold leading-normal max-w-xs">Campeonatos, torneos, competencias deportivas y juegos GP.</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedCategoryView('DEPORTE'); }} 
                  className="w-full mt-2 py-3 px-6 bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-black uppercase rounded-2xl shadow-md group-hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Ver Eventos Deportivos <ArrowRight size={14} className="group-hover:translate-x-1 transition duration-200" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-1 text-xs font-black text-blue-600 uppercase tracking-widest animate-pulse">
          Sincronizando registros activos ALIVE...
        </div>
      )}

      {selectedCategoryView !== 'ALL' && (
        <div className="relative rounded-[2.5rem] p-5 sm:p-8 border bg-white/50 dark:bg-slate-900/10 backdrop-blur-2xl shadow-xl min-h-[600px] flex flex-col gap-6" style={{ borderColor: selectedCategoryView === 'RECREATIVO' ? 'rgba(129,140,248,0.25)' : 'rgba(251,146,60,0.25)', boxShadow: selectedCategoryView === 'RECREATIVO' ? '0 15px 35px -10px rgba(129,140,248,0.08)' : '0 15px 35px -10px rgba(251,146,60,0.08)' }}>
          {/* Top Image Carousel Banner */}
          <div className="relative w-full h-48 sm:h-60 rounded-3xl overflow-hidden shadow-md border border-slate-200/50 bg-slate-100 shrink-0">
            {selectedCategoryView === 'RECREATIVO' ? (
              recreativoImages.map((img, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 bg-cover bg-center transition-all duration-[1500ms] ease-in-out transform ${
                    recreativoImgIndex === idx ? 'opacity-90 scale-100 z-10' : 'opacity-0 scale-95 z-0'
                  }`}
                  style={{ backgroundImage: `url(${img})` }}
                />
              ))
            ) : (
              deporteImages.map((img, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 bg-cover bg-center transition-all duration-[1500ms] ease-in-out transform ${
                    deporteImgIndex === idx ? 'opacity-90 scale-100 z-10' : 'opacity-0 scale-95 z-0'
                  }`}
                  style={{ backgroundImage: `url(${img})` }}
                />
              ))
            )}
            {/* Lighter Gradient Tint Overlay on Banner */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20 z-20" />
            
            {/* Content overlay on the banner */}
            <div className="absolute inset-0 z-30 flex flex-col justify-end p-6 text-white">
              <div className="space-y-1">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider border border-white/25">
                  {selectedCategoryView === 'RECREATIVO' ? 'Categoría 1' : 'Categoría 2'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-2">
                  {selectedCategoryView === 'RECREATIVO' ? 'Eventos Recreativos' : 'Deportes'}
                </h2>
                <p className="text-xs text-slate-200/90 font-bold max-w-md mt-0.5">
                  {selectedCategoryView === 'RECREATIVO' 
                    ? 'Convocatorias de integración, campamentos, confraternizaciones y más.' 
                    : 'Torneos, campeonatos, competencias deportivas y juegos GP.'}
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-30 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* ==================== RECREATIVO VIEW ==================== */}
            {selectedCategoryView === 'RECREATIVO' && (
              <>
                {/* Left Column: Events List */}
                <div className="lg:col-span-8 bg-gradient-to-br from-white/90 via-slate-50/80 to-indigo-50/15 dark:from-slate-900/90 dark:via-slate-900/95 dark:to-indigo-950/40 backdrop-blur-2xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-indigo-200/80 dark:border-slate-800 shadow-xl shadow-indigo-500/5 flex flex-col gap-4 sm:gap-5 relative overflow-hidden">
                  {/* Top accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-t-3xl" />
                  <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2.5 pb-3 sm:pb-4 pt-1 border-b border-indigo-100/50 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0"><Users size={18} className="sm:w-5 sm:h-5" /></div>
                      <div className="min-w-0">
                        <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-wide truncate">Convocatorias</h2>
                        <p className="text-[9px] sm:text-[10px] text-indigo-600/90 dark:text-indigo-400 font-bold uppercase tracking-wider mt-0.5 truncate">Lista de eventos registrados</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full xs:w-auto justify-end shrink-0">
                      <button 
                        onClick={() => setSelectedCategoryView('ALL')} 
                        className="px-3 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-200 bg-white/50 dark:bg-slate-800/80 hover:bg-white/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase tracking-wider transition duration-200 flex items-center gap-1 cursor-pointer backdrop-blur-sm shadow-sm"
                      >
                        ← Volver
                      </button>
                      {userCanManageEvents && (
                        <button 
                          onClick={() => openCreateModal('RECREATIVO')} 
                          className="py-2 sm:py-2.5 px-3.5 sm:px-5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-[10px] sm:text-xs font-black rounded-xl shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Plus size={14} /> Convocar
                        </button>
                      )}
                    </div>
                  </div>

                <div className="grid grid-cols-3 gap-1 bg-slate-200/60 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-300/60 dark:border-slate-700/80 shadow-inner w-full">
                  {(['Próximos', 'En Curso', 'Finalizados'] as const).map(tab => {
                    const count = filterEvents('RECREATIVO', tab).length;
                    const isActive = activeTabRecreativos === tab;
                    return (
                      <button 
                        key={tab} 
                        onClick={() => setActiveTabRecreativos(tab)} 
                        className={`w-full text-center text-[10px] sm:text-xs py-2 sm:py-2.5 px-1 rounded-xl font-black uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
                          isActive 
                            ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        <span className="truncate">{tab}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black transition-all shrink-0 ${
                          isActive 
                            ? 'bg-white/20 text-white border border-white/30' 
                            : 'bg-slate-300/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {filterEvents('RECREATIVO', activeTabRecreativos).map(ev => (
                    <div key={ev.id} className="border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700/60 hover:bg-white/90 dark:hover:bg-slate-900 hover:shadow-indigo-500/10 hover:shadow-lg transition-all duration-300 relative group flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-32 h-44 sm:h-32 rounded-2xl shrink-0 overflow-hidden relative shadow-md border border-slate-200/60 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-950/40">
                        {ev.imageUrl ? (
                           <img src={`${backendBase}${ev.imageUrl}`} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-violet-700 flex flex-col items-center justify-center text-white">
                            <Calendar size={26} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-3 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60 rounded-lg">{ev.typeTag || 'Actividad'}</span>
                            {userCanManageEvents && (
                              <div className="relative">
                                <button onClick={() => setActiveMenuId(activeMenuId === ev.id ? null : ev.id)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"><MoreVertical size={16} /></button>
                                {activeMenuId === ev.id && (
                                  <div className="absolute right-0 top-7 bg-white dark:bg-slate-900 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1.5 w-28 z-40 font-bold">
                                    <button type="button" onClick={() => openEditModal(ev)} className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition"><Edit2 size={13} /> Editar</button>
                                    <button type="button" onClick={() => triggerDeleteConfirm(ev.id)} className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition"><Trash2 size={13} /> Eliminar</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight leading-tight">{ev.title}</h3>
                          <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed mt-1.5">{ev.description || 'Sin descripción adicional en la convocatoria.'}</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wide">
                          <span className="whitespace-nowrap inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl shadow-2xs">
                            <CalendarDays size={13} className="text-indigo-500 shrink-0" />
                            <span>{ev.startDate}</span>
                          </span>
                          <span className="whitespace-nowrap inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl shadow-2xs max-w-full truncate">
                            <MapPin size={13} className="text-indigo-500 shrink-0" />
                            <span className="truncate">{ev.location}</span>
                          </span>
                          {ev.pdfUrl && (
                            <a href={`${backendBase}${ev.pdfUrl}`} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap inline-flex items-center gap-1.5 text-white bg-gradient-to-r from-rose-500 to-red-600 border border-rose-400/30 shadow-md shadow-rose-500/20 px-2.5 py-1 rounded-xl font-black text-[10px] sm:text-xs hover:scale-105 active:scale-95 transition-all duration-200">
                              <FileText size={13} className="shrink-0" /> PDF Adjunto
                            </a>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-3 border-t border-slate-200 dark:border-slate-800 gap-2">
                          <button
                            type="button"
                            onClick={() => openAdminDetailModal(ev)}
                            title="Ver información del evento y lista de grupos inscritos / no inscritos con sus integrantes"
                            className="w-full sm:w-auto text-[10px] sm:text-xs text-indigo-700 dark:text-indigo-300 font-black uppercase bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-sm"
                          >
                            <Users size={14} className="text-indigo-500" /> Inscritos: {ev.participations?.length || 0} / {ev.maxSpots} GP
                            <Eye size={12} className="ml-0.5 text-indigo-400" />
                          </button>
                          {(() => {
                            const groupParticipation = myParticipations.find((p: any) => p.eventId === ev.id);
                            if (groupParticipation) {
                              return (
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                                  <button onClick={() => openEventInfoModal(ev)} className="flex-1 min-w-[70px] sm:flex-initial py-2 px-2.5 sm:px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[10px] sm:text-xs font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer">
                                    <Info size={13} className="text-indigo-500" /> Info
                                  </button>
                                  <span className="flex-1 min-w-[75px] sm:flex-initial text-[10px] sm:text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/60 px-2 py-2 rounded-xl flex items-center justify-center gap-1"><CheckCircle2 size={13} /> INSCRITO</span>
                                  {canManageAttendance && (
                                    <button onClick={() => openAttendanceModal(ev, groupParticipation)} className="flex-1 min-w-[80px] sm:flex-initial py-2 px-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-[10px] sm:text-xs font-black rounded-xl hover:shadow-lg hover:shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer shadow-md">
                                      <Check size={13} /> Asistencia
                                    </button>
                                  )}
                                  {canCancelParticipation && (
                                    <button onClick={() => handleLeave(ev.id)} className="flex-1 min-w-[70px] sm:flex-initial py-2 px-2.5 sm:px-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/60 text-[10px] sm:text-xs font-black rounded-xl hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer"><X size={13} /> Cancelar</button>
                                  )}
                                </div>
                              );
                            }
                            return (
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button onClick={() => openEventInfoModal(ev)} className="flex-1 sm:flex-initial py-2 px-3.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 text-[10px] sm:text-xs font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer">
                                  <Info size={14} className="text-indigo-500" /> Ver Información
                                </button>
                                {ev.status === 'Abierto' && canRegisterGroup && (
                                  <button onClick={() => handleJoin(ev)} className="flex-1 sm:flex-initial py-2 px-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"><Plus size={15} /> Participar</button>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Admin View: Preview chips of registered GP names */}
                        {userCanManageEvents && ev.participations && ev.participations.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Building2 size={11} className="text-indigo-500" /> GP Inscritos:
                            </span>
                            {ev.participations.map((p: any) => (
                              <span key={p.id} className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60 rounded-md">
                                {p.groupSmall?.name || 'GP Registrado'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {filterEvents('RECREATIVO', activeTabRecreativos).length === 0 && (
                    <div className="text-center py-16 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">No hay convocatorias vigentes.</div>
                  )}
                </div>
              </div>

              {/* Right Column: Active Registrations */}
              <div className="lg:col-span-4 bg-gradient-to-br from-white/90 via-slate-50/80 to-violet-50/15 dark:from-slate-900/90 dark:via-slate-900/95 dark:to-violet-950/40 backdrop-blur-2xl p-6 rounded-3xl border border-violet-200/80 dark:border-slate-800 shadow-xl shadow-violet-500/5 flex flex-col gap-5 relative overflow-hidden">
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-t-3xl" />
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-11 h-11 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0"><CheckCircle2 size={20} /></div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wide">
                      Mi Participación
                    </h3>
                    <p className="text-[10px] text-violet-600/90 dark:text-violet-400 font-bold uppercase tracking-wider mt-0.5">Eventos recreativos de tu grupo pequeño</p>
                  </div>
                </div>
                
                <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                  {userIsAdmin ? (
                    <div className="p-6 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-center space-y-3 shadow-sm">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-400/20">
                        <Building2 size={24} />
                      </div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                        Modo Administrador
                      </h4>
                    </div>
                  ) : (
                    <>
                      {myParticipations.filter(p => p.event?.category === 'RECREATIVO').map(part => (
                        <div key={part.id} className="p-4 bg-white/70 dark:bg-slate-900/90 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col gap-3 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-white dark:hover:bg-slate-900 shadow-sm transition-all duration-300">
                          <div>
                            <div className="flex justify-between items-start mb-1.5">
                              <span className="inline-block text-[10px] font-black uppercase px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60 rounded-lg tracking-wider">{part.event?.typeTag || 'Actividad'}</span>
                              <span className="text-[10px] font-black uppercase px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/60 rounded-lg flex items-center gap-1 shrink-0"><CheckCircle2 size={12}/> {part.status}</span>
                            </div>
                            <h4 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-tight leading-snug">{part.event?.title}</h4>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 px-3 py-1.5 rounded-xl">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            ¡Tu Grupo Pequeño está participando en esta convocatoria!
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-slate-700 dark:text-slate-200 font-bold border-t border-slate-200 dark:border-slate-800 pt-3">
                            <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg"><CalendarDays size={12} className="text-violet-500" /> {part.event?.startDate}</span>
                            <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg"><MapPin size={12} className="text-violet-500" /> {part.event?.location}</span>
                          </div>
                          <div className="flex justify-end items-center pt-3 border-t border-slate-200 dark:border-slate-800 gap-2">
                            <button 
                              onClick={() => openDetailsModal(part)}
                              className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-300 hover:text-white transition-all border border-indigo-100 dark:border-indigo-800/60 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 duration-200 font-black text-[10px] uppercase tracking-wide"
                              title="Ver Ficha"
                            >
                              <Eye size={14} /> Ver Ficha
                            </button>
                            {canCancelParticipation && (
                              <button 
                                onClick={() => handleLeave(part.eventId)}
                                className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white transition-all border border-rose-100 dark:border-rose-800/60 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 duration-200 font-black text-[10px] uppercase tracking-wide"
                                title="Cancelar Inscripción"
                              >
                                <X size={14} /> Cancelar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {myParticipations.filter(p => p.event?.category === 'RECREATIVO').length === 0 && (
                        <div className="p-6 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/50 dark:from-slate-900/90 dark:via-slate-900 dark:to-indigo-950/40 rounded-2xl border-2 border-dashed border-indigo-200/80 dark:border-slate-800 text-center space-y-3 shadow-sm">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                            <Layers size={24} />
                          </div>
                          <div>
                            <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wide">
                              No estás participando en esta categoría
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                              Tu Grupo Pequeño aún no se ha inscrito en ninguna convocatoria de eventos recreativos.
                            </p>
                          </div>
                          <div className="p-3 bg-white/90 dark:bg-slate-800/90 rounded-xl border border-indigo-100 dark:border-slate-700 text-[10px] text-indigo-700 dark:text-indigo-300 font-bold leading-normal text-left">
                            {canRegisterGroup ? (
                              <span>👉 <strong>Líder / Secretario:</strong> Puedes inscribir a tu equipo haciendo clic en el botón <strong>"+ Participar"</strong> en las convocatorias de la izquierda.</span>
                            ) : (
                              <span>👉 <strong>Integrante:</strong> Coordina con el Líder o Secretario de tu GP para que registren la participación de tu grupo.</span>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}

      {/* ==================== DEPORTE VIEW ==================== */}
      {selectedCategoryView === 'DEPORTE' && (
        <>
          {/* Left Column: Events List */}
          <div className="lg:col-span-8 bg-gradient-to-br from-white/90 via-slate-50/80 to-amber-50/15 dark:from-slate-900/90 dark:via-slate-900/95 dark:to-amber-950/40 backdrop-blur-2xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-amber-200/80 dark:border-slate-800 shadow-xl shadow-amber-500/5 flex flex-col gap-4 sm:gap-5 relative overflow-hidden">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-t-3xl" />
            <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2.5 pb-3 sm:pb-4 pt-1 border-b border-orange-100/50 dark:border-slate-800">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-orange-600/20 shrink-0"><Trophy size={18} className="sm:w-5 sm:h-5" /></div>
                    <div className="min-w-0">
                      <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-wide truncate">Convocatorias</h2>
                      <p className="text-[9px] sm:text-[10px] text-orange-600/90 dark:text-orange-400 font-bold uppercase tracking-wider mt-0.5 truncate">Lista de eventos registrados</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full xs:w-auto justify-end shrink-0">
                    <button 
                      onClick={() => setSelectedCategoryView('ALL')} 
                      className="px-3 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-200 bg-white/50 dark:bg-slate-800/80 hover:bg-white/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase tracking-wider transition duration-200 flex items-center gap-1 cursor-pointer backdrop-blur-sm shadow-sm"
                    >
                      ← Volver
                    </button>
                    {userCanManageEvents && (
                      <button 
                        onClick={() => openCreateModal('DEPORTE')} 
                        className="py-2 sm:py-2.5 px-3.5 sm:px-5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-500 hover:via-orange-600 hover:to-rose-600 text-white text-[10px] sm:text-xs font-black rounded-xl shadow-lg shadow-orange-500/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Plus size={14} /> Convocar
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 bg-slate-200/60 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-300/60 dark:border-slate-700/80 shadow-inner w-full">
                  {(['Próximos', 'En Curso', 'Finalizados'] as const).map(tab => {
                    const count = filterEvents('DEPORTE', tab).length;
                    const isActive = activeTabDeportes === tab;
                    return (
                      <button 
                        key={tab} 
                        onClick={() => setActiveTabDeportes(tab)} 
                        className={`w-full text-center text-[10px] sm:text-xs py-2 sm:py-2.5 px-1 rounded-xl font-black uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
                          isActive 
                            ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30 scale-[1.02]' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        <span className="truncate">{tab}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black transition-all shrink-0 ${
                          isActive 
                            ? 'bg-white/20 text-white border border-white/30' 
                            : 'bg-slate-300/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {filterEvents('DEPORTE', activeTabDeportes).map(ev => (
                    <div key={ev.id} className="border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-sm hover:border-orange-300 dark:hover:border-orange-700/60 hover:bg-white/90 dark:hover:bg-slate-900 hover:shadow-orange-500/10 hover:shadow-lg transition-all duration-300 relative group flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-32 h-44 sm:h-32 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden relative shadow-md border border-slate-200/60 dark:border-slate-800 bg-orange-50/50 dark:bg-orange-950/40">
                        {ev.imageUrl ? (
                          <img src={`${backendBase}${ev.imageUrl}`} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex flex-col items-center justify-center text-white">
                            <Trophy size={28} className="opacity-95" />
                            <span className="text-[10px] font-black uppercase tracking-widest mt-1.5 text-white/90">JA MATCH</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-3 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-100 dark:border-orange-800/60 rounded-lg truncate">{ev.typeTag || 'Torneo'}</span>
                            {userCanManageEvents && (
                              <div className="relative">
                                <button onClick={() => setActiveMenuId(activeMenuId === ev.id ? null : ev.id)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"><MoreVertical size={16} /></button>
                                {activeMenuId === ev.id && (
                                  <div className="absolute right-0 top-7 bg-white dark:bg-slate-900 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1.5 w-28 z-40 font-bold">
                                    <button type="button" onClick={() => openEditModal(ev)} className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition"><Edit2 size={13} /> Editar</button>
                                    <button type="button" onClick={() => triggerDeleteConfirm(ev.id)} className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 transition"><Trash2 size={13} /> Eliminar</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight truncate leading-tight">{ev.title}</h3>
                          <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed mt-1.5">{ev.description || 'Sin descripción adicional en la convocatoria.'}</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wide">
                          <span className="whitespace-nowrap inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl shadow-2xs">
                            <CalendarDays size={13} className="text-orange-500 shrink-0" />
                            <span>{ev.startDate}</span>
                          </span>
                          <span className="whitespace-nowrap inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl shadow-2xs max-w-full truncate">
                            <MapPin size={13} className="text-orange-500 shrink-0" />
                            <span className="truncate">{ev.location}</span>
                          </span>
                          {ev.pdfUrl && (
                            <a 
                              href={`${backendBase}${ev.pdfUrl}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="whitespace-nowrap inline-flex items-center gap-1.5 text-white bg-gradient-to-r from-rose-500 to-red-600 border border-rose-400/30 shadow-md shadow-rose-500/20 px-2.5 py-1 rounded-xl font-black text-[10px] sm:text-xs hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                            >
                              <FileText size={13} className="shrink-0" /> PDF Adjunto
                            </a>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-3 border-t border-slate-200 dark:border-slate-800 gap-2.5">
                          <button
                            type="button"
                            onClick={() => openAdminDetailModal(ev)}
                            title="Ver información del evento y lista de grupos inscritos / no inscritos con sus integrantes"
                            className="w-full sm:w-auto text-[10px] sm:text-xs text-orange-700 dark:text-orange-300 font-black uppercase bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/80 border border-orange-200 dark:border-orange-800 px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-sm"
                          >
                            <Users size={14} className="text-orange-500" /> Equipos: {ev.participations?.length || 0} / {ev.maxSpots} GP
                            <Eye size={12} className="ml-0.5 text-orange-400" />
                          </button>
                          {(() => {
                            const groupParticipation = myParticipations.find((p: any) => p.eventId === ev.id);
                            if (groupParticipation) {
                              return (
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                                  <button onClick={() => openEventInfoModal(ev)} className="flex-1 sm:flex-initial py-2 px-2.5 sm:px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[10px] sm:text-xs font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer">
                                    <Info size={13} className="text-orange-500" /> Info
                                  </button>
                                  <span className="flex-1 sm:flex-initial text-[10px] sm:text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/60 px-2.5 py-2 rounded-xl flex items-center justify-center gap-1"><CheckCircle2 size={13} /> INSCRITO</span>
                                  {canManageAttendance && (
                                    <button
                                      onClick={() => openAttendanceModal(ev, groupParticipation)}
                                      className="flex-1 sm:flex-initial py-2 px-3 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-[10px] sm:text-xs font-black rounded-xl hover:shadow-lg hover:shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer shadow-md"
                                    >
                                      <Check size={13} /> Asistencia
                                    </button>
                                  )}
                                  {canCancelParticipation && (
                                    <button
                                      onClick={() => handleLeave(ev.id)}
                                      className="flex-1 sm:flex-initial py-2 px-2.5 sm:px-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/60 text-[10px] sm:text-xs font-black rounded-xl hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <X size={13} /> Cancelar
                                    </button>
                                  )}
                                </div>
                              );
                            }
                            return (
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button onClick={() => openEventInfoModal(ev)} className="flex-1 sm:flex-initial py-2 px-3.5 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/80 border border-orange-200 dark:border-orange-800 text-[10px] sm:text-xs font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer">
                                  <Info size={14} className="text-orange-500" /> Ver Información
                                </button>
                                {ev.status === 'Abierto' && canRegisterGroup && (
                                  <button 
                                    onClick={() => handleJoin(ev)} 
                                    className="py-2 px-5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Plus size={16} /> Participar
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Admin View: Preview chips of registered GP names */}
                        {userCanManageEvents && ev.participations && ev.participations.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Building2 size={11} className="text-orange-500" /> GP Inscritos:
                            </span>
                            {ev.participations.map((p: any) => (
                              <span key={p.id} className="text-[10px] font-black px-2 py-0.5 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-100 dark:border-orange-800/60 rounded-md">
                                {p.groupSmall?.name || 'GP Registrado'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {filterEvents('DEPORTE', activeTabDeportes).length === 0 && (
                    <div className="text-center py-16 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">No hay convocatorias vigentes.</div>
                  )}
                </div>
              </div>

              {/* Right Column: Active Registrations */}
              <div className="lg:col-span-4 bg-gradient-to-br from-white/90 via-slate-50/80 to-rose-50/15 dark:from-slate-900/90 dark:via-slate-900/95 dark:to-rose-950/40 backdrop-blur-2xl p-6 rounded-3xl border border-rose-200/80 dark:border-slate-800 shadow-xl shadow-rose-500/5 flex flex-col gap-5 relative overflow-hidden">
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-500 rounded-t-3xl" />
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-11 h-11 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-orange-600/20 shrink-0"><Trophy size={20} /></div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wide">
                      Mi Participación
                    </h3>
                    <p className="text-[10px] text-orange-600/90 dark:text-orange-400 font-bold uppercase tracking-wider mt-0.5">Competencias de tu grupo pequeño</p>
                  </div>
                </div>
                
                <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                  {userIsAdmin ? (
                    <div className="p-6 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-center space-y-3 shadow-sm">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-400/20">
                        <Building2 size={24} />
                      </div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                        Modo Administrador
                      </h4>
                    </div>
                  ) : (
                    <>
                      {myParticipations.filter(p => p.event?.category === 'DEPORTE').map(part => (
                        <div key={part.id} className="p-4 bg-white/70 dark:bg-slate-900/90 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col gap-3 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-white dark:hover:bg-slate-900 shadow-sm transition-all duration-300">
                          <div>
                            <div className="flex justify-between items-start mb-1.5">
                              <span className="inline-block text-[10px] font-black uppercase px-2.5 py-1 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-100 dark:border-orange-800/60 rounded-lg tracking-wider">{part.event?.typeTag || 'Torneo'}</span>
                              <span className="text-[10px] font-black uppercase px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/60 rounded-lg flex items-center gap-1 shrink-0"><CheckCircle2 size={12}/> {part.status}</span>
                            </div>
                            <h4 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-tight leading-snug">{part.event?.title}</h4>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 px-3 py-1.5 rounded-xl">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            ¡Tu Grupo Pequeño está participando en este torneo!
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-slate-700 dark:text-slate-200 font-bold border-t border-slate-200 dark:border-slate-800 pt-3">
                            <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg"><CalendarDays size={12} className="text-orange-500" /> {part.event?.startDate}</span>
                            <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg"><MapPin size={12} className="text-orange-500" /> {part.event?.location}</span>
                          </div>
                          <div className="flex justify-end items-center pt-3 border-t border-slate-200 dark:border-slate-800 gap-2">
                            <button 
                              onClick={() => openDetailsModal(part)}
                              className="px-4 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-500 text-orange-600 dark:text-orange-300 hover:text-white transition-all border border-orange-100 dark:border-orange-800/60 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 duration-200 font-black text-[10px] uppercase tracking-wide"
                              title="Ver Ficha"
                            >
                              <Eye size={14} /> Ver Ficha
                            </button>
                            {canCancelParticipation && (
                              <button 
                                onClick={() => handleLeave(part.eventId)}
                                className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white transition-all border border-rose-100 dark:border-rose-800/60 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 duration-200 font-black text-[10px] uppercase tracking-wide"
                                title="Cancelar Inscripción"
                              >
                                <X size={14} /> Cancelar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {myParticipations.filter(p => p.event?.category === 'DEPORTE').length === 0 && (
                        <div className="p-6 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 dark:from-slate-900/90 dark:via-slate-900 dark:to-orange-950/40 rounded-2xl border-2 border-dashed border-orange-200/80 dark:border-slate-800 text-center space-y-3 shadow-sm">
                          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto shadow-inner">
                            <Trophy size={24} />
                          </div>
                          <div>
                            <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wide">
                              No estás participando en esta categoría
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                              Tu Grupo Pequeño aún no se ha inscrito en ninguna convocatoria de eventos deportivos.
                            </p>
                          </div>
                          <div className="p-3 bg-white/90 dark:bg-slate-800/90 rounded-xl border border-orange-100 dark:border-slate-700 text-[10px] text-orange-700 dark:text-orange-300 font-bold leading-normal text-left">
                            {canRegisterGroup ? (
                              <span>👉 <strong>Líder / Secretario:</strong> Puedes inscribir a tu equipo haciendo clic en el botón <strong>"+ Participar"</strong> en las convocatorias de la izquierda.</span>
                            ) : (
                              <span>👉 <strong>Integrante:</strong> Coordina con el Líder o Secretario de tu GP para que registren la participación de tu grupo.</span>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )}

      {/* MODALS AREA */}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="p-[1.5px] bg-gradient-to-br from-rose-500 to-orange-450 rounded-[28px] max-w-sm w-full shadow-2xl shadow-rose-950/10 overflow-hidden transform scale-100 transition-all duration-200">
            <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 rounded-[27px] p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center border border-rose-200/60 dark:border-rose-800/60 shadow-inner">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">¿Eliminar Convocatoria?</h3>
                <p className="text-xs text-slate-650 dark:text-slate-300 font-bold leading-relaxed">
                  ¿Estás completamente seguro de que deseas eliminar permanentemente esta convocatoria? Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsDeleteModalOpen(false); setEventIdToDelete(null); }}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer animate-press"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-red-650 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-rose-600/10 cursor-pointer animate-press"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLeaveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="p-[1.5px] bg-gradient-to-br from-rose-500 to-orange-450 rounded-[28px] max-w-sm w-full shadow-2xl shadow-rose-950/10 overflow-hidden transform scale-100 transition-all duration-200">
            <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 rounded-[27px] p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center border border-rose-200/60 dark:border-rose-800/60 shadow-inner">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">¿Cancelar Participación?</h3>
                <p className="text-xs text-slate-650 dark:text-slate-300 font-bold leading-relaxed">
                  ¿Estás seguro de que deseas cancelar la participación de tu grupo en este evento? Se perderán las asistencias registradas.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsLeaveModalOpen(false); setEventIdToLeave(null); }}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer animate-press"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executeLeave}
                  className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-red-650 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md shadow-rose-600/10 cursor-pointer animate-press"
                >
                  Sí, Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDetailsModalOpen && selectedDetails && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="p-[1.5px] bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 rounded-[26px] max-w-md w-full shadow-2xl shadow-indigo-950/10 overflow-hidden transform transition-all duration-300">
            <div className="bg-gradient-to-br from-slate-50 via-white to-indigo-50/10 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 rounded-[25px] overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 via-violet-650 to-fuchsia-600 p-5 text-white flex justify-between items-center relative overflow-hidden shadow-sm">
                <div className="absolute inset-0 bg-white/5 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                <div className="flex items-center gap-2 relative z-10">
                  <Info size={18} />
                  <h3 className="font-black text-sm uppercase tracking-wider">Ficha Técnica de Participación</h3>
                </div>
                <button onClick={() => setIsDetailsModalOpen(false)} className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors relative z-10"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60 rounded-md">{selectedDetails.event?.category}</span>
                  <h2 className="text-base font-black text-slate-900 dark:text-white mt-1">{selectedDetails.event?.title}</h2>
                </div>
                {selectedDetails.event?.imageUrl && (
                  <div className="w-full h-36 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                    <img src={`${backendBase}${selectedDetails.event.imageUrl}`} className="w-full h-full object-cover" alt="Vista previa de portada" />
                  </div>
                )}
                <div className="bg-indigo-50/30 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-800/40 rounded-xl p-3 text-slate-700 dark:text-slate-200 font-bold leading-relaxed">
                  {selectedDetails.event?.description || "Este evento no cuenta con una descripción extendida registrada en la convocatoria."}
                </div>
                <div className="grid grid-cols-2 gap-3 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-3 font-bold text-slate-650 dark:text-slate-300 shadow-sm">
                  <div className="space-y-1 border-r border-slate-200/80 dark:border-slate-700/80 pr-2">
                    <p className="text-[9px] text-slate-400 dark:text-slate-400 uppercase font-black">Fecha y Jornada</p>
                    <p className="font-black flex items-center gap-1 text-slate-700 dark:text-slate-200"><CalendarDays size={13} className="text-indigo-500" /> {selectedDetails.event?.startDate}</p>
                  </div>
                  <div className="space-y-1 pl-1">
                    <p className="text-[9px] text-slate-400 dark:text-slate-400 uppercase font-black">Hora Programada</p>
                    <p className="font-black flex items-center gap-1 text-slate-700 dark:text-slate-200"><Clock size={13} className="text-indigo-500" /> {selectedDetails.event?.timeSlot || 'Por definir'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-3 font-bold text-slate-650 dark:text-slate-300 shadow-sm">
                  <div className="space-y-1 border-r border-slate-200/80 dark:border-slate-700/80 pr-2">
                    <p className="text-[9px] text-slate-400 dark:text-slate-400 uppercase font-black">Ubicación / Sede</p>
                    <p className="font-black flex items-center gap-1 text-slate-700 dark:text-slate-200"><MapPin size={13} className="text-indigo-500" /> {selectedDetails.event?.location}</p>
                  </div>
                  <div className="space-y-1 pl-1">
                    <p className="text-[9px] text-slate-400 dark:text-slate-400 uppercase font-black">Grupo Registrado</p>
                    <p className="font-black flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><Check size={13} /> {selectedDetails.groupSmall?.name}</p>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button type="button" onClick={() => setIsDetailsModalOpen(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/60 animate-press">Cerrar Ficha</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {notification.isOpen && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-4 flex items-start gap-3.5 animate-slideUp">
          <div className={`p-2 rounded-xl shrink-0 ${notification.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'}`}>
            {notification.type === 'success' ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{notification.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(prev => ({ ...prev, isOpen: false }))} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={15} /></button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn overflow-y-auto">
          <div className="p-[1px] bg-gradient-to-b from-indigo-500/30 via-slate-700/50 to-slate-800/80 rounded-2xl sm:rounded-[28px] max-w-lg w-full my-auto shadow-2xl shadow-slate-950/80 overflow-hidden transform transition-all duration-300 max-h-[90vh] flex flex-col">
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[26px] overflow-hidden flex flex-col flex-1 min-h-0">
              {/* Header Ejecutivo Profesional */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white flex justify-between items-center relative overflow-hidden border-b border-indigo-500/20 shadow-xl shrink-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.18),transparent_65%)] pointer-events-none" />
                <div className="flex items-center gap-3.5 relative z-10 min-w-0">
                  <div className="p-2 sm:p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-400/20 backdrop-blur-md shadow-inner text-indigo-400 shrink-0">
                    <Edit2 size={18} className="text-indigo-400 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-sm sm:text-base text-white tracking-tight uppercase truncate">{editingEvent ? 'Configurar Convocatoria' : 'Nueva Convocatoria'}</h3>
                    <p className="text-[9px] sm:text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-0.5 truncate">Formulario de registro ALIVE</p>
                  </div>
                </div>
                <button type="button" onClick={() => { setIsModalOpen(false); setIsDatePickerOpen(false); }} className="text-slate-400 hover:text-white p-1.5 sm:p-2 rounded-2xl hover:bg-white/10 backdrop-blur-sm transition-all cursor-pointer relative z-10 shrink-0"><X size={18} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 text-xs bg-transparent overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Título de la Convocatoria</label>
                  <input type="text" required value={formFields.title} onChange={(e) => setFormFields({ ...formFields, title: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 px-3.5 py-2.5 rounded-xl font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 shadow-sm" placeholder="Ej. Retiro Espiritual" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Descripción / Detalles</label>
                  <textarea rows={2} value={formFields.description} onChange={(e) => setFormFields({ ...formFields, description: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 px-3.5 py-2.5 rounded-xl font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 shadow-sm" placeholder="Detalles de la convocatoria..." />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Custom Visual DatePicker (Calendar) */}
                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                      <CalendarDays size={12} className="text-indigo-500" /> Fecha del Evento
                    </label>
                    <button 
                      type="button"
                      onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 px-3.5 py-2.5 rounded-xl font-bold text-slate-900 dark:text-white flex items-center justify-between text-left cursor-pointer transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                    >
                      <span className="flex items-center gap-2">
                        <Calendar size={14} className="text-indigo-500" />
                        {formFields.startDate ? (
                          <span className="font-black text-indigo-600 dark:text-indigo-400">{formFields.startDate}</span>
                        ) : (
                          <span className="text-slate-400 font-medium">Seleccionar fecha...</span>
                        )}
                      </span>
                      <span className="text-slate-400 text-[10px]">📅</span>
                    </button>

                    {/* Custom Floating Popover Calendar */}
                    {isDatePickerOpen && (
                      <div className="absolute left-0 top-full mt-2 z-50 bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 w-72 backdrop-blur-xl animate-fadeIn font-sans">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
                              else { setCalMonth(calMonth - 1); }
                            }}
                            className="p-1.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 transition"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                            {MONTH_NAMES_ES[calMonth]} {calYear}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
                              else { setCalMonth(calMonth + 1); }
                            }}
                            className="p-1.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 transition"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                          {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map(d => (
                            <span key={d} className="text-[10px] font-black text-indigo-500 uppercase">{d}</span>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center">
                          {Array.from({ length: new Date(calYear, calMonth, 1).getDay() }).map((_, i) => (
                            <div key={`pad-${i}`} className="w-8 h-8" />
                          ))}
                          {Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, i) => {
                            const dayNum = i + 1;
                            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                            const isSelected = formFields.startDate === dateStr;
                            const isToday = new Date().toISOString().split('T')[0] === dateStr;

                            return (
                              <button
                                key={dayNum}
                                type="button"
                                onClick={() => {
                                  setFormFields(prev => ({ ...prev, startDate: dateStr }));
                                  setIsDatePickerOpen(false);
                                }}
                                className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-indigo-500 via-purple-600 to-violet-600 text-white shadow-md shadow-purple-500/30 scale-105 font-black'
                                    : isToday
                                    ? 'border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-black'
                                    : 'text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600'
                                }`}
                              >
                                {dayNum}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 text-[10px] font-black">
                          <button
                            type="button"
                            onClick={() => {
                              setFormFields(prev => ({ ...prev, startDate: '' }));
                              setIsDatePickerOpen(false);
                            }}
                            className="text-rose-500 hover:underline uppercase"
                          >
                            Limpiar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const todayStr = new Date().toISOString().split('T')[0];
                              setFormFields(prev => ({ ...prev, startDate: todayStr }));
                              setIsDatePickerOpen(false);
                            }}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline uppercase"
                          >
                            Hoy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                      <MapPin size={12} className="text-indigo-500" /> Sede / Ubicación
                    </label>
                    <input type="text" value={formFields.location} onChange={(e) => setFormFields({ ...formFields, location: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 px-3.5 py-2.5 rounded-xl font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 shadow-sm" placeholder="Lugar del evento" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                      <Clock size={12} className="text-indigo-500" /> Hora del Evento
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 px-3.5 py-2.5 rounded-xl font-bold text-slate-900 dark:text-white flex items-center justify-between text-left cursor-pointer transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                    >
                      <span className="flex items-center gap-2">
                        <Clock size={14} className="text-indigo-500" />
                        <span className={formFields.timeSlot ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400 font-normal'}>
                          {formFields.timeSlot || 'Seleccionar hora...'}
                        </span>
                      </span>
                      <span className="text-slate-400 text-[10px]">▼</span>
                    </button>

                    {isTimePickerOpen && (
                      <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 rounded-2xl p-4 shadow-2xl z-50 animate-fadeIn space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1">
                            <Clock size={13} className="text-indigo-500" /> Horario del Evento
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsTimePickerOpen(false)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Horarios Frecuentes Presets */}
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Horarios Sugeridos</p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {['09:00 AM', '10:30 AM', '03:00 PM', '06:30 PM', '07:30 PM', '08:00 PM'].map(timePreset => (
                              <button
                                key={timePreset}
                                type="button"
                                onClick={() => {
                                  setFormFields(prev => ({ ...prev, timeSlot: timePreset }));
                                  setIsTimePickerOpen(false);
                                }}
                                className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                                  formFields.timeSlot === timePreset
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600'
                                }`}
                              >
                                {timePreset}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Manual Time Selector (Hora : Minuto) */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Personalizado (Hora : Minuto)</p>
                          <div className="flex items-center gap-2">
                            <select
                              value={formFields.timeSlot && formFields.timeSlot.includes(':') ? formFields.timeSlot.split(':')[0] : '19'}
                              onChange={(e) => {
                                const currentMin = formFields.timeSlot && formFields.timeSlot.includes(':') ? formFields.timeSlot.split(':')[1] : '30';
                                setFormFields(prev => ({ ...prev, timeSlot: `${e.target.value}:${currentMin}` }));
                              }}
                              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                            >
                              {Array.from({ length: 24 }, (_, i) => {
                                const h = String(i).padStart(2, '0');
                                return <option key={h} value={h}>{h}:00 h ({i > 12 ? `${i-12} PM` : i === 12 ? '12 PM' : i === 0 ? '12 AM' : `${i} AM`})</option>;
                              })}
                            </select>

                            <span className="font-black text-slate-400">:</span>

                            <select
                              value={formFields.timeSlot && formFields.timeSlot.includes(':') ? formFields.timeSlot.split(':')[1] : '30'}
                              onChange={(e) => {
                                const currentHour = formFields.timeSlot && formFields.timeSlot.includes(':') ? formFields.timeSlot.split(':')[0] : '19';
                                setFormFields(prev => ({ ...prev, timeSlot: `${currentHour}:${e.target.value}` }));
                              }}
                              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                            >
                              {['00', '15', '30', '45'].map(m => (
                                <option key={m} value={m}>{m} min</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Manual text input option */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <input
                            type="text"
                            placeholder="Escribir hora libre (Ej: 19:30)..."
                            value={formFields.timeSlot}
                            onChange={(e) => setFormFields(prev => ({ ...prev, timeSlot: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsTimePickerOpen(false)}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition"
                        >
                          Confirmar Hora
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                      <Layers size={12} className="text-indigo-500" /> Etiqueta Visual
                    </label>
                    <input type="text" placeholder="e.g. Campamento" value={formFields.typeTag} onChange={(e) => setFormFields({ ...formFields, typeTag: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 px-3.5 py-2.5 rounded-xl font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 shadow-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                      <Users size={12} className="text-indigo-500" /> Cupo Máximo
                    </label>
                    <input type="number" value={formFields.maxSpots} onChange={(e) => setFormFields({ ...formFields, maxSpots: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 px-3.5 py-2.5 rounded-xl font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 shadow-sm" />
                  </div>
                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                      <Info size={12} className="text-indigo-500" /> Estado Operativo
                    </label>
                    <button 
                      type="button"
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 px-3.5 py-2.5 rounded-xl font-bold text-slate-900 dark:text-white flex items-center justify-between text-left cursor-pointer transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          formFields.status === 'Abierto' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' :
                          formFields.status === 'En Curso' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]'
                        }`} />
                        {formFields.status}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[9px]">▼</span>
                    </button>
                    
                    {isStatusDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1 z-50 animate-fadeIn font-bold backdrop-blur-xl">
                        {(['Abierto', 'En Curso', 'Finalizado'] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setFormFields({ ...formFields, status: opt });
                              setIsStatusDropdownOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 transition-colors"
                          >
                            <span className={`w-2 h-2 rounded-full ${
                              opt === 'Abierto' ? 'bg-emerald-400' :
                              opt === 'En Curso' ? 'bg-amber-400' : 'bg-rose-400'
                            }`} />
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              {/* ARCHIVOS Y DOCUMENTOS PRE-CARGADOS */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 mt-2">
                <div className="space-y-1 flex flex-col justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                    <Upload size={12} className="text-indigo-500" /> Imagen Cover
                  </label>
                  {formFields.imageUrl ? (
                    <div className="relative w-full h-28 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none group">
                      <img src={`${backendBase}${formFields.imageUrl}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Vista previa" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          type="button" 
                          onClick={() => setFormFields(prev => ({ ...prev, imageUrl: '' }))}
                          className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-500 cursor-pointer shadow-lg transform hover:scale-110 transition-all"
                          title="Quitar imagen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-28 border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-400 rounded-xl flex flex-col items-center justify-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all cursor-pointer group">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload size={14} className="text-indigo-500" />
                      </div>
                      Subir Imagen
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>

                <div className="space-y-1 flex flex-col justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                    <FileText size={12} className="text-indigo-500" /> PDF Informativo
                  </label>
                  {formFields.pdfUrl ? (
                    <div className="relative w-full h-28 rounded-2xl border border-rose-200 dark:border-rose-900 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/40 dark:to-slate-900 flex flex-col items-center justify-center p-3 text-center shadow-lg shadow-rose-100/50 dark:shadow-none group overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center mb-2">
                        <FileText size={18} className="text-rose-500" />
                      </div>
                      <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest w-full truncate">PDF Listo</span>
                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <button 
                          type="button" 
                          onClick={() => setFormFields(prev => ({ ...prev, pdfUrl: '' }))}
                          className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-500 cursor-pointer shadow-lg transform hover:scale-110 transition-all flex items-center gap-1 text-[10px] font-bold"
                          title="Quitar PDF"
                        >
                          <Trash2 size={12} /> Quitar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-28 border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-400 rounded-xl flex flex-col items-center justify-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all cursor-pointer group">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText size={14} className="text-indigo-500" />
                      </div>
                      Subir PDF
                      <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 rounded-xl font-black uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer animate-press">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-black uppercase tracking-wider hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer animate-press">
                  <Check size={16} /> {editingEvent ? 'Guardar Cambios' : 'Crear Convocatoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}

      {isAttendanceModalOpen && selectedAttendanceEvent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="p-[2px] bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 rounded-[28px] max-w-lg w-full shadow-2xl shadow-indigo-950/30 overflow-hidden transform transition-all duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[26px] overflow-hidden">

              {/* ── Header ── */}
              <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 p-5 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/15 rounded-xl border border-white/20 backdrop-blur-sm shrink-0">
                      <Users size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] text-indigo-200 font-black uppercase tracking-widest">
                        {selectedAttendanceEvent.category === 'RECREATIVO' ? '🎉 Evento Recreativo' : '🏆 Evento Deportivo'}
                      </p>
                      <h3 className="font-black text-sm text-white leading-tight mt-0.5">{selectedAttendanceEvent.title}</h3>
                      <p className="text-[10px] text-indigo-200 font-bold mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block"></span>
                        GP: {groupName || 'Cargando...'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAttendanceModalOpen(false)}
                    className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/15 transition-all cursor-pointer shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Progress bar */}
                {!attendanceLoading && groupMembers.length > 0 && (
                  <div className="mt-4 relative z-10">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] text-indigo-200 font-black uppercase tracking-wider">Confirmados</span>
                      <span className="text-[11px] font-black text-white">
                        {checkedMemberIds.length} <span className="text-indigo-300">/ {groupMembers.length}</span>
                      </span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-500 ease-out shadow-sm"
                        style={{ width: groupMembers.length > 0 ? `${(checkedMemberIds.length / groupMembers.length) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Body ── */}
              <div className="p-5 space-y-4">

                {/* Read-only banner for non-managers */}
                {!canManageAttendance && (
                  <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-3.5">
                    <div className="p-1.5 bg-amber-100 dark:bg-amber-900/60 rounded-lg shrink-0">
                      <Eye size={14} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wide">Vista de Solo Lectura</p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-0.5 leading-relaxed">
                        Solo el Líder, Colíder o Secretario pueden registrar y modificar la lista de participantes.
                      </p>
                    </div>
                  </div>
                )}

                {/* Members list */}
                {attendanceLoading ? (
                  <div className="py-10 text-center">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando integrantes del GP...</p>
                  </div>
                ) : groupMembers.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1">
                      Integrantes del grupo ({groupMembers.length} total)
                    </p>
                    {groupMembers.map((member, idx) => {
                      const isChecked = checkedMemberIds.includes(member.id);
                      const isCurrentUser = Boolean(
                        user && (
                          user.id === member.id ||
                          (user.name && member.name && user.name.trim().toLowerCase() === member.name.trim().toLowerCase())
                        )
                      );

                      const { roleLabel, roleBadgeStyle, roleIcon, avatarGradient } = getGroupRoleBadge(
                        member.groupRole || member.roleInGP || member.role
                      );

                      return (
                        <div
                          key={member.id}
                          onClick={() => canManageAttendance && handleToggleMember(member.id)}
                          style={{ animationDelay: `${idx * 30}ms` }}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all duration-200 ${
                            isChecked
                              ? 'border-emerald-400/80 bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-emerald-50/30 dark:from-emerald-950/50 dark:via-teal-950/40 dark:to-emerald-950/30 shadow-sm'
                              : isCurrentUser
                              ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/30 dark:bg-indigo-950/20'
                              : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-indigo-200 dark:hover:border-indigo-700'
                          } ${canManageAttendance ? 'cursor-pointer hover:scale-[1.01]' : 'cursor-default'}`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Role Avatar */}
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 bg-gradient-to-br ${isChecked ? 'from-emerald-400 to-teal-500' : avatarGradient} text-white shadow-md`}>
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            
                            {/* Member info & Role */}
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-black text-xs text-slate-900 dark:text-white truncate">{member.name}</p>
                                {isCurrentUser && (
                                  <span className="px-2 py-0.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm shrink-0 flex items-center gap-1">
                                    👤 TÚ (Tu Cuenta)
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border ${roleBadgeStyle} flex items-center gap-1 shrink-0`}>
                                  <span>{roleIcon}</span> {roleLabel}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Checkbox / status indicator */}
                          <div className="shrink-0 ml-2">
                            {canManageAttendance ? (
                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                                isChecked
                                  ? 'bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/30'
                                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                              }`}>
                                {isChecked && <Check size={13} className="text-white stroke-[3]" />}
                              </div>
                            ) : (
                              isChecked ? (
                                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center">
                                  <Check size={13} className="text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                  <span className="text-[10px] text-slate-400 font-black">—</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Users size={28} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">No hay integrantes vinculados al GP</p>
                  </div>
                )}

                {/* Footer actions */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                  {canManageAttendance && groupMembers.length > 0 ? (
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wide">
                      {checkedMemberIds.length === groupMembers.length ? '✅ Todos confirmados' : `${groupMembers.length - checkedMemberIds.length} sin confirmar`}
                    </p>
                  ) : <div />}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAttendanceModalOpen(false)}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                    >
                      Cerrar
                    </button>
                    {canManageAttendance && groupMembers.length > 0 && (
                      <button
                        type="button"
                        onClick={saveAttendance}
                        disabled={savingAttendance}
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {savingAttendance ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Check size={14} className="stroke-[3]" /> Guardar Asistencia
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {isAdminGroupsModalOpen && selectedAdminGroupsEvent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="p-[2px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[28px] max-w-lg w-full shadow-2xl shadow-indigo-950/30 overflow-hidden transform transition-all duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[26px] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 p-5 text-white relative overflow-hidden shadow-md">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-white/15 rounded-2xl border border-white/20 backdrop-blur-sm shrink-0">
                      <Building2 size={22} className="text-white" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-indigo-200 uppercase tracking-widest px-2 py-0.5 bg-white/10 rounded-md border border-white/15">
                        {selectedAdminGroupsEvent.category === 'RECREATIVO' ? 'Categoría Recreativa' : 'Categoría Deportiva'}
                      </span>
                      <h3 className="font-black text-base text-white leading-tight mt-1">{selectedAdminGroupsEvent.title}</h3>
                      <p className="text-[11px] text-indigo-200 font-bold mt-0.5">
                        Grupos Pequeños Inscritos ({selectedAdminGroupsEvent.participations?.length || 0} / {selectedAdminGroupsEvent.maxSpots} GP)
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsAdminGroupsModalOpen(false)} className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/15 transition-all cursor-pointer">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Search & Content */}
              <div className="p-5 space-y-4">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar grupo por nombre..."
                    value={adminGroupSearch}
                    onChange={(e) => setAdminGroupSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 shadow-sm"
                  />
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                  {(selectedAdminGroupsEvent.participations || [])
                    .filter((p: any) => (p.groupSmall?.name || '').toLowerCase().includes(adminGroupSearch.toLowerCase()))
                    .map((part: any) => {
                      const confirmedCount = part.confirmedMembers ? part.confirmedMembers.split(',').filter(Boolean).length : 0;
                      return (
                        <div key={part.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-indigo-500/20 shrink-0">
                              {part.groupSmall?.name?.charAt(0).toUpperCase() || 'G'}
                            </div>
                            <div>
                              <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase leading-snug">{(part.groupSmall?.name || 'Grupo Pequeño').toUpperCase()}</h4>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                {part.enrolledAt ? `Inscrito: ${new Date(part.enrolledAt).toLocaleDateString('es-ES')}` : 'Fecha no especificada'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => {
                                setIsAdminGroupsModalOpen(false);
                                openAdminGroupAttendanceModal(selectedAdminGroupsEvent, part);
                              }}
                              className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-[10px] font-black uppercase rounded-xl shadow-sm transition flex items-center gap-1 cursor-pointer"
                              title="Ver / Marcar lista de asistencia del grupo"
                            >
                              <Eye size={12} /> Asistencia ({confirmedCount})
                            </button>
                            {canCancelParticipation && (
                              <button
                                onClick={() => handleAdminCancelGroup(selectedAdminGroupsEvent.id, part.groupId)}
                                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-200 dark:border-rose-800 text-[10px] font-black uppercase rounded-xl transition flex items-center gap-1 cursor-pointer"
                                title="Cancelar la participación de este grupo"
                              >
                                <X size={12} /> Cancelar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  {(!selectedAdminGroupsEvent.participations || selectedAdminGroupsEvent.participations.length === 0) && (
                    <div className="py-10 text-center text-slate-400 dark:text-slate-500 font-bold text-xs">
                      No hay grupos pequeños inscritos en este evento aún.
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => setIsAdminGroupsModalOpen(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 rounded-xl text-xs font-black uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer">
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Informativo Completo del Evento (Para Todos los Usuarios) */}
      {isInfoModalOpen && selectedInfoEvent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="p-[2px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[28px] max-w-lg w-full shadow-2xl shadow-indigo-950/30 overflow-hidden transform transition-all duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[26px] overflow-hidden">
              
              {/* Cover Header Banner */}
              <div className="relative h-44 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 overflow-hidden flex flex-col justify-between p-5 text-white">
                {selectedInfoEvent.imageUrl && (
                  <img
                    src={`${backendBase}${selectedInfoEvent.imageUrl}`}
                    alt={selectedInfoEvent.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                
                {/* Top Badges */}
                <div className="relative z-10 flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg border border-white/20 text-white">
                      {selectedInfoEvent.category === 'RECREATIVO' ? '🎉 Recreativo' : '🏆 Deportivo'}
                    </span>
                    {selectedInfoEvent.typeTag && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-indigo-500/80 backdrop-blur-md rounded-lg text-white">
                        {selectedInfoEvent.typeTag}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setIsInfoModalOpen(false)}
                    className="text-white/80 hover:text-white p-1.5 rounded-xl bg-black/30 hover:bg-black/50 backdrop-blur-md transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Event Title */}
                <div className="relative z-10">
                  <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-md mb-1.5 ${
                    selectedInfoEvent.status === 'Abierto' ? 'bg-emerald-500 text-white' :
                    selectedInfoEvent.status === 'En Curso' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                  }`}>
                    Convocatoria {selectedInfoEvent.status}
                  </span>
                  <h2 className="text-xl font-black text-white leading-tight drop-shadow-md">
                    {selectedInfoEvent.title}
                  </h2>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-6 space-y-4 text-xs">
                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Detalles & Descripción</label>
                  <p className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                    {selectedInfoEvent.description || 'Sin descripción detallada disponible.'}
                  </p>
                </div>

                {/* Technical Specs Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/40 rounded-xl space-y-1">
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-wider flex items-center gap-1">
                      <CalendarDays size={12} /> Fecha Programada
                    </p>
                    <p className="font-black text-sm text-slate-900 dark:text-white">{selectedInfoEvent.startDate}</p>
                  </div>
                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/40 rounded-xl space-y-1">
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-wider flex items-center gap-1">
                      <Clock size={12} /> Horario
                    </p>
                    <p className="font-black text-sm text-slate-900 dark:text-white">{selectedInfoEvent.timeSlot || 'Por definir'}</p>
                  </div>
                  <div className="p-3 bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800/40 rounded-xl space-y-1">
                    <p className="text-[9px] font-black text-purple-500 uppercase tracking-wider flex items-center gap-1">
                      <MapPin size={12} /> Ubicación / Sede
                    </p>
                    <p className="font-black text-sm text-slate-900 dark:text-white truncate">{selectedInfoEvent.location}</p>
                  </div>
                  <div className="p-3 bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800/40 rounded-xl space-y-1">
                    <p className="text-[9px] font-black text-purple-500 uppercase tracking-wider flex items-center gap-1">
                      <Users size={12} /> Cupos Disponibles
                    </p>
                    <p className="font-black text-sm text-slate-900 dark:text-white">
                      {selectedInfoEvent.participations?.length || 0} / {selectedInfoEvent.maxSpots} GP
                    </p>
                  </div>
                </div>

                {/* PDF Document download if available */}
                {selectedInfoEvent.pdfUrl && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-lg">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="font-black text-xs text-slate-900 dark:text-white">Documento Adjunto (PDF)</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Descargar bases o itinerario oficial</p>
                      </div>
                    </div>
                    <a
                      href={`${backendBase}${selectedInfoEvent.pdfUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-black text-xs uppercase transition shadow-sm"
                    >
                      Descargar
                    </a>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsInfoModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    Cerrar
                  </button>
                  {selectedInfoEvent.status === 'Abierto' && canRegisterGroup && !myParticipations.some((p: any) => p.eventId === selectedInfoEvent.id) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsInfoModalOpen(false);
                        handleJoin(selectedInfoEvent);
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus size={16} /> Participar con mi GP
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal Admin: Ventana Completa Ampliada de Información del Evento, GP Inscritos y GP No Inscritos con sus Integrantes */}
      {isAdminDetailModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="p-[1px] bg-gradient-to-b from-indigo-500/30 via-slate-700/50 to-slate-800/80 rounded-[32px] max-w-5xl w-full shadow-2xl shadow-slate-950/80 overflow-hidden transform transition-all duration-300 max-h-[92vh] flex flex-col">
            <div className="bg-white dark:bg-slate-900 rounded-[30px] overflow-hidden flex flex-col flex-1 min-h-0">
              
              {/* Header Ejecutivo Profesional */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative overflow-hidden border-b border-indigo-500/20 shadow-xl shrink-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.18),transparent_65%)]" />
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="p-3.5 bg-indigo-500/10 rounded-2xl border border-indigo-400/20 backdrop-blur-md shrink-0 shadow-inner">
                      <Building2 size={28} className="text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest px-2.5 py-0.5 bg-indigo-500/20 rounded-lg border border-indigo-400/30 backdrop-blur-sm">
                          👑 PANEL DE CONTROL ADMIN GLOBAL
                        </span>
                        {adminDetailData?.event?.category && (
                          <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest px-2.5 py-0.5 bg-emerald-500/20 rounded-lg border border-emerald-400/30 backdrop-blur-sm">
                            {adminDetailData.event.category}
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-2xl text-white tracking-tight leading-tight uppercase">
                        {adminDetailData?.event?.title || 'CARGANDO CONVOCATORIA...'}
                      </h3>
                      {adminDetailData?.event && (
                        <p className="text-xs text-slate-300 font-bold mt-1.5 flex items-center gap-4 flex-wrap">
                          <span>📅 {adminDetailData.event.startDate}</span>
                          <span>⏰ {adminDetailData.event.timeSlot || 'Horario por definir'}</span>
                          <span>📍 {adminDetailData.event.location}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setIsAdminDetailModalOpen(false)} className="text-slate-400 hover:text-white p-2 rounded-2xl hover:bg-white/10 backdrop-blur-sm transition-all cursor-pointer">
                      <X size={22} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              {adminDetailLoading ? (
                <div className="py-24 text-center space-y-4">
                  <div className="w-14 h-14 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-lg shadow-indigo-500/20" />
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cargando Grupos Pequeños e Integrantes...</p>
                </div>
              ) : adminDetailData ? (
                <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                  
                  {/* Event Description Card */}
                  {adminDetailData.event.description && (
                    <div className="p-4 bg-gradient-to-br from-indigo-50/90 via-slate-50 to-purple-50/70 dark:from-slate-800/90 dark:via-slate-800/70 dark:to-indigo-950/50 border border-indigo-200/80 dark:border-slate-700/80 rounded-2xl text-xs text-slate-800 dark:text-slate-200 shadow-sm overflow-hidden flex items-stretch gap-3.5">
                      <div className="w-1.5 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full shrink-0 my-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider mb-1 flex items-center gap-1.5">
                          <Info size={13} /> Descripción General
                        </p>
                        <p className="font-bold leading-relaxed text-slate-900 dark:text-white">{adminDetailData.event.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Tabs & Search */}
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-1">
                    {/* Tabs */}
                    <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 shrink-0 shadow-inner">
                      <button
                        onClick={() => { setActiveAdminTab('ENROLLED'); setExpandedGroupId(null); }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                          activeAdminTab === 'ENROLLED'
                            ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/30 scale-105'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <CheckCircle2 size={16} /> Inscritos ({adminDetailData.enrolledGroups.length})
                      </button>
                      <button
                        onClick={() => { setActiveAdminTab('NOT_ENROLLED'); setExpandedGroupId(null); }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                          activeAdminTab === 'NOT_ENROLLED'
                            ? 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white shadow-lg shadow-rose-500/30 scale-105'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <AlertCircle size={16} /> No Inscritos ({adminDetailData.notEnrolledGroups.length})
                      </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative flex-1">
                      <Search size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar grupo por nombre..."
                        value={adminDetailSearch}
                        onChange={(e) => setAdminDetailSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 shadow-sm uppercase placeholder:normal-case"
                      />
                    </div>
                  </div>

                  {/* TAB 1: GRUPOS INSCRITOS */}
                  {activeAdminTab === 'ENROLLED' && (
                    <div className="space-y-3.5">
                      {adminDetailData.enrolledGroups
                        .filter((g: any) => (g.name || '').toLowerCase().includes(adminDetailSearch.toLowerCase()))
                        .map((group: any) => {
                          const isExpanded = expandedGroupId === group.id;
                          const groupNameUpper = (group.name || '').toUpperCase();
                          return (
                            <div key={group.id} className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/40 border-l-4 border-l-emerald-500 rounded-2xl border-t border-r border-b border-emerald-300 dark:border-emerald-700/80 overflow-hidden shadow-md hover:shadow-emerald-500/15 transition-all duration-300">
                              {/* GP Card Header */}
                              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                                <div className="flex items-center gap-3.5">
                                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white font-black flex items-center justify-center text-base shadow-lg shadow-emerald-500/30 shrink-0">
                                    {groupNameUpper.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-black text-base text-slate-900 dark:text-white tracking-wide uppercase">{groupNameUpper}</h4>
                                      <span className="text-[10px] font-black text-white bg-gradient-to-r from-emerald-500 to-teal-600 px-2.5 py-0.5 rounded-lg uppercase tracking-wider shadow-md shadow-emerald-500/25">
                                        ✓ INSCRITO
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">
                                      👤 Líder: <strong className="text-slate-900 dark:text-slate-100">{getGroupLeaderName(group)}</strong> &bull; Confirmados: <strong className="text-emerald-600 dark:text-emerald-400">{group.confirmedCount} / {group.totalMembersCount} personas</strong>
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 justify-end">
                                  <button
                                    onClick={() => toggleExpandGroup(group.id)}
                                    className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white border border-indigo-400/30 rounded-xl text-xs font-black uppercase tracking-wide transition-all cursor-pointer shadow-lg shadow-indigo-500/30 flex items-center gap-1.5 active:scale-95"
                                  >
                                    <Users size={14} /> {isExpanded ? 'Ocultar Integrantes' : 'Ver Integrantes'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleAdminCancelGroup(adminDetailData.event.id, group.id);
                                      setIsAdminDetailModalOpen(false);
                                    }}
                                    className="px-3.5 py-2.5 bg-gradient-to-r from-rose-500 via-red-600 to-rose-700 hover:from-rose-600 hover:to-red-700 text-white rounded-xl text-xs font-black uppercase transition-all cursor-pointer shadow-lg shadow-rose-500/30 flex items-center gap-1 active:scale-95"
                                    title="Cancelar la participación de este grupo"
                                  >
                                    <X size={14} /> Cancelar
                                  </button>
                                </div>
                              </div>

                              {/* Members Accordion Content */}
                              {isExpanded && (
                                <div className="p-4 border-t border-emerald-200 dark:border-emerald-800/60 bg-white/40 dark:bg-slate-900/90 space-y-2.5">
                                  <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest pb-1 flex items-center gap-1">
                                    <Users size={12} /> Lista de Integrantes del GP {groupNameUpper} ({group.members.length} personas)
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {[...(group.members || [])]
                                      .sort((a: any, b: any) => {
                                        const aConfirmed = Boolean(a.isConfirmed);
                                        const bConfirmed = Boolean(b.isConfirmed);
                                        if (aConfirmed === bConfirmed) return 0;
                                        return aConfirmed ? -1 : 1;
                                      })
                                      .map((member: any) => {
                                      const { roleLabel, roleBadgeStyle, roleIcon, avatarGradient } = getGroupRoleBadge(member.groupRole);

                                      return (
                                        <div key={member.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col xs:flex-row xs:items-center justify-between gap-2 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition">
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${avatarGradient || 'from-indigo-500 to-purple-600'} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md`}>
                                              {member.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 space-y-0.5">
                                              <p className="font-black text-xs text-slate-900 dark:text-white truncate">{member.name}</p>
                                              <span className={`whitespace-nowrap inline-flex items-center gap-1 px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wider rounded-md ${roleBadgeStyle}`}>
                                                <span>{roleIcon}</span> <span>{roleLabel}</span>
                                              </span>
                                            </div>
                                          </div>
                                          <div className="shrink-0 self-end xs:self-center">
                                            {member.isConfirmed ? (
                                              <span className="whitespace-nowrap inline-flex items-center justify-center px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-wider">
                                                ✓ CONFIRMADO
                                              </span>
                                            ) : (
                                              <span className="whitespace-nowrap inline-flex items-center justify-center px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-wider">
                                                — SIN CONFIRMAR PARTICIPACIÓN
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      {adminDetailData.enrolledGroups.length === 0 && (
                        <div className="py-14 text-center text-slate-400 dark:text-slate-500 font-bold text-xs bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                          No hay ningún Grupo Pequeño inscrito en esta convocatoria aún.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: GRUPOS NO INSCRITOS */}
                  {activeAdminTab === 'NOT_ENROLLED' && (
                    <div className="space-y-3.5">
                      {adminDetailData.notEnrolledGroups
                        .filter((g: any) => (g.name || '').toLowerCase().includes(adminDetailSearch.toLowerCase()))
                        .map((group: any) => {
                          const isExpanded = expandedGroupId === group.id;
                          const groupNameUpper = (group.name || '').toUpperCase();
                          return (
                            <div key={group.id} className="bg-gradient-to-br from-rose-500/10 via-orange-500/5 to-amber-500/10 dark:from-rose-950/40 dark:via-orange-950/30 dark:to-amber-950/40 border-l-4 border-l-rose-500 rounded-2xl border-t border-r border-b border-rose-300 dark:border-rose-700/80 overflow-hidden shadow-md hover:shadow-rose-500/15 transition-all duration-300">
                              {/* GP Card Header */}
                              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                                <div className="flex items-center gap-3.5">
                                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500 text-white font-black flex items-center justify-center text-base shadow-lg shadow-rose-500/30 shrink-0">
                                    {groupNameUpper.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-black text-base text-slate-900 dark:text-white tracking-wide uppercase">{groupNameUpper}</h4>
                                      <span className="text-[10px] font-black text-white bg-gradient-to-r from-rose-500 to-orange-500 px-2.5 py-0.5 rounded-lg uppercase tracking-wider shadow-md shadow-rose-500/25">
                                        ❌ NO INSCRITO
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">
                                      👤 Líder: <strong className="text-slate-900 dark:text-slate-100">{getGroupLeaderName(group)}</strong> &bull; Total Integrantes: <strong className="text-rose-600 dark:text-rose-400">{group.totalMembersCount} personas</strong>
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 justify-end">
                                  <button
                                    onClick={() => toggleExpandGroup(group.id)}
                                    className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-black uppercase tracking-wide transition-all cursor-pointer shadow-lg shadow-indigo-500/30 flex items-center gap-1.5 active:scale-95"
                                  >
                                    <Users size={14} /> {isExpanded ? 'Ocultar Integrantes' : 'Ver Integrantes'}
                                  </button>
                                </div>
                              </div>

                              {/* Members Accordion Content */}
                              {isExpanded && (
                                <div className="p-4 border-t border-rose-200 dark:border-rose-800/60 bg-white/40 dark:bg-slate-900/90 space-y-2.5">
                                  <p className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest pb-1 flex items-center gap-1">
                                    <Users size={12} /> Lista de Integrantes del GP {groupNameUpper} ({group.members.length} personas)
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {group.members.map((member: any) => {
                                      const { roleLabel, roleBadgeStyle, roleIcon, avatarGradient } = getGroupRoleBadge(member.groupRole);

                                      return (
                                        <div key={member.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2.5 shadow-sm hover:border-rose-300 dark:hover:border-rose-600 transition">
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${avatarGradient || 'from-rose-500 to-orange-500'} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md`}>
                                              {member.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 space-y-0.5">
                                              <p className="font-black text-xs text-slate-900 dark:text-white truncate">{member.name}</p>
                                              <span className={`whitespace-nowrap inline-flex items-center gap-1 px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wider rounded-md ${roleBadgeStyle}`}>
                                                <span>{roleIcon}</span> <span>{roleLabel}</span>
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      {adminDetailData.notEnrolledGroups.length === 0 && (
                        <div className="py-14 text-center text-slate-400 dark:text-slate-500 font-bold text-xs bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                          ¡Todos los Grupos Pequeños registrados ya están inscritos en este evento!
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ) : null}

              {/* Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                {adminDetailData && (
                  <button
                    onClick={() => openPdfPreviewModal(adminDetailData)}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-500/30 transition cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    <Eye size={16} /> Previsualizar PDF
                  </button>
                )}
                <button
                  onClick={() => setIsAdminDetailModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-black uppercase rounded-xl transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal Ajustado de Previsualización del Reporte PDF */}
      {isPdfPreviewModalOpen && pdfPreviewUrl && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-5 overflow-hidden animate-fadeIn">
          <div className="p-[1px] bg-gradient-to-b from-indigo-500/30 via-slate-700/50 to-slate-800/80 rounded-[28px] max-w-5xl w-full h-[88vh] max-h-[820px] shadow-2xl shadow-slate-950/80 overflow-hidden transform transition-all duration-300 flex flex-col my-auto">
            <div className="bg-white dark:bg-slate-900 rounded-[26px] overflow-hidden flex flex-col flex-1 h-full min-h-0">
              
              {/* Header Previsualización Ejecutivo */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-4 sm:px-6 py-3.5 sm:py-4 text-white flex justify-between items-center border-b border-indigo-500/20 shadow-md shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.18),transparent_65%)] pointer-events-none" />
                <div className="flex items-center gap-3 sm:gap-3.5 relative z-10 min-w-0">
                  <div className="p-2 sm:p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-400/20 backdrop-blur-md shrink-0 shadow-inner">
                    <FileText size={20} className="text-indigo-400 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-tight truncate">Previsualización del Reporte PDF</h3>
                    <p className="text-[10px] sm:text-xs text-slate-300 font-bold truncate">Verifique la estructura e información oficial antes de descargar</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsPdfPreviewModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1.5 sm:p-2 rounded-2xl hover:bg-white/10 backdrop-blur-sm transition-all cursor-pointer relative z-10 shrink-0"
                  title="Cerrar Previsualización"
                >
                  <X size={20} className="sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Visor PDF Frame Ajustado con Fit H */}
              <div className="p-2 sm:p-4 flex-1 bg-slate-950 flex flex-col min-h-0 overflow-hidden relative">
                <iframe
                  src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&view=FitH`}
                  title="Previsualización del Reporte PDF"
                  className="w-full h-full flex-1 rounded-xl border border-slate-800 shadow-2xl bg-white block"
                />
              </div>

              {/* Footer Previsualización */}
              <div className="px-4 sm:px-6 py-3 sm:py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-black uppercase tracking-wide truncate">
                    📄 {pdfFileName}
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    onClick={() => setIsPdfPreviewModalOpen(false)}
                    className="flex-1 sm:flex-initial whitespace-nowrap px-4 sm:px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-[10px] sm:text-xs font-black uppercase rounded-xl transition cursor-pointer text-center"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => {
                      if (adminDetailData) downloadPdfReport(adminDetailData);
                    }}
                    className="flex-1 sm:flex-initial whitespace-nowrap px-4 sm:px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Download size={14} /> Descargar PDF
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};