import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, Download, Image, Shield, Layers, Plus, Trash2, 
  Eye, EyeOff, X, RefreshCw, Upload, AlertCircle, Search, Pencil
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { materialsService } from '../services/api';

const colorMap: Record<string, { bg: string; text: string; border: string; badge: string; shadow: string; btnBg: string; borderLeft: string }> = {
  indigo: {
    bg: 'bg-indigo-600 dark:bg-indigo-500',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-100 dark:border-indigo-950/50',
    badge: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-750 dark:text-indigo-305 border border-indigo-100 dark:border-indigo-500/15',
    shadow: 'shadow-indigo-500/10 dark:shadow-indigo-500/5',
    btnBg: 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10 dark:shadow-indigo-900/20 border-none',
    borderLeft: 'border-l-indigo-600 dark:border-l-indigo-500'
  },
  violet: {
    bg: 'bg-violet-600 dark:bg-violet-500',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-100 dark:border-violet-950/50',
    badge: 'bg-violet-50 dark:bg-violet-950/20 text-violet-750 dark:text-violet-305 border border-violet-100 dark:border-violet-500/15',
    shadow: 'shadow-violet-500/10 dark:shadow-violet-500/5',
    btnBg: 'bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500 text-white shadow-md shadow-violet-650/10 dark:shadow-violet-900/20 border-none',
    borderLeft: 'border-l-violet-600 dark:border-l-violet-500'
  },
  fuchsia: {
    bg: 'bg-fuchsia-600 dark:bg-fuchsia-500',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
    border: 'border-fuchsia-100 dark:border-fuchsia-955/50',
    badge: 'bg-fuchsia-50 dark:bg-fuchsia-950/20 text-fuchsia-750 dark:text-fuchsia-305 border border-fuchsia-100 dark:border-fuchsia-500/15',
    shadow: 'shadow-fuchsia-500/10 dark:shadow-fuchsia-500/5',
    btnBg: 'bg-fuchsia-600 hover:bg-fuchsia-700 dark:bg-fuchsia-600 dark:hover:bg-fuchsia-500 text-white shadow-md shadow-fuchsia-650/10 dark:shadow-fuchsia-900/20 border-none',
    borderLeft: 'border-l-fuchsia-600 dark:border-l-fuchsia-500'
  },
  emerald: {
    bg: 'bg-emerald-600 dark:bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100 dark:border-emerald-955/50',
    badge: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-750 dark:text-emerald-305 border border-emerald-100 dark:border-indigo-500/15',
    shadow: 'shadow-emerald-500/10 dark:shadow-emerald-500/5',
    btnBg: 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-md shadow-emerald-650/10 dark:shadow-emerald-900/20 border-none',
    borderLeft: 'border-l-emerald-600 dark:border-l-emerald-500'
  },
  amber: {
    bg: 'bg-amber-500 dark:bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-100 dark:border-amber-955/50',
    badge: 'bg-amber-50 dark:bg-amber-950/20 text-amber-750 dark:text-amber-305 border border-amber-100 dark:border-indigo-500/15',
    shadow: 'shadow-amber-500/10 dark:shadow-amber-500/5',
    btnBg: 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 text-white shadow-md shadow-amber-500/10 dark:shadow-amber-900/20 border-none',
    borderLeft: 'border-l-amber-500 dark:border-l-amber-500'
  },
  rose: {
    bg: 'bg-rose-600 dark:bg-rose-500',
    text: 'text-rose-600 dark:text-rose-405',
    border: 'border-rose-100 dark:border-rose-955/50',
    badge: 'bg-rose-50 dark:bg-rose-950/20 text-rose-750 dark:text-rose-305 border border-rose-100 dark:border-indigo-500/15',
    shadow: 'shadow-rose-500/10 dark:shadow-rose-500/5',
    btnBg: 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 text-white shadow-md shadow-rose-650/10 dark:shadow-rose-900/20 border-none',
    borderLeft: 'border-l-rose-600 dark:border-l-rose-500'
  }
};

const getCategoryColor = (category: string): string => {
  const norm = String(category).trim().toUpperCase();
  if (norm.includes('REGLAMENTO')) return 'indigo';
  if (norm.includes('CONVOCATORIA')) return 'violet';
  if (norm.includes('DISEÑO') || norm.includes('DISENO')) return 'amber';
  
  // Dynamic color hashing for custom admin categories
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = norm.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['indigo', 'violet', 'fuchsia', 'emerald', 'amber', 'rose'];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export const MaterialesPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [materials, setMaterials] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['Reglamentos', 'Convocatorias', 'Diseño']);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | 'PDF' | 'IMAGE'>('ALL');

  // Modals / Form State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Reglamentos');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // New Category Form State
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryError, setNewCategoryError] = useState<string | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Confirm delete modal state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit Material Form State
  const [editMaterial, setEditMaterial] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [isEditCategoryDropdownOpen, setIsEditCategoryDropdownOpen] = useState(false);
  const [updatingMaterial, setUpdatingMaterial] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Fullscreen Preview Lightbox
  const [previewMaterial, setPreviewMaterial] = useState<any | null>(null);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const response = await materialsService.getAll();
      if (response.data.success) {
        setMaterials(response.data.materials);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await materialsService.getCategories();
      if (response.data.success) {
        const names = response.data.categories.map((c: any) => c.name);
        setCategories(names);
        
        // Ensure standard category defaults are always present or set a fallback category
        if (names.length > 0 && !names.includes(category)) {
          setCategory(names[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [category]);

  useEffect(() => {
    fetchMaterials();
    fetchCategories();
  }, [fetchMaterials, fetchCategories]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadError(null);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Por favor selecciona un archivo PDF o imagen.');
      return;
    }
    setUploadError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);

    try {
      const res = await materialsService.upload(formData);
      if (res.data.success) {
        setTitle('');
        setDescription('');
        setSelectedFile(null);
        setFilePreview(null);
        setIsUploadModalOpen(false);
        fetchMaterials();
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Error al subir el archivo.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    setNewCategoryError(null);
    try {
      const res = await materialsService.createCategory(newCategoryName);
      if (res.data.success) {
        setNewCategoryName('');
        setIsNewCategoryModalOpen(false);
        fetchCategories(); // Refresh local category chips scroller & select options
      }
    } catch (err: any) {
      setNewCategoryError(err.response?.data?.message || 'Error al crear la categoría.');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleToggleVisibility = async (id: number) => {
    try {
      const res = await materialsService.toggleVisibility(id);
      if (res.data.success) {
        setMaterials((prev) => 
          prev.map((m) => m.id === id ? { ...m, isVisible: res.data.material.isVisible } : m)
        );
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      const res = await materialsService.delete(deleteId);
      if (res.data.success) {
        setMaterials((prev) => prev.filter((m) => m.id !== deleteId));
        setDeleteId(null);
      }
    } catch (error) {
      console.error('Error deleting material:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMaterial) return;
    setUpdatingMaterial(true);
    setEditError(null);
    try {
      const response = await materialsService.update(editMaterial.id, {
        title: editTitle,
        description: editDescription,
        category: editCategory
      });
      if (response.data.success) {
        setMaterials((prev) => 
          prev.map((m) => m.id === editMaterial.id ? response.data.material : m)
        );
        setEditMaterial(null);
      } else {
        setEditError(response.data.message || 'Error al actualizar material.');
      }
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Error al actualizar material.');
    } finally {
      setUpdatingMaterial(false);
    }
  };

  const getFileAbsoluteUrl = (relativeUrl: string) => {
    const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${baseUrl}${relativeUrl}`;
  };

  // Filter materials based on search term, category chip and type filter card
  const filteredMaterials = materials.filter((mat) => {
    const matchesSearch = 
      mat.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (mat.description && mat.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = 
      selectedCategory === 'Todos' || mat.category === selectedCategory;
    const matchesType = 
      selectedTypeFilter === 'ALL' || mat.type === selectedTypeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  // Stats calculation
  const totalDocs = materials.length;
  const totalPdfs = materials.filter(m => m.type === 'PDF').length;
  const totalImages = materials.filter(m => m.type === 'IMAGE').length;

  return (
    <div className="space-y-6 font-sans bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen p-4 sm:p-6 transition-colors duration-300 relative overflow-hidden select-none">
      
      {/* BACKGROUND BLURRED GLOWS FOR PREMIUM AESTHETIC */}
      <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[45%] h-[45%] bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-[130px] pointer-events-none" />

      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.97) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes borderRotate { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* HEADER PREMIUM */}
      <div className="relative bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-lg dark:shadow-2xl overflow-hidden z-10">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 via-violet-500 via-fuchsia-500 via-pink-500 to-orange-400" style={{ backgroundSize: '200% 100%', animation: 'shimmer 4s linear infinite' }} />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 pt-7">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 dark:from-indigo-500 dark:to-violet-500 p-3 rounded-2xl shadow-lg shadow-indigo-550/30">
                <FileText size={26} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-450 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-755 dark:from-indigo-400 dark:to-violet-400">
                Materiales Académicos
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Repositorio de recursos didácticos e institucionales</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
              >
                <Plus size={14} /> Subir Material
              </button>
            )}
            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/20 px-4 py-2.5 rounded-xl border border-indigo-100 dark:border-indigo-500/10 text-[11px] font-black uppercase tracking-wider text-indigo-650 dark:text-indigo-455">
              <Shield size={13} className="animate-pulse" />
              Sistema de Archivos
            </div>
          </div>
        </div>
      </div>

      {/* STATS CHIPS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 z-10 relative animate-fadeIn">
        {[
          { label: 'Archivos', value: totalDocs, icon: FileText, color: 'from-blue-500 to-indigo-600', description: 'Todos los recursos de la biblioteca', type: 'ALL' },
          { label: 'PDFs', value: totalPdfs, icon: FileText, color: 'from-violet-500 to-fuchsia-600', description: 'Documentos e instrucciones', type: 'PDF' },
          { label: 'Imágenes', value: totalImages, icon: Image, color: 'from-pink-500 to-rose-600', description: 'Materiales gráficos y diseños', type: 'IMAGE' }
        ].map((stat, i) => {
          const isSelected = selectedTypeFilter === stat.type;
          return (
            <div 
              key={i} 
              onClick={() => setSelectedTypeFilter(stat.type as any)}
              className={`backdrop-blur-xl rounded-3xl p-6 border transition-all duration-300 hover:-translate-y-1 group cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] ${
                isSelected
                  ? 'bg-indigo-50/50 dark:bg-indigo-950/15 border-indigo-500/80 dark:border-indigo-400/80 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-550/10 scale-[1.01]'
                  : 'bg-white dark:bg-[#0e1629]/40 border-slate-200/70 dark:border-white/[0.06] hover:border-indigo-500/20 dark:hover:border-indigo-500/10 hover:shadow-2xl hover:shadow-indigo-500/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mt-1">{stat.label}</div>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">{stat.description}</p>
                </div>
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg shadow-indigo-500/10 text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                  <stat.icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-gradient-to-b from-white to-slate-50/90 dark:from-[#0e1629]/50 dark:to-[#090e1a]/30 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/70 dark:border-white/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] z-10 relative overflow-hidden">
        {/* Top colorful gradient edge */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/40 via-indigo-500/40 via-purple-500/40 via-pink-500/40 to-amber-500/40" />
        
        {/* Search Field */}
        <div className="relative flex-1 max-w-md group">
          <Search size={14} className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors duration-300" />
          <input
            type="text"
            placeholder="Buscar por título o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#0e1629]/20 hover:bg-slate-100 dark:hover:bg-[#0e1629]/40 border border-slate-200/80 dark:border-white/[0.05] pl-10 pr-10 py-2.5 rounded-2xl font-semibold text-xs text-slate-850 dark:text-slate-100 focus:outline-none focus:border-indigo-500/70 focus:bg-white dark:focus:bg-[#0e1629]/80 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-205 transition cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Categories Chips Scroller with Create Category Option */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {/* Main Filter Chips */}
          <div className="flex gap-2 items-center">
            {(searchTerm || selectedCategory !== 'Todos' || selectedTypeFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('Todos');
                  setSelectedTypeFilter('ALL');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-rose-200/40 dark:border-rose-500/20 bg-rose-50/50 hover:bg-rose-100/50 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-455 text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
                title="Limpiar todos los filtros"
              >
                <X size={12} className="shrink-0" />
                Limpiar
              </button>
            )}
            {['Todos', ...categories].map((cat) => {
              const isSelected = selectedCategory === cat;
              const colorName = cat === 'Todos' ? 'indigo' : getCategoryColor(cat);
              const theme = colorMap[colorName] || colorMap.indigo;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap active:scale-95 ${
                    isSelected
                      ? `${theme.bg} text-white shadow-lg ${theme.shadow} scale-[1.03] border-none`
                      : 'bg-slate-50 dark:bg-slate-900/35 hover:bg-slate-100 dark:hover:bg-slate-900/75 text-slate-700 dark:text-slate-350 border border-slate-205 dark:border-white/5'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${isSelected ? 'bg-white' : theme.bg}`} />
                    {cat}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Admin category creator trigger */}
          {isAdmin && (
            <button
              onClick={() => setIsNewCategoryModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 border border-dashed border-violet-500/60 text-violet-600 dark:text-violet-400 bg-violet-500/5 dark:bg-violet-500/[0.03] hover:bg-violet-500/10 dark:hover:bg-violet-500/[0.08] cursor-pointer flex items-center gap-1 active:scale-95 shrink-0 hover:border-violet-550"
              title="Crear nueva categoría"
            >
              <Plus size={12} className="text-violet-500" />
              Categoría
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-xs animate-pulse">
          Sincronizando biblioteca de materiales...
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/60 dark:border-white/10 rounded-3xl p-12 text-center shadow-md dark:shadow-2xl z-10 relative">
          <Layers size={40} className="text-slate-300 dark:text-slate-700 mx-auto mb-4 animate-bounce-slow" />
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Sin resultados encontrados</h3>
          <p className="text-xs text-slate-405 dark:text-slate-500 mt-1 max-w-sm mx-auto font-medium">
            Prueba a escribir términos diferentes o a seleccionar una categoría distinta.
          </p>
        </div>
      ) : (
        /* GRID DE MATERIALES */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 z-10 relative">
          {filteredMaterials.map((mat) => {
            const colorName = getCategoryColor(mat.category);
            const theme = colorMap[colorName] || colorMap.indigo;
            return (
              <div
                key={mat.id}
                className={`bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex flex-col ${!mat.isVisible ? 'opacity-70 dark:opacity-60 bg-slate-50/50 dark:bg-slate-950/20' : ''}`}
              >
                {/* Visual Area (Previsualización Directa) */}
                <div className="relative h-40 bg-slate-950 overflow-hidden rounded-t-[1.45rem] border-b border-slate-105 dark:border-white/5">
                  {mat.type === 'IMAGE' ? (
                    <img 
                      src={getFileAbsoluteUrl(mat.fileUrl)} 
                      alt={mat.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-indigo-950/80 flex items-center justify-center relative overflow-hidden">
                      {/* Background decorative elements */}
                      <div className="absolute -top-12 -right-12 w-28 h-28 bg-indigo-500/10 rounded-full blur-xl" />
                      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-violet-500/10 rounded-full blur-xl" />
                      <FileText size={42} className="text-indigo-400/80 drop-shadow-[0_4px_10px_rgba(99,102,241,0.25)]" />
                    </div>
                  )}

                  {/* Absolute Badges on the preview area */}
                  <div className="absolute top-3.5 left-3.5 flex gap-1.5 z-10">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${theme.badge} backdrop-blur-md bg-opacity-80 dark:bg-opacity-25`}>
                      {mat.type}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-slate-950/60 text-slate-200 border border-white/10 backdrop-blur-md">
                      {mat.category}
                    </span>
                  </div>

                  {/* Admin Options Overlaid on preview area */}
                  {isAdmin && (
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-10">
                      <button
                        onClick={() => handleToggleVisibility(mat.id)}
                        className={`p-1.5 rounded-lg border transition backdrop-blur-md bg-opacity-70 cursor-pointer ${
                          mat.isVisible 
                            ? 'bg-slate-950/80 border-white/10 text-slate-300 hover:text-indigo-400 hover:border-indigo-500/30' 
                            : 'bg-amber-950/80 border-amber-500/20 text-amber-400 hover:text-amber-300'
                        }`}
                        title={mat.isVisible ? 'Ocultar a usuarios' : 'Mostrar a usuarios'}
                      >
                        {mat.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                      <button
                        onClick={() => {
                          setEditMaterial(mat);
                          setEditTitle(mat.title);
                          setEditDescription(mat.description || '');
                          setEditCategory(mat.category);
                          setIsEditCategoryDropdownOpen(false);
                          setEditError(null);
                        }}
                        className="p-1.5 rounded-lg bg-slate-955/80 border border-white/10 text-slate-300 hover:text-amber-400 hover:border-amber-500/30 transition backdrop-blur-md bg-opacity-70 cursor-pointer"
                        title="Editar información del recurso"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(mat.id)}
                        className="p-1.5 rounded-lg bg-slate-950/80 border border-white/10 text-slate-300 hover:text-rose-400 hover:border-rose-500/30 transition backdrop-blur-md bg-opacity-70 cursor-pointer"
                        title="Eliminar de forma permanente"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}

                  {/* Oculto indicator badge */}
                  {!mat.isVisible && isAdmin && (
                    <div className="absolute bottom-3 left-3.5 bg-amber-500/10 border border-amber-500/25 text-amber-550 dark:text-amber-400 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider backdrop-blur-md">
                      Oculto para usuarios
                    </div>
                  )}
                </div>

                {/* Metadata content body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors duration-200">
                      {mat.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">
                      {mat.description || 'Sin descripción de recurso.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 dark:border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {mat.size}
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Vista Previa Button */}
                      <button
                        onClick={() => setPreviewMaterial(mat)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-205 active:scale-95 border border-indigo-200 dark:border-indigo-500/25 bg-indigo-50/50 hover:bg-indigo-100/50 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:scale-[1.03] cursor-pointer"
                      >
                        <Eye size={12} />
                        Visualizar
                      </button>
                      <a
                        href={getFileAbsoluteUrl(mat.fileUrl)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 border ${theme.btnBg} hover:scale-[1.03] shadow-sm cursor-pointer`}
                        target="_blank"
                        rel="noreferrer"
                        download
                      >
                        <Download size={12} />
                        Descargar
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* UPLOAD MATERIAL MODAL (ADMIN ONLY) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[6px]" onClick={() => setIsUploadModalOpen(false)} />
          
          <div 
            className="p-[4px] rounded-[2.5rem] bg-gradient-to-r from-[#ff3366] via-[#ff00ff] via-[#6600ff] via-[#00ffff] via-[#33ff66] via-[#ffcc00] to-[#ff3366] max-w-md w-full relative z-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.28)]"
            style={{ backgroundSize: '300% 300%', animation: 'borderRotate 5s linear infinite' }}
          >
            <div className="bg-gradient-to-b from-white to-slate-50 dark:from-[#0f172a] dark:to-[#0b0f19] backdrop-blur-2xl rounded-[2.45rem] p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-white/5">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-2xl text-white shadow-md shadow-indigo-500/20">
                    <Upload size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 uppercase tracking-wider leading-none">Subir Nuevo Material</h3>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Añade recursos digitales a la biblioteca</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {uploadError && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl flex items-start gap-2.5 text-rose-600 dark:text-rose-350 text-xs font-semibold">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500 dark:text-rose-455" />
                  <p>{uploadError}</p>
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-indigo-650 dark:text-indigo-400 tracking-wider pl-1">Título del Recurso</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej. Reglamento de Uniformes" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900/90 border border-slate-205 dark:border-white/10 px-4 py-3.5 rounded-2xl font-medium text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-305 placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-inner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-indigo-650 dark:text-indigo-400 tracking-wider pl-1">Descripción corta</label>
                  <textarea 
                    placeholder="Escribe un breve resumen de lo que contiene el archivo..." 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900/90 border border-slate-205 dark:border-white/10 px-4 py-3.5 rounded-2xl font-medium text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-305 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-inner"
                  />
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-[9px] font-black uppercase text-indigo-650 dark:text-indigo-400 tracking-wider pl-1">Categoría</label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="w-full bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900/90 border border-slate-205 dark:border-white/10 px-4 py-3.5 rounded-2xl font-semibold text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-350 cursor-pointer shadow-inner flex items-center justify-between text-left"
                  >
                    <span>{category}</span>
                    <Layers size={14} className="text-slate-400 dark:text-slate-500 transition-transform duration-300" style={{ transform: isCategoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </button>

                  {isCategoryDropdownOpen && (
                    <div className="absolute left-0 right-0 z-[100] mt-1 w-full bg-white dark:bg-[#0b0f19]/95 backdrop-blur-2xl rounded-2xl border border-slate-200 dark:border-white/5 shadow-2xl p-1.5 max-h-48 overflow-y-auto no-scrollbar animate-fadeIn">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setCategory(cat);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition cursor-pointer flex items-center justify-between ${
                            category === cat
                              ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md shadow-indigo-600/10'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                        >
                          <span>{cat}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Styled Drag & Drop with Live Local Preview */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-indigo-650 dark:text-indigo-400 tracking-wider pl-1">Archivo (PDF o Imagen)</label>
                  <div className="relative border border-dashed border-slate-205 dark:border-white/10 hover:border-slate-350 dark:hover:border-white/20 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-100/50 dark:hover:bg-white/[0.04] shadow-inner">
                    <input 
                      type="file" 
                      required
                      accept="application/pdf,image/*" 
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    
                    {selectedFile ? (
                      <div className="space-y-3 relative z-20">
                        {filePreview ? (
                          <div className="relative w-28 h-28 mx-auto rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 shadow-md animate-fadeIn">
                            <img src={filePreview} alt="Vista previa local" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 shadow-inner animate-fadeIn">
                            <FileText size={28} />
                          </div>
                        )}
                        <div>
                          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-[280px] mx-auto">
                            {selectedFile.name}
                          </p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="mx-auto text-indigo-600 dark:text-indigo-400 mb-2" />
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-350">
                          Haz clic para explorar o arrastra el archivo
                        </p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">Formatos admitidos: PDF, PNG, JPG, JPEG, WEBP, GIF</p>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-black uppercase rounded-2xl shadow-lg shadow-indigo-600/20 dark:shadow-indigo-500/20 text-xs tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 active:scale-95 mt-4"
                >
                  {uploading ? <RefreshCw className="animate-spin" size={15} /> : 'Subir y Guardar'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW CATEGORY MODAL (ADMIN ONLY) */}
      {isNewCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[6px]" onClick={() => setIsNewCategoryModalOpen(false)} />
          
          <div 
            className="p-[4px] rounded-[2.5rem] bg-gradient-to-r from-[#ff3366] via-[#ff00ff] via-[#6600ff] via-[#00ffff] via-[#33ff66] via-[#ffcc00] to-[#ff3366] max-w-sm w-full relative z-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.28)]"
            style={{ backgroundSize: '300% 300%', animation: 'borderRotate 5s linear infinite' }}
          >
            <div className="bg-gradient-to-b from-white to-slate-50 dark:from-[#0f172a] dark:to-[#0b0f19] backdrop-blur-2xl rounded-[2.45rem] p-6 space-y-6 border border-slate-200 dark:border-white/5">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-2xl text-white shadow-md shadow-indigo-500/20">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none">Crear Categoría</h3>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Agrega una etiqueta a los filtros</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsNewCategoryModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {newCategoryError && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl flex items-start gap-2.5 text-rose-600 dark:text-rose-350 text-xs font-semibold">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500 dark:text-rose-455" />
                  <p>{newCategoryError}</p>
                </div>
              )}

              <form onSubmit={handleCreateCategorySubmit} className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider pl-1">Nombre de la Categoría</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej. Convocatorias" 
                    value={newCategoryName} 
                    onChange={(e) => setNewCategoryName(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900/90 border border-slate-205 dark:border-white/10 px-4 py-3.5 rounded-2xl font-medium text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-305 placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-inner"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewCategoryModalOpen(false)}
                    className="px-5 py-2.5 rounded-2xl border border-slate-205 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-650 dark:text-slate-300 text-xs font-black uppercase tracking-wider transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingCategory}
                    className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-750 dark:bg-indigo-650 dark:hover:bg-indigo-550 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-1.5 border-none"
                  >
                    {creatingCategory ? <RefreshCw className="animate-spin animate-spin-fast" size={12} /> : <Plus size={12} />}
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MATERIAL MODAL (ADMIN ONLY) */}
      {editMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[5px]" onClick={() => setEditMaterial(null)} />
          
          <div 
            className="p-[4px] rounded-[2.5rem] bg-gradient-to-r from-[#ff3366] via-[#ff00ff] via-[#6600ff] via-[#00ffff] via-[#33ff66] via-[#ffcc00] to-[#ff3366] max-w-md w-full relative z-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.28)]"
            style={{ backgroundSize: '300% 300%', animation: 'borderRotate 5s linear infinite' }}
          >
            <div className="bg-gradient-to-b from-white to-slate-50 dark:from-[#0f172a] dark:to-[#0b0f19] backdrop-blur-2xl rounded-[2.45rem] p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-white/5">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-2xl text-white shadow-md shadow-indigo-500/20">
                    <Pencil size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 uppercase tracking-wider leading-none">Editar Material</h3>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Modifica la información del recurso</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditMaterial(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {editError && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl flex items-start gap-2.5 text-rose-600 dark:text-rose-350 text-xs font-semibold">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500 dark:text-rose-455" />
                  <p>{editError}</p>
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-indigo-655 dark:text-indigo-400 tracking-wider pl-1">Título del Recurso</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej. Reglamento de Uniformes" 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900/90 border border-slate-205 dark:border-white/10 px-4 py-3.5 rounded-2xl font-medium text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-305 placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-inner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-indigo-655 dark:text-indigo-400 tracking-wider pl-1">Descripción corta</label>
                  <textarea 
                    placeholder="Escribe un breve resumen de lo que contiene el archivo..." 
                    value={editDescription} 
                    onChange={(e) => setEditDescription(e.target.value)} 
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900/90 border border-slate-205 dark:border-white/10 px-4 py-3.5 rounded-2xl font-medium text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-305 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-inner"
                  />
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-[9px] font-black uppercase text-indigo-655 dark:text-indigo-400 tracking-wider pl-1">Categoría</label>
                  <button
                    type="button"
                    onClick={() => setIsEditCategoryDropdownOpen(!isEditCategoryDropdownOpen)}
                    className="w-full bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900/90 border border-slate-205 dark:border-white/10 px-4 py-3.5 rounded-2xl font-semibold text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-350 cursor-pointer shadow-inner flex items-center justify-between text-left"
                  >
                    <span>{editCategory}</span>
                    <Layers size={14} className="text-slate-400 dark:text-slate-500 transition-transform duration-300" style={{ transform: isEditCategoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </button>

                  {isEditCategoryDropdownOpen && (
                    <div className="absolute left-0 right-0 z-[100] mt-1 w-full bg-white dark:bg-[#0b0f19]/95 backdrop-blur-2xl rounded-2xl border border-slate-200 dark:border-white/5 shadow-2xl p-1.5 max-h-48 overflow-y-auto no-scrollbar animate-fadeIn">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setEditCategory(cat);
                            setIsEditCategoryDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition cursor-pointer flex items-center justify-between ${
                            editCategory === cat
                              ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md shadow-indigo-600/10'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                        >
                          <span>{cat}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setEditMaterial(null)}
                    className="px-5 py-2.5 rounded-2xl border border-slate-205 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-655 dark:text-slate-300 text-xs font-black uppercase tracking-wider transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={updatingMaterial}
                    className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-755 dark:bg-indigo-650 dark:hover:bg-indigo-550 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-1.5 border-none"
                  >
                    {updatingMaterial ? <RefreshCw className="animate-spin animate-spin-fast" size={12} /> : <Pencil size={12} />}
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[6px]" onClick={() => setDeleteId(null)} />
          <div 
            className="p-[4px] rounded-[2.5rem] bg-gradient-to-r from-rose-500 via-red-500 via-orange-500 via-yellow-500 via-rose-500 to-rose-500 max-w-sm w-full relative z-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.28)]"
            style={{ backgroundSize: '300% 300%', animation: 'borderRotate 4s linear infinite' }}
          >
            <div className="bg-gradient-to-b from-white to-slate-50 dark:from-[#0f172a] dark:to-[#0b0f19] backdrop-blur-2xl rounded-[2.45rem] p-6 space-y-6 text-center border border-slate-200 dark:border-white/5">
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto text-rose-500">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">¿Eliminar permanentemente?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">Esta acción borrará físicamente el archivo del servidor y su registro en la base de datos. No se puede deshacer.</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-205 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-655 dark:text-slate-300 text-xs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-755 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-rose-600/20 active:scale-95 flex items-center gap-1.5 border-none"
                >
                  {deleting ? <RefreshCw className="animate-spin" size={12} /> : <Trash2 size={12} />}
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN PREVIEW LIGHTBOX */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setPreviewMaterial(null)} />
          
          <div 
            className="p-[4px] rounded-[2.5rem] bg-gradient-to-r from-[#ff3366] via-[#ff00ff] via-[#6600ff] via-[#00ffff] via-[#33ff66] via-[#ffcc00] to-[#ff3366] max-w-4xl w-full relative z-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)]"
            style={{ backgroundSize: '300% 300%', animation: 'borderRotate 5s linear infinite' }}
          >
            <div className="bg-gradient-to-b from-white to-slate-50 dark:from-[#0f172a] dark:to-[#0b0f19] backdrop-blur-2xl rounded-[2.45rem] overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-white/5">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 p-5 bg-slate-50 dark:bg-slate-950/40">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{previewMaterial.title}</h3>
                  <p className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest mt-0.5">{previewMaterial.category} • {previewMaterial.size}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={getFileAbsoluteUrl(previewMaterial.fileUrl)}
                    download
                    className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md shadow-indigo-600/20 border-none"
                  >
                    <Download size={12} />
                    Descargar
                  </a>
                  <button 
                    onClick={() => setPreviewMaterial(null)}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              
              {/* Viewer Area */}
              <div className="p-5 flex-1 overflow-y-auto flex items-center justify-center bg-slate-100 dark:bg-slate-900/50">
                {previewMaterial.type === 'IMAGE' ? (
                  <div className="relative max-h-[65vh] rounded-lg overflow-hidden border border-slate-200 dark:border-white/5 shadow-2xl bg-white dark:bg-slate-950">
                    <img 
                      src={getFileAbsoluteUrl(previewMaterial.fileUrl)} 
                      alt={previewMaterial.title} 
                      className="max-w-full max-h-[65vh] object-contain"
                    />
                  </div>
                ) : (
                  <iframe
                    src={getFileAbsoluteUrl(previewMaterial.fileUrl)}
                    title={previewMaterial.title}
                    className="w-full h-[65vh] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-955 shadow-2xl"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};