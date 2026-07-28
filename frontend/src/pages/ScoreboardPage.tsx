import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { scoreboardsService, adminUserExtensions, groupsService } from '../services/api';
import {
  Trophy, Plus, Trash2,
  Printer, CheckCircle2, AlertCircle, Users, User,
  Target, Sparkles, Filter, ChevronsRight, X,
  FileText, Check, Activity, Edit2, Eye, Image as ImageIcon, AlertTriangle, Zap, Tag, ChevronDown, Search
} from 'lucide-react';
import { Loader } from '../components/Loader';
import logoImage from '../assets/logo.png';

interface Challenge {
  id: number;
  title: string;
  description?: string;
  category: string;
  maxPoints: number;
}

interface GroupScoreEntry {
  id: number;
  groupId: number;
  groupSmall?: { id: number; name: string; leaderName?: string };
  challenge?: { id: number; title: string };
  points: number;
  reason: string;
  awardedByName?: string;
  createdAt: string;
}

interface ParticipantScoreEntry {
  id: number;
  userId: number;
  user?: { id: number; name: string; email: string };
  groupSmall?: { id: number; name: string };
  challenge?: { id: number; title: string };
  points: number;
  reason: string;
  awardedByName?: string;
  createdAt: string;
}

interface Scoreboard {
  id: number;
  title: string;
  description?: string;
  eventType: string;
  status: string;
  imageUrl?: string;
  pdfUrl?: string;
  createdAt: string;
  challenges: Challenge[];
  groupScores: GroupScoreEntry[];
  participantScores: ParticipantScoreEntry[];
}

interface GroupLeaderboardEntry {
  id: number;
  name: string;
  leaderName: string;
  totalPoints: number;
  scoreCount: number;
}

interface ParticipantLeaderboardEntry {
  id: number;
  name: string;
  email: string;
  groupRole?: string;
  groupName: string;
  totalPoints: number;
  scoreCount: number;
}

interface ConfirmModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
}

// HELPER FUNCTION TO RESOLVE BACKEND IMAGE & FILE URLS
const resolveFileUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const backendBase = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

// CUSTOM PROFESSIONAL MINIMAL COMBOBOX DROPDOWN COMPONENT
interface CustomSelectComboboxProps {
  value: string;
  options: string[];
  onChange: (selected: string) => void;
  onCreateNew: () => void;
}

const CustomSelectCombobox: React.FC<CustomSelectComboboxProps> = ({
  value,
  options,
  onChange,
  onCreateNew
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50/90 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-white/10 px-4 py-3 rounded-2xl text-xs text-slate-800 dark:text-white flex items-center justify-between shadow-sm hover:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all duration-200 cursor-pointer group"
      >
        <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-white truncate">
          {value || 'Seleccionar Tipo de Evento...'}
        </span>
        <ChevronDown size={18} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : 'group-hover:text-slate-600'}`} />
      </button>

      {/* Floating Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn p-2 space-y-1 max-h-64 overflow-y-auto no-scrollbar">
          {options.map((option) => {
            const isSelected = value === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${isSelected
                    ? 'bg-indigo-600 text-white font-black shadow-md'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                <span className="uppercase tracking-wider">{option}</span>
                {isSelected && <Check size={16} className="stroke-[3] shrink-0 text-white" />}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100 dark:border-white/5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onCreateNew();
              }}
              className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition flex items-center gap-2 cursor-pointer border border-dashed border-indigo-400/40 uppercase tracking-wider"
            >
              <Plus size={14} /> + Crear Nuevo Tipo...
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// CUSTOM TARGET SELECT COMBOBOX FOR GROUPS & PARTICIPANTS
interface TargetOption {
  id: string | number;
  name: string;
  subname?: string;
}

interface CustomTargetSelectComboboxProps {
  value: string;
  options: TargetOption[];
  placeholder: string;
  onChange: (id: string) => void;
  iconType?: 'group' | 'participant';
}

const CustomTargetSelectCombobox: React.FC<CustomTargetSelectComboboxProps> = ({
  value,
  options,
  placeholder,
  onChange,
  iconType = 'group'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => String(o.id) === String(value));

  const [dropUp, setDropUp] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => {
    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 280);
    }
    setIsOpen(!isOpen);
  };

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    return options.filter((o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.subname && o.subname.toLowerCase().includes(search.toLowerCase()))
    );
  }, [options, search]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleOpen}
        className={`w-full bg-white dark:bg-slate-900 border-2 px-3.5 py-2.5 rounded-2xl text-xs flex items-center justify-between shadow-sm focus:outline-none transition-all duration-200 cursor-pointer group ${isOpen
            ? 'border-violet-500 ring-4 ring-violet-500/15 shadow-md'
            : 'border-slate-200 dark:border-white/10 hover:border-violet-400 dark:hover:border-violet-500/50'
          }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 font-black shadow-sm ${selectedOption
              ? iconType === 'group'
                ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                : 'bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
            {selectedOption ? selectedOption.name.charAt(0).toUpperCase() : iconType === 'group' ? <Users size={15} /> : <User size={15} />}
          </div>

          <div className="text-left min-w-0">
            <span className="text-[9px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 block">
              {iconType === 'group' ? 'Grupo GP' : 'Participante'}
            </span>
            <span className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-white truncate block">
              {selectedOption ? selectedOption.name : placeholder}
            </span>
          </div>
        </div>

        <ChevronDown size={18} className={`text-slate-400 shrink-0 transition-transform duration-200 ml-2 ${isOpen ? 'rotate-180 text-violet-600' : 'group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className={`absolute ${dropUp ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 right-0 z-[99999] bg-white dark:bg-slate-900 border-2 border-violet-500/40 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn p-2.5 space-y-2 max-h-72 overflow-y-auto custom-visible-scrollbar pr-1.5`}>
          {/* Header info & Search input */}
          <div className="space-y-2 pb-1 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span>{iconType === 'group' ? 'Grupos GP' : 'Participantes'} ({options.length})</span>
              <span className="text-violet-600 dark:text-violet-400">Seleccionar</span>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Buscar ${iconType === 'group' ? 'grupo' : 'participante'}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 pl-9 pr-8 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="space-y-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs font-bold text-slate-400">
                No se encontraron coincidencias.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(value) === String(opt.id);

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(String(opt.id));
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${isSelected
                        ? iconType === 'group'
                          ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black shadow-lg shadow-amber-500/30 scale-[1.01]'
                          : 'bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 text-white font-black shadow-lg shadow-fuchsia-600/30 scale-[1.01]'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-violet-50/80 dark:hover:bg-slate-800/90 hover:pl-3.5 hover:text-violet-600 dark:hover:text-violet-400 border border-transparent hover:border-violet-200 dark:hover:border-violet-800/40'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-sm transition-transform ${isSelected
                          ? 'bg-white/20 text-white border border-white/40'
                          : iconType === 'group'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/30'
                        }`}>
                        {opt.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 text-left">
                        <span className="uppercase tracking-wider font-extrabold truncate block">{opt.name}</span>
                        {opt.subname && (
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md inline-flex items-center gap-1 mt-0.5 ${isSelected
                              ? 'bg-white/20 text-white border border-white/30'
                              : opt.subname.toLowerCase().includes('lider') && !opt.subname.toLowerCase().includes('sub')
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                                : opt.subname.toLowerCase().includes('sub')
                                  ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40'
                                  : opt.subname.toLowerCase().includes('secretar')
                                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                            }`}>
                            {opt.subname.toLowerCase().includes('lider') && !opt.subname.toLowerCase().includes('sub') ? '👑 ' : opt.subname.toLowerCase().includes('sub') ? '⭐ ' : opt.subname.toLowerCase().includes('secretar') ? '📜 ' : '👤 '}
                            {opt.subname}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && <Check size={16} className="stroke-[3] shrink-0 text-white" />}
                  </button>
                );
              })
            )}
          </div>

          {filteredOptions.length > 3 && (
            <div className="text-[10px] font-black uppercase text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 py-1.5 px-3 rounded-xl text-center border border-violet-500/20 flex items-center justify-center gap-1 mt-1.5 shadow-inner">
              <span>📜 Desliza hacia abajo para ver más ({filteredOptions.length})</span>
              <ChevronDown size={12} className="animate-bounce" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// CATEGORY SELECT COMBOBOX FOR CHALLENGES
interface CategorySelectComboboxProps {
  value: string;
  onChange: (cat: string) => void;
  categories: string[];
  onManageCategories?: () => void;
  dropDirection?: 'up' | 'down' | 'auto';
}

const CategorySelectCombobox: React.FC<CategorySelectComboboxProps> = ({
  value,
  onChange,
  categories,
  onManageCategories,
  dropDirection = 'down'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [dropUp, setDropUp] = useState(dropDirection === 'up');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAddingNew(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => {
    if (dropDirection === 'down') {
      setDropUp(false);
    } else if (dropDirection === 'up') {
      setDropUp(true);
    } else if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 320);
    }
    setIsOpen(!isOpen);
  };

  const handleAddNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatInput.trim()) {
      const val = newCatInput.trim();
      onChange(val);
      setIsAddingNew(false);
      setNewCatInput('');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-white/10 p-3.5 rounded-2xl font-bold text-xs text-slate-800 dark:text-white flex items-center justify-between hover:border-indigo-500/80 transition-all cursor-pointer shadow-sm hover:shadow-md"
      >
        <div className="flex items-center gap-2 truncate">
          <Tag size={15} className="text-indigo-500 shrink-0" />
          <span className="truncate">{value || 'Seleccionar Categoría'}</span>
        </div>
        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute ${dropUp ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 right-0 w-full z-[99999] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-2 border-indigo-500/40 dark:border-white/10 rounded-2xl shadow-2xl shadow-indigo-500/15 overflow-hidden p-2.5 space-y-2 animate-fadeIn`}>
          {!isAddingNew ? (
            <>
              <div className="flex items-center justify-between px-1.5 py-1 border-b border-slate-100 dark:border-white/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Tag size={12} className="text-indigo-500" /> Categorías ({categories.length})
                </span>
                {onManageCategories && (
                  <button
                    type="button"
                    onClick={() => { setIsOpen(false); onManageCategories(); }}
                    className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline cursor-pointer flex items-center gap-1 transition"
                  >
                    ⚙️ Gestionar
                  </button>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 pt-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-indigo-300/60 dark:[&::-webkit-scrollbar-thumb]:bg-indigo-700/60 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-indigo-500">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => { onChange(cat); setIsOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-between cursor-pointer ${value === cat
                        ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-md shadow-indigo-500/25'
                        : 'hover:bg-indigo-50/80 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 hover:translate-x-1'
                      }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Tag size={13} className={value === cat ? 'text-white' : 'text-indigo-500'} />
                      <span className="truncate">{cat}</span>
                    </div>
                    {value === cat && <Check size={14} className="shrink-0 ml-1" />}
                  </button>
                ))}
              </div>

              <div className="pt-1.5 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Plus size={13} /> + Crear Nueva Categoría
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleAddNewSubmit} className="space-y-2.5 p-1">
              <div className="flex items-center justify-between text-[10px] font-black uppercase text-indigo-600 border-b border-slate-100 dark:border-white/5 pb-1">
                <span>Nueva Categoría</span>
                <button type="button" onClick={() => setIsAddingNew(false)} className="text-slate-400 hover:text-slate-600"><X size={13} /></button>
              </div>
              <input
                type="text"
                autoFocus
                placeholder="Ej. Creatividad, Liderazgo..."
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-indigo-400 p-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setIsAddingNew(false)} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-600 dark:text-slate-300">Cancelar</button>
                <button type="submit" className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-black uppercase shadow-sm">Guardar</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

// CUSTOM EVENT SELECTOR COMBOBOX COMPONENT FOR CREATED EVENTS
interface EventSelectorComboboxProps {
  scoreboards: Scoreboard[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreateNew?: () => void;
  isAdmin?: boolean;
}

const EventSelectorCombobox: React.FC<EventSelectorComboboxProps> = ({
  scoreboards,
  selectedId,
  onSelect,
  onCreateNew,
  isAdmin
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedEvent = scoreboards.find((s) => s.id === selectedId) || scoreboards[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredScoreboards = useMemo(() => {
    if (!searchTerm.trim()) return scoreboards;
    return scoreboards.filter(
      (s) =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.eventType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [scoreboards, searchTerm]);

  return (
    <div className="relative min-w-[280px] sm:min-w-[360px] max-w-full shrink-0" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50/90 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800/95 backdrop-blur-xl border-2 border-slate-200/90 dark:border-white/10 p-3 sm:p-3.5 rounded-2xl flex items-center justify-between shadow-md hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all duration-200 cursor-pointer group"
      >
        <div className="flex items-center gap-3 min-w-0">
          {selectedEvent?.imageUrl ? (
            <img
              src={resolveFileUrl(selectedEvent.imageUrl)}
              alt={selectedEvent.title}
              className="w-9 h-9 rounded-xl object-cover shrink-0 border-2 border-indigo-500/40 shadow-sm"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Trophy size={18} />
            </div>
          )}

          <div className="text-left min-w-0">
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
              Competencia Seleccionada
            </span>
            <span className="text-xs sm:text-sm font-black uppercase text-slate-800 dark:text-white truncate block">
              {selectedEvent ? selectedEvent.title : 'Seleccionar Evento...'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {selectedEvent?.eventType && (
            <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 hidden sm:inline-block">
              {selectedEvent.eventType}
            </span>
          )}
          <ChevronDown
            size={18}
            className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : 'group-hover:text-slate-600 dark:group-hover:text-slate-200'
              }`}
          />
        </div>
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 left-0 sm:left-auto sm:w-[380px] mt-2.5 z-50 bg-white dark:bg-slate-900 border-2 border-indigo-500/40 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn p-3 space-y-2 max-h-80 overflow-y-auto custom-visible-scrollbar pr-1.5">
          {/* Header & Search */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5 px-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Competencias Registradas ({scoreboards.length})
            </span>
            {isAdmin && onCreateNew && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onCreateNew();
                }}
                className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Nuevo Evento
              </button>
            )}
          </div>

          {scoreboards.length > 3 && (
            <input
              type="text"
              placeholder="Buscar competencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          )}

          {/* List of Scoreboards */}
          <div className="space-y-1.5">
            {filteredScoreboards.length === 0 ? (
              <div className="p-4 text-center text-xs font-bold text-slate-400">
                No se encontraron eventos.
              </div>
            ) : (
              filteredScoreboards.map((sb) => {
                const isSelected = selectedId === sb.id;

                return (
                  <button
                    key={sb.id}
                    type="button"
                    onClick={() => {
                      onSelect(sb.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-3 cursor-pointer ${isSelected
                        ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white font-black shadow-lg shadow-indigo-600/30'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {sb.imageUrl ? (
                        <img
                          src={resolveFileUrl(sb.imageUrl)}
                          alt={sb.title}
                          className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/40 shadow-sm"
                        />
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-xs ${isSelected ? 'bg-white/20 text-white' : 'bg-indigo-500/10 text-indigo-600'
                            }`}
                        >
                          🏆
                        </div>
                      )}

                      <div className="min-w-0 text-left">
                        <p className="uppercase tracking-wider font-extrabold truncate">{sb.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}
                          >
                            {sb.eventType}
                          </span>
                          {sb.status && (
                            <span
                              className={`text-[9px] font-black uppercase ${isSelected ? 'text-indigo-200' : 'text-emerald-500'
                                }`}
                            >
                              {sb.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSelected && <Check size={18} className="stroke-[3] shrink-0 text-white" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ScoreboardPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';

  const [scoreboards, setScoreboards] = useState<Scoreboard[]>([]);
  const [selectedScoreboardId, setSelectedScoreboardId] = useState<number | null>(null);
  const [currentScoreboard, setCurrentScoreboard] = useState<Scoreboard | null>(null);
  const [groupLeaderboard, setGroupLeaderboard] = useState<GroupLeaderboardEntry[]>([]);
  const [participantLeaderboard, setParticipantLeaderboard] = useState<ParticipantLeaderboardEntry[]>([]);

  // Auxiliary data
  const [allGroups, setAllGroups] = useState<{ id: number; name: string }[]>([]);
  const [allUsers, setAllUsers] = useState<{ id: number; name: string; groupSmallId?: number; groupRole?: string }[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'GROUPS' | 'PARTICIPANTS' | 'CHALLENGES' | 'LOGS'>('GROUPS');

  // Event Types list initialized with: Recreativo, Social, Educativo, Espiritual, Deportivo
  const [eventTypesList, setEventTypesList] = useState<string[]>([
    'Recreativo',
    'Social',
    'Educativo',
    'Espiritual',
    'Deportivo'
  ]);
  const [isCreatingCustomType, setIsCreatingCustomType] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState('');

  const [isCreatingCustomTypeEdit, setIsCreatingCustomTypeEdit] = useState(false);
  const [customTypeInputEdit, setCustomTypeInputEdit] = useState('');

  // Custom Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

  // Modals state - Create
  const [isNewScoreboardModalOpen, setIsNewScoreboardModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newEventType, setNewEventType] = useState('Recreativo');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newPdfUrl, setNewPdfUrl] = useState('');

  // Modals state - Edit
  const [isEditScoreboardModalOpen, setIsEditScoreboardModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEventType, setEditEventType] = useState('Recreativo');
  const [editStatus, setEditStatus] = useState('ACTIVO');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editPdfUrl, setEditPdfUrl] = useState('');

  // Uploading state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Category Management State
  const [challengeCategoriesList, setChallengeCategoriesList] = useState<string[]>([
    'Desafío General',
    'Espiritual',
    'Deportivo',
    'Recreativo',
    'Trabajo en Equipo',
    'Cultura General',
    'Misión / Evangelismo'
  ]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('TODAS');
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [editingCategoryOldName, setEditingCategoryOldName] = useState<string | null>(null);
  const [editingCategoryNewName, setEditingCategoryNewName] = useState('');

  // Automatically extract existing categories from currentScoreboard challenges
  useEffect(() => {
    if (currentScoreboard?.challenges) {
      const existing = currentScoreboard.challenges.map((c) => c.category).filter(Boolean);
      setChallengeCategoriesList((prev) => Array.from(new Set([...prev, ...existing])));
    }
  }, [currentScoreboard]);

  const handleCreateCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    if (!challengeCategoriesList.includes(trimmed)) {
      setChallengeCategoriesList((prev) => [...prev, trimmed]);
      setNewCatInput('');
      triggerToast(`✨ Categoría "${trimmed}" creada correctamente.`);
    }
  };

  const handleRenameCategorySubmit = async (oldName: string) => {
    const trimmed = editingCategoryNewName.trim();
    if (!trimmed || oldName === trimmed) {
      setEditingCategoryOldName(null);
      return;
    }
    setChallengeCategoriesList((prev) => prev.map((c) => (c === oldName ? trimmed : c)));
    if (selectedCategoryFilter === oldName) setSelectedCategoryFilter(trimmed);
    if (challengeCategory === oldName) setChallengeCategory(trimmed);
    if (editChallengeCategory === oldName) setEditChallengeCategory(trimmed);

    if (currentScoreboard?.challenges) {
      const challengesToUpdate = currentScoreboard.challenges.filter((c) => c.category === oldName);
      for (const ch of challengesToUpdate) {
        try {
          await scoreboardsService.updateChallenge(ch.id, { category: trimmed });
        } catch (e) {
          console.error('Error updating challenge category:', e);
        }
      }
      await fetchScoreboardDetail(currentScoreboard.id);
    }
    triggerToast(`✏️ Categoría actualizada a "${trimmed}".`);
    setEditingCategoryOldName(null);
    setEditingCategoryNewName('');
  };

  const handleDeleteCategory = (catName: string) => {
    if (challengeCategoriesList.length <= 1) {
      setError('Debes mantener al menos una categoría.');
      return;
    }
    setChallengeCategoriesList((prev) => prev.filter((c) => c !== catName));
    if (selectedCategoryFilter === catName) setSelectedCategoryFilter('TODAS');
    triggerToast(`🗑️ Categoría "${catName}" eliminada.`);
  };

  const filteredChallenges = useMemo(() => {
    if (!currentScoreboard?.challenges) return [];
    if (selectedCategoryFilter === 'TODAS') return currentScoreboard.challenges;
    return currentScoreboard.challenges.filter((ch) => ch.category === selectedCategoryFilter);
  }, [currentScoreboard, selectedCategoryFilter]);

  const [isNewChallengeModalOpen, setIsNewChallengeModalOpen] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeCategory, setChallengeCategory] = useState('Desafío General');
  const [challengeMaxPoints, setChallengeMaxPoints] = useState(100);

  // Modals state - Edit Challenge
  const [isEditChallengeModalOpen, setIsEditChallengeModalOpen] = useState(false);
  const [editingChallengeId, setEditingChallengeId] = useState<number | null>(null);
  const [editChallengeTitle, setEditChallengeTitle] = useState('');
  const [editChallengeDescription, setEditChallengeDescription] = useState('');
  const [editChallengeCategory, setEditChallengeCategory] = useState('Desafío General');
  const [editChallengeMaxPoints, setEditChallengeMaxPoints] = useState(100);

  const openEditChallengeModal = (ch: Challenge) => {
    setEditingChallengeId(ch.id);
    setEditChallengeTitle(ch.title);
    setEditChallengeDescription(ch.description || '');
    setEditChallengeCategory(ch.category || 'Desafío General');
    setEditChallengeMaxPoints(ch.maxPoints || 100);
    setIsEditChallengeModalOpen(true);
  };

  const handleUpdateChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChallengeId || !currentScoreboard) return;
    try {
      await scoreboardsService.updateChallenge(editingChallengeId, {
        title: editChallengeTitle,
        description: editChallengeDescription,
        category: editChallengeCategory,
        maxPoints: editChallengeMaxPoints
      });
      triggerToast('✏️ ¡Desafío actualizado correctamente!');
      setIsEditChallengeModalOpen(false);
      await fetchScoreboardDetail(currentScoreboard.id);
    } catch (err: any) {
      setError('Error al actualizar el desafío.');
    }
  };

  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [awardContextGroup, setAwardContextGroup] = useState<{ id: number; name: string } | null>(null);
  const [awardTargetType, setAwardTargetType] = useState<'GROUP' | 'PARTICIPANT'>('GROUP');
  const [awardTargetId, setAwardTargetId] = useState<string>('');
  const [awardPoints, setAwardPoints] = useState<number>(50);
  const [awardReason, setAwardReason] = useState<string>('');

  const openAwardModalForGroup = (group: { id: number; name: string }) => {
    setAwardContextGroup(group);
    setAwardTargetType('GROUP');
    setAwardTargetId(String(group.id));
    setAwardPoints(50);
    setAwardReason('');
    setIsAwardModalOpen(true);
  };

  const openAwardModalGeneral = () => {
    setAwardContextGroup(null);
    setAwardTargetType('GROUP');
    setAwardTargetId('');
    setAwardPoints(50);
    setAwardReason('');
    setIsAwardModalOpen(true);
  };

  const availableGroupOptions = useMemo(() => {
    if (awardContextGroup) {
      return [{ id: awardContextGroup.id, name: awardContextGroup.name }];
    }
    return allGroups.map((g) => ({ id: g.id, name: g.name }));
  }, [allGroups, awardContextGroup]);

  const availableParticipantOptions = useMemo(() => {
    if (awardContextGroup) {
      return allUsers
        .filter((u) => Number(u.groupSmallId) === Number(awardContextGroup.id))
        .map((u) => ({ id: u.id, name: u.name, subname: u.groupRole || 'Integrante' }));
    }
    return allUsers.map((u) => ({ id: u.id, name: u.name, subname: u.groupRole || 'Integrante' }));
  }, [allUsers, awardContextGroup]);

  // Modals state - Assign Challenge
  const [isAssignChallengeModalOpen, setIsAssignChallengeModalOpen] = useState(false);
  const [selectedChallengeForAssign, setSelectedChallengeForAssign] = useState<Challenge | null>(null);
  const [assignTargetType, setAssignTargetType] = useState<'GROUP' | 'PARTICIPANT'>('GROUP');
  const [assignGroupIds, setAssignGroupIds] = useState<number[]>([]);
  const [assignUserIds, setAssignUserIds] = useState<number[]>([]);
  const [assignSearch, setAssignSearch] = useState<string>('');
  const [isAssignSubmitting, setIsAssignSubmitting] = useState<boolean>(false);
  const [assignPoints, setAssignPoints] = useState<number>(100);
  const [assignNotes, setAssignNotes] = useState<string>('');

  // Modals state - Edit Score Log
  const [isEditScoreModalOpen, setIsEditScoreModalOpen] = useState(false);
  const [editScoreLogData, setEditScoreLogData] = useState<{
    id: number;
    type: 'GROUP' | 'PARTICIPANT';
    targetName: string;
    points: number;
    reason: string;
  } | null>(null);
  const [editScorePointsInput, setEditScorePointsInput] = useState<number>(0);
  const [editScoreReasonInput, setEditScoreReasonInput] = useState<string>('');

  const handleDeleteGroupScoreClick = (scoreId: number, groupName: string, points: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar Puntos Otorgados?',
      message: `¿Estás seguro de eliminar el registro de +${points} PTS asignados al grupo "${groupName}"? Esta acción recalculará los puntajes en tiempo real.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await scoreboardsService.deleteGroupScore(scoreId);
          if (currentScoreboard) {
            await fetchScoreboardDetail(currentScoreboard.id);
          }
        } catch (err) {
          console.error('Error al eliminar puntos de grupo:', err);
        }
      }
    });
  };

  const handleDeleteParticipantScoreClick = (scoreId: number, participantName: string, points: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar Puntos Otorgados?',
      message: `¿Estás seguro de eliminar el registro de +${points} PTS asignados a "${participantName}"? Esta acción recalculará los puntajes en tiempo real.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await scoreboardsService.deleteParticipantScore(scoreId);
          if (currentScoreboard) {
            await fetchScoreboardDetail(currentScoreboard.id);
          }
        } catch (err) {
          console.error('Error al eliminar puntos de participante:', err);
        }
      }
    });
  };

  const openEditScoreModal = (
    id: number,
    type: 'GROUP' | 'PARTICIPANT',
    targetName: string,
    points: number,
    reason: string
  ) => {
    setEditScoreLogData({ id, type, targetName, points, reason });
    setEditScorePointsInput(points);
    setEditScoreReasonInput(reason);
    setIsEditScoreModalOpen(true);
  };

  const handleUpdateScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editScoreLogData || !currentScoreboard) return;

    try {
      if (editScoreLogData.type === 'GROUP') {
        await scoreboardsService.updateGroupScore(editScoreLogData.id, {
          points: Number(editScorePointsInput),
          reason: editScoreReasonInput.trim()
        });
      } else {
        await scoreboardsService.updateParticipantScore(editScoreLogData.id, {
          points: Number(editScorePointsInput),
          reason: editScoreReasonInput.trim()
        });
      }
      setIsEditScoreModalOpen(false);
      await fetchScoreboardDetail(currentScoreboard.id);
    } catch (err) {
      console.error('Error al actualizar registro de puntos:', err);
    }
  };

  const openAssignModalForChallenge = (ch: Challenge) => {
    setSelectedChallengeForAssign(ch);
    setAssignPoints(ch.maxPoints);
    setAssignNotes(`Desafío Completado: ${ch.title}`);
    setAssignTargetType('GROUP');
    setAssignGroupIds([]);
    setAssignUserIds([]);
    setAssignSearch('');
    setIsAssignChallengeModalOpen(true);
  };

  const handleAssignChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentScoreboard || !selectedChallengeForAssign) return;
    
    if (assignTargetType === 'GROUP' && assignGroupIds.length === 0) {
      setError('Por favor selecciona al menos un Grupo Pequeño.');
      return;
    }
    if (assignTargetType === 'PARTICIPANT' && assignUserIds.length === 0) {
      setError('Por favor selecciona al menos un Participante.');
      return;
    }

    try {
      setIsAssignSubmitting(true);
      const reasonStr = assignNotes.trim() || `Desafío Completado: ${selectedChallengeForAssign.title}`;
      
      if (assignTargetType === 'GROUP') {
        await Promise.all(
          assignGroupIds.map((groupId) =>
            scoreboardsService.awardGroupScore(currentScoreboard.id, {
              groupId,
              challengeId: selectedChallengeForAssign.id,
              points: Number(assignPoints),
              reason: reasonStr
            })
          )
        );
      } else {
        await Promise.all(
          assignUserIds.map((userId) =>
            scoreboardsService.awardParticipantScore(currentScoreboard.id, {
              userId,
              challengeId: selectedChallengeForAssign.id,
              points: Number(assignPoints),
              reason: reasonStr
            })
          )
        );
      }

      triggerToast(`🎯 ¡Desafío "${selectedChallengeForAssign.title}" asignado exitosamente!`);
      setIsAssignChallengeModalOpen(false);
      await fetchScoreboardDetail(currentScoreboard.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al asignar el desafío.');
    } finally {
      setIsAssignSubmitting(false);
    }
  };

  const allCombinedLogs = useMemo(() => {
    if (!currentScoreboard) return [];
    const gLogs = (currentScoreboard.groupScores || []).map((gs) => ({
      id: gs.id,
      type: 'GROUP' as const,
      targetName: gs.groupSmall?.name || 'Grupo Pequeño',
      reason: gs.reason,
      points: gs.points,
      createdAt: gs.createdAt,
      awardedByName: gs.awardedByName || 'Administración'
    }));
    const pLogs = (currentScoreboard.participantScores || []).map((ps) => ({
      id: ps.id,
      type: 'PARTICIPANT' as const,
      targetName: ps.user?.name || 'Participante',
      reason: ps.reason,
      points: ps.points,
      createdAt: ps.createdAt,
      awardedByName: ps.awardedByName || 'Administración'
    }));
    return [...gLogs, ...pLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [currentScoreboard]);

  // Modals state - Bulk Award (Asignación Múltiple)
  const [isBulkAwardModalOpen, setIsBulkAwardModalOpen] = useState(false);
  const [bulkTargetType, setBulkTargetType] = useState<'GROUPS' | 'PARTICIPANTS'>('GROUPS');
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [bulkPoints, setBulkPoints] = useState<number>(50);
  const [bulkReason, setBulkReason] = useState<string>('');
  const [bulkSearch, setBulkSearch] = useState<string>('');
  const [isSubmittingBulk, setIsSubmittingBulk] = useState<boolean>(false);

  const openBulkAwardModal = () => {
    setBulkTargetType('GROUPS');
    setSelectedGroupIds([]);
    setSelectedUserIds([]);
    setBulkPoints(50);
    setBulkReason('');
    setBulkSearch('');
    setIsBulkAwardModalOpen(true);
  };

  const handleBulkAwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentScoreboard) return;
    if (!bulkReason.trim()) {
      setError('Por favor ingresa el motivo de la asignación múltiple.');
      return;
    }

    if (bulkTargetType === 'GROUPS' && selectedGroupIds.length === 0) {
      setError('Por favor selecciona al menos un Grupo Pequeño.');
      return;
    }
    if (bulkTargetType === 'PARTICIPANTS' && selectedUserIds.length === 0) {
      setError('Por favor selecciona al menos un Participante.');
      return;
    }

    try {
      setIsSubmittingBulk(true);
      if (bulkTargetType === 'GROUPS') {
        await Promise.all(
          selectedGroupIds.map((groupId) =>
            scoreboardsService.awardGroupScore(currentScoreboard.id, {
              groupId,
              points: Number(bulkPoints),
              reason: bulkReason.trim()
            })
          )
        );
        triggerToast(`✨ ¡Se otorgaron +${bulkPoints} PTS a ${selectedGroupIds.length} Grupos Pequeños!`);
      } else {
        await Promise.all(
          selectedUserIds.map((userId) =>
            scoreboardsService.awardParticipantScore(currentScoreboard.id, {
              userId,
              points: Number(bulkPoints),
              reason: bulkReason.trim()
            })
          )
        );
        triggerToast(`✨ ¡Se otorgaron +${bulkPoints} PTS a ${selectedUserIds.length} Participantes!`);
      }

      setIsBulkAwardModalOpen(false);
      await fetchScoreboardDetail(currentScoreboard.id);
    } catch (err: any) {
      console.error('Error en asignación múltiple:', err);
      setError('Error al procesar la asignación múltiple.');
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const triggerToast = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3500);
  };

  // Helper for clean event type styles (Unified Indigo/Violet corporate palette)
  const getEventTypeStyle = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('recreativ') || t.includes('campamento')) {
      return {
        bg: 'bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-xl shadow-indigo-600/30 ring-4 ring-indigo-500/20',
        bgSoft: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-500/30'
      };
    }
    if (t.includes('social') || t.includes('rally')) {
      return {
        bg: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-xl shadow-emerald-600/30 ring-4 ring-emerald-500/20',
        bgSoft: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-500/30'
      };
    }
    if (t.includes('educativ') || t.includes('olimpiada') || t.includes('biblic')) {
      return {
        bg: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl shadow-blue-600/30 ring-4 ring-blue-500/20',
        bgSoft: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-2 border-blue-500/30'
      };
    }
    if (t.includes('espiritual') || t.includes('retiro')) {
      return {
        bg: 'bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 text-white shadow-xl shadow-fuchsia-600/30 ring-4 ring-fuchsia-500/20',
        bgSoft: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-2 border-fuchsia-500/30'
      };
    }
    return {
      bg: 'bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-xl shadow-indigo-600/30 ring-4 ring-indigo-500/20',
      bgSoft: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-500/30'
    };
  };

  // Upload handlers
  const handleUploadImageFile = async (file: File, isEdit = false) => {
    try {
      setUploadingImage(true);
      const res = await scoreboardsService.uploadFile(file);
      if (res.data?.success && res.data.fileUrl) {
        if (isEdit) {
          setEditImageUrl(res.data.fileUrl);
        } else {
          setNewImageUrl(res.data.fileUrl);
        }
        triggerToast('📷 Logo / Imagen subida exitosamente.');
      }
    } catch (err) {
      setError('Error al subir la imagen.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUploadPdfFile = async (file: File, isEdit = false) => {
    try {
      setUploadingPdf(true);
      const res = await scoreboardsService.uploadFile(file);
      if (res.data?.success && res.data.fileUrl) {
        if (isEdit) {
          setEditPdfUrl(res.data.fileUrl);
        } else {
          setNewPdfUrl(res.data.fileUrl);
        }
        triggerToast('📄 Convocatoria PDF subida exitosamente.');
      }
    } catch (err) {
      setError('Error al subir la convocatoria PDF.');
    } finally {
      setUploadingPdf(false);
    }
  };

  // Load scoreboards & detail
  const fetchScoreboards = useCallback(async () => {
    try {
      const res = await scoreboardsService.getAll();
      if (res.data?.success) {
        const list: Scoreboard[] = res.data.scoreboards || [];
        setScoreboards(list);

        // Collect any custom event types present in the scoreboards
        const loadedTypes = list.map(s => s.eventType).filter(Boolean);
        setEventTypesList(prev => Array.from(new Set([...prev, ...loadedTypes])));

        if (list.length > 0) {
          const targetId = selectedScoreboardId || list[0].id;
          setSelectedScoreboardId(targetId);
        } else {
          setCurrentScoreboard(null);
          setGroupLeaderboard([]);
          setParticipantLeaderboard([]);
        }
      }
    } catch (err: any) {
      console.error('Error al cargar tableros:', err);
      setError('Error al sincronizar tableros de puntuación.');
    } finally {
      setLoading(false);
    }
  }, [selectedScoreboardId]);

  const fetchScoreboardDetail = useCallback(async (id: number) => {
    try {
      const res = await scoreboardsService.getById(id);
      if (res.data?.success) {
        setCurrentScoreboard(res.data.scoreboard);
        setGroupLeaderboard(res.data.groupLeaderboard || []);
        setParticipantLeaderboard(res.data.participantLeaderboard || []);
      }
    } catch (err) {
      console.error('Error al obtener detalle:', err);
    }
  }, []);

  useEffect(() => {
    fetchScoreboards();
  }, [fetchScoreboards]);

  useEffect(() => {
    if (selectedScoreboardId) {
      fetchScoreboardDetail(selectedScoreboardId);
    }
  }, [selectedScoreboardId, fetchScoreboardDetail]);

  // Load groups & users for scoring modal
  useEffect(() => {
    const loadAuxData = async () => {
      try {
        const [gRes, uRes] = await Promise.all([
          groupsService.getAll(),
          adminUserExtensions.getAll()
        ]);
        if (gRes.data) {
          const gList = Array.isArray(gRes.data) ? gRes.data : gRes.data.groups || [];
          setAllGroups(gList.map((g: any) => ({ id: g.id, name: g.name })));
        }
        if (uRes.data) {
          const uList = Array.isArray(uRes.data) ? uRes.data : uRes.data.users || [];
          setAllUsers(uList.map((u: any) => ({ id: u.id, name: u.name, groupSmallId: u.groupSmallId, groupRole: u.groupRole })));
        }
      } catch (err) {
        console.error('Error aux data:', err);
      }
    };
    if (isAdmin) loadAuxData();
  }, [isAdmin]);

  // Submit handlers - Create
  const handleCreateScoreboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await scoreboardsService.create({
        title: newTitle.trim(),
        description: newDescription.trim(),
        eventType: newEventType,
        imageUrl: newImageUrl,
        pdfUrl: newPdfUrl
      });
      if (res.data?.success) {
        setNewTitle('');
        setNewDescription('');
        setNewImageUrl('');
        setNewPdfUrl('');
        setIsNewScoreboardModalOpen(false);
        triggerToast('🏆 Nueva competencia / campamento registrado.');
        await fetchScoreboards();
        if (res.data.scoreboard?.id) {
          setSelectedScoreboardId(res.data.scoreboard.id);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear competencia.');
    }
  };

  // Submit handlers - Edit
  const openEditModal = () => {
    if (!currentScoreboard) return;
    setEditTitle(currentScoreboard.title || '');
    setEditDescription(currentScoreboard.description || '');
    setEditEventType(currentScoreboard.eventType || 'Recreativo');
    setEditStatus(currentScoreboard.status || 'ACTIVO');
    setEditImageUrl(currentScoreboard.imageUrl || '');
    setEditPdfUrl(currentScoreboard.pdfUrl || '');
    setIsEditScoreboardModalOpen(true);
  };

  const handleEditScoreboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentScoreboard || !editTitle.trim()) return;
    try {
      const res = await scoreboardsService.update(currentScoreboard.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        eventType: editEventType,
        status: editStatus,
        imageUrl: editImageUrl,
        pdfUrl: editPdfUrl
      });
      if (res.data?.success) {
        setIsEditScoreboardModalOpen(false);
        triggerToast('✏️ Competencia actualizada exitosamente.');
        await fetchScoreboards();
        await fetchScoreboardDetail(currentScoreboard.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar evento.');
    }
  };

  const handleCreateChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentScoreboard || !challengeTitle.trim()) return;
    try {
      const res = await scoreboardsService.addChallenge(currentScoreboard.id, {
        title: challengeTitle.trim(),
        category: challengeCategory,
        maxPoints: Number(challengeMaxPoints)
      });
      if (res.data?.success) {
        setChallengeTitle('');
        setIsNewChallengeModalOpen(false);
        triggerToast('🎯 Desafío de competencia agregado.');
        await fetchScoreboardDetail(currentScoreboard.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al agregar desafío.');
    }
  };

  const handleAwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentScoreboard || !awardTargetId || !awardReason.trim()) return;
    try {
      if (awardTargetType === 'GROUP') {
        const res = await scoreboardsService.awardGroupScore(currentScoreboard.id, {
          groupId: Number(awardTargetId),
          points: Number(awardPoints),
          reason: awardReason.trim()
        });
        if (res.data?.success) {
          triggerToast(`⚡ Puntos otorgados a ${res.data.scoreEntry?.groupSmall?.name || 'Grupo'}`);
        }
      } else {
        const res = await scoreboardsService.awardParticipantScore(currentScoreboard.id, {
          userId: Number(awardTargetId),
          points: Number(awardPoints),
          reason: awardReason.trim()
        });
        if (res.data?.success) {
          triggerToast(`⭐ Puntos asignados a ${res.data.scoreEntry?.user?.name || 'Participante'}`);
        }
      }
      setIsAwardModalOpen(false);
      setAwardReason('');
      setAwardTargetId('');
      await fetchScoreboardDetail(currentScoreboard.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al asignar puntos.');
    }
  };

  // CUSTOM MODAL CONFIRMED DELETIONS
  const handleDeleteScoreboardClick = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar competencia?',
      message: '¿Seguro que deseas eliminar esta competencia y todos sus puntajes acumulados? Esta acción no se podrá deshacer.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await scoreboardsService.delete(id);
          if (res.data?.success) {
            triggerToast('Competencia eliminada.');
            setSelectedScoreboardId(null);
            await fetchScoreboards();
          }
        } catch (err: any) {
          setError(err.response?.data?.message || 'Error al eliminar.');
        }
      }
    });
  };

  const handleDeleteChallengeClick = (challengeId: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar desafío?',
      message: '¿Seguro que deseas eliminar este desafío o prueba de la competencia?',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        if (!currentScoreboard) return;
        try {
          await scoreboardsService.deleteChallenge(challengeId);
          triggerToast('Desafío eliminado.');
          await fetchScoreboardDetail(currentScoreboard.id);
        } catch (err: any) {
          setError('Error al eliminar desafío.');
        }
      }
    });
  };

  // State for PDF Preview Modal
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  const generatePDFHtml = () => {
    if (!currentScoreboard) return '';

    const todayStr = new Date().toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const logoSrc = logoImage || '/src/assets/logo.png';

    const groupsRows = groupLeaderboard.map((g, idx) => {
      const medal = idx === 0 ? '🥇 1er Lugar (ORO)' : idx === 1 ? '🥈 2do Lugar (PLATA)' : idx === 2 ? '🥉 3er Lugar (BRONCE)' : `${idx + 1}° Lugar`;
      
      return `
        <tr style="background-color: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'};">
          <td style="padding: 10px 14px; font-weight: 800; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: ${idx === 0 ? '#d97706' : idx === 1 ? '#475569' : idx === 2 ? '#b45309' : '#64748b'};">${medal}</td>
          <td style="padding: 10px 14px; font-weight: 800; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; text-transform: uppercase;">${g.name.toUpperCase()}</td>
          <td style="padding: 10px 14px; font-weight: 900; text-align: right; color: #4f46e5; border-bottom: 1px solid #e2e8f0; font-size: 14px;">${g.totalPoints.toLocaleString()} PTS</td>
        </tr>
      `;
    }).join('');

    const participantsRows = participantLeaderboard.slice(0, 20).map((p, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'};">
        <td style="padding: 8px 12px; font-weight: 800; border-bottom: 1px solid #e2e8f0; color: #475569;">#${idx + 1}</td>
        <td style="padding: 8px 12px; font-weight: 800; border-bottom: 1px solid #e2e8f0; color: #0f172a; text-transform: uppercase;">${p.name.toUpperCase()}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #4f46e5; font-weight: 700; text-transform: uppercase;">${p.groupName.toUpperCase()}</td>
        <td style="padding: 8px 12px; font-weight: 900; text-align: right; color: #0284c7; border-bottom: 1px solid #e2e8f0;">${p.totalPoints.toLocaleString()} PTS</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reporte Oficial de Puntuaciones - ${currentScoreboard.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800;900&display=swap');
            body { font-family: 'Plus Jakarta Sans', 'Segoe UI', Tahoma, sans-serif; margin: 0; padding: 28px; color: #0f172a; background-color: #ffffff; }
            .header-box { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px; }
            .header-left { display: flex; align-items: center; gap: 16px; }
            .logo-img { height: 62px; width: auto; object-fit: contain; }
            .title-brand { font-size: 22px; font-weight: 900; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
            .subtitle-event { font-size: 13px; color: #4f46e5; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 3px; }
            .meta-bar { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 5px; }
            .section-title { font-size: 13px; font-weight: 900; text-transform: uppercase; color: #3730a3; border-left: 5px solid #6366f1; padding-left: 10px; margin-top: 26px; margin-bottom: 12px; letter-spacing: 1px; }
            table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 22px; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
            th { background: linear-gradient(135deg, #4f46e5, #4338ca); color: #ffffff; text-align: left; padding: 11px 14px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.2px; }
            .footer-container { margin-top: 60px; padding-top: 20px; display: flex; justify-content: space-between; text-align: center; }
            .signature-box { width: 42%; border-top: 2px solid #cbd5e1; padding-top: 10px; font-size: 11px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; }
            .system-watermark { text-align: center; margin-top: 35px; font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div class="header-left">
              <img src="${logoSrc}" class="logo-img" alt="Logo System Alive" />
              <div>
                <h1 class="title-brand">ECOSISTEMA ALIVE MARANATHA 2026</h1>
                <div class="subtitle-event">Reporte Oficial de Puntuaciones — ${currentScoreboard.title}</div>
                <div class="meta-bar">Categoría: ${currentScoreboard.eventType} | Estado: ${currentScoreboard.status} | Fecha: ${todayStr}</div>
              </div>
            </div>
          </div>

          <div class="section-title">🏆 Tabla de Posiciones — Grupos Pequeños</div>
          <table>
            <thead>
              <tr>
                <th>Lugar / Medalla</th>
                <th>Grupo Pequeño</th>
                <th style="text-align: right;">Total Acumulado</th>
              </tr>
            </thead>
            <tbody>
              ${groupsRows || '<tr><td colspan="3" style="text-align:center; padding: 16px; color: #94a3b8;">No hay puntajes registrados aún.</td></tr>'}
            </tbody>
          </table>

          ${participantLeaderboard.length > 0 ? `
            <div class="section-title">⭐ Top Participantes Destacados</div>
            <table>
              <thead>
                <tr>
                  <th>Posición</th>
                  <th>Participante</th>
                  <th>Grupo Pequeño</th>
                  <th style="text-align: right;">Puntaje Individual</th>
                </tr>
              </thead>
              <tbody>
                ${participantsRows}
              </tbody>
            </table>
          ` : ''}

          <div class="footer-container">
            <div class="signature-box">
              Directiva de Evento / Campamento
            </div>
            <div class="signature-box">
              Administración Sistema Alive
            </div>
          </div>

          <div class="system-watermark">
            Sistema Oficial de Gestión Ecosistema Alive • Documento Oficial Generado en Tiempo Real
          </div>
        </body>
      </html>
    `;
  };

  const handlePreviewPDF = () => {
    if (!currentScoreboard) return;
    setPreviewHtml(generatePDFHtml());
    setIsPreviewModalOpen(true);
  };

  // PDF Export Printer Function
  const handleExportPDF = () => {
    if (!currentScoreboard) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setConfirmModal({
        isOpen: true,
        title: 'Ventana emergente bloqueada',
        message: 'Por favor permite abrir ventanas emergentes en tu navegador para generar e imprimir el reporte PDF oficial.',
        confirmText: 'Entendido',
        cancelText: 'Cerrar',
        variant: 'warning',
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false }))
      });
      return;
    }

    const htmlContent = generatePDFHtml();

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (loading) return <Loader text="Cargando sistema de puntuaciones..." />;

  // Max points for group progress calculation
  const maxGroupScore = groupLeaderboard.length > 0 ? Math.max(...groupLeaderboard.map(g => g.totalPoints)) : 1;

  return (
    <div className="space-y-7 font-sans bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen p-3 sm:p-6 transition-colors duration-300 relative overflow-hidden select-none">

      {/* HEADER PRINCIPAL AMPLIADO VIBRANTE Y CON ANIMACIONES */}
      <div className="relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] border-2 border-indigo-500/20 shadow-2xl overflow-hidden z-10 transition-all duration-300 hover:shadow-indigo-500/10">
        {/* Sleek Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 p-6 sm:p-8 pt-7">
          <div className="flex items-center gap-5 min-w-0">
            {/* Logo o Avatar con Glow Ring 3D y Zoom al pasar cursor */}
            <div className="relative shrink-0 group">
              {currentScoreboard?.imageUrl ? (
                <div className="relative cursor-pointer">
                  <img
                    src={resolveFileUrl(currentScoreboard.imageUrl)}
                    alt={currentScoreboard.title}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-4 border-white dark:border-slate-800 shadow-2xl shadow-indigo-500/30 ring-4 ring-indigo-500/30 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black uppercase tracking-wider backdrop-blur-[2px]">
                    Ver Logo
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 ring-4 ring-indigo-500/30 transition-transform duration-300 group-hover:scale-105">
                  <Trophy size={36} className="text-white animate-bounce" />
                </div>
              )}
              {/* Badge Indicador de Evento Vivo con Efecto Pulse Ping */}
              <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-md"></span>
              </div>
            </div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 dark:from-indigo-400 dark:via-violet-400 dark:to-fuchsia-400 truncate">
                  {currentScoreboard ? currentScoreboard.title : 'Puntuaciones Extra & Competencias'}
                </h1>
                {currentScoreboard?.eventType && (
                  <span className={`px-3.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all duration-200 hover:scale-105 ${getEventTypeStyle(currentScoreboard.eventType).bgSoft}`}>
                    {currentScoreboard.eventType}
                  </span>
                )}
                {currentScoreboard?.status && (
                  <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 hover:scale-105 ${currentScoreboard.status === 'ACTIVO'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                      : 'bg-slate-500/15 text-slate-500 border-2 border-slate-500/30'
                    }`}>
                    {currentScoreboard.status}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest truncate">
                {currentScoreboard?.description || 'Eventos Recreativos, Sociales, Educativos y Calificaciones en Tiempo Real'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto justify-start md:justify-end pt-2 md:pt-0">
            {/* Convocatoria PDF Button */}
            {currentScoreboard?.pdfUrl && (
              <a
                href={resolveFileUrl(currentScoreboard.pdfUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 hover:-translate-y-0.5 shadow-lg shadow-rose-500/25 cursor-pointer col-span-2 sm:col-auto whitespace-nowrap"
              >
                <FileText size={15} className="shrink-0" /> Convocatoria PDF
              </a>
            )}

            {isAdmin && (
              <>
                <button
                  onClick={() => setIsNewScoreboardModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 hover:-translate-y-0.5 shadow-xl shadow-indigo-600/30 cursor-pointer col-span-2 sm:col-auto whitespace-nowrap"
                >
                  <Plus size={15} className="shrink-0" /> Nueva Competencia
                </button>

                {currentScoreboard && (
                  <>
                    <button
                      onClick={openEditModal}
                      className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 border-2 border-slate-200 dark:border-white/10 cursor-pointer col-span-1 sm:col-auto whitespace-nowrap"
                      title="Editar evento"
                    >
                      <Edit2 size={14} className="shrink-0" /> Editar
                    </button>
                    <button
                      onClick={() => {
                        if (currentScoreboard.challenges.length > 0) {
                          setSelectedChallengeForAssign(currentScoreboard.challenges[0]);
                          setAssignPoints(currentScoreboard.challenges[0].maxPoints);
                          setAssignNotes(`Desafío Completado: ${currentScoreboard.challenges[0].title}`);
                        } else {
                          setSelectedChallengeForAssign(null);
                          setAssignNotes('');
                        }
                        setAssignGroupIds([]);
                        setAssignUserIds([]);
                        setAssignSearch('');
                        setIsAssignChallengeModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 hover:-translate-y-0.5 shadow-xl shadow-emerald-600/30 cursor-pointer col-span-1 sm:col-auto whitespace-nowrap"
                    >
                      <Target size={15} className="shrink-0" /> Asignar Desafío
                    </button>
                    <button
                      onClick={openAwardModalGeneral}
                      className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 hover:-translate-y-0.5 shadow-xl shadow-violet-600/30 cursor-pointer col-span-1 sm:col-auto whitespace-nowrap"
                    >
                      <Zap size={15} className="shrink-0" /> Puntos Libres
                    </button>
                    <button
                      onClick={openBulkAwardModal}
                      className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 hover:from-fuchsia-700 hover:to-rose-700 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 hover:-translate-y-0.5 shadow-xl shadow-fuchsia-600/30 cursor-pointer col-span-1 sm:col-auto whitespace-nowrap"
                    >
                      <Sparkles size={15} className="shrink-0" /> Asignación Múltiple
                    </button>
                  </>
                )}
              </>
            )}

            {currentScoreboard && (
              <div className="col-span-2 sm:col-auto flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handlePreviewPDF}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 hover:-translate-y-0.5 cursor-pointer shadow-sm border border-indigo-200 dark:border-indigo-800 flex-1 whitespace-nowrap"
                  title="Previsualizar reporte PDF"
                >
                  <Eye size={14} className="shrink-0" /> Previsualizar
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 hover:-translate-y-0.5 cursor-pointer shadow-lg border border-white/10 flex-1 whitespace-nowrap"
                  title="Exportar reporte PDF profesional"
                >
                  <Printer size={14} className="shrink-0" /> Exportar PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      {error && (
        <div className="bg-rose-500/10 border-2 border-rose-500/20 p-4 rounded-2xl flex items-center justify-between text-rose-600 dark:text-rose-350 text-xs font-semibold animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0 text-rose-500" />
            <p>{error}</p>
          </div>
          <button onClick={() => setError(null)} className="cursor-pointer"><X size={16} /></button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border-2 border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between text-emerald-600 dark:text-emerald-350 text-xs font-semibold animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
            <p>{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="cursor-pointer"><X size={16} /></button>
        </div>
      )}

      {/* BARRA SELECCIÓN DE COMPETENCIA DEDICADA Y PROFESIONAL */}
      <div className="relative z-30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border-2 border-indigo-500/20 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-600/30">
            <Trophy size={22} className="animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">
              Eventos & Competencias
            </h3>
            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              {scoreboards.length} competencia(s) registrada(s)
            </p>
          </div>
        </div>

        {scoreboards.length > 0 ? (
          <EventSelectorCombobox
            scoreboards={scoreboards}
            selectedId={selectedScoreboardId}
            onSelect={(id) => setSelectedScoreboardId(id)}
            onCreateNew={() => setIsNewScoreboardModalOpen(true)}
            isAdmin={isAdmin}
          />
        ) : (
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500">
            No hay eventos o competencias activas. ¡Crea una nueva!
          </div>
        )}
      </div>

      {currentScoreboard && (
        <div className="space-y-7 animate-fadeIn">

          {/* BARRA NAVEGACIÓN CATEGORÍAS AMPLIADA (RANKING GRUPOS, PARTICIPANTES, DESAFÍOS, LOGS) */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl p-3 sm:p-4 rounded-3xl border-2 border-slate-200/90 dark:border-white/10 shadow-xl">
            <div className="relative flex items-center justify-between gap-2 overflow-x-auto custom-visible-scrollbar w-full md:w-auto p-1.5 -m-1.5">
              <div className="flex items-center gap-2 shrink-0">
                {[
                  { key: 'GROUPS' as const, label: 'Ranking Grupos GP', icon: Trophy, count: groupLeaderboard.length, activeColor: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-lg shadow-amber-500/35 ring-2 ring-amber-400/40' },
                  { key: 'PARTICIPANTS' as const, label: 'Ranking Participantes', icon: User, count: participantLeaderboard.length, activeColor: 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600 text-white shadow-lg shadow-fuchsia-600/35 ring-2 ring-fuchsia-400/40' },
                  { key: 'CHALLENGES' as const, label: 'Desafíos / Pruebas', icon: Target, count: currentScoreboard.challenges.length, activeColor: 'bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-lg shadow-indigo-600/35 ring-2 ring-indigo-400/40' },
                  { key: 'LOGS' as const, label: 'Historial Puntos', icon: Activity, count: currentScoreboard.groupScores.length + currentScoreboard.participantScores.length, activeColor: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/35 ring-2 ring-emerald-400/40' }
                ].map((tab) => {
                  const isActive = activeTab === tab.key;

                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`shrink-0 flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap ${isActive
                          ? `${tab.activeColor} scale-[1.02]`
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white hover:-translate-y-0.5'
                        }`}
                    >
                      <tab.icon size={17} className={`shrink-0 ${isActive ? 'animate-bounce' : ''}`} />
                      <span>{tab.label}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/25 text-white shadow-inner' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* INDICADOR VISUAL DESLIZAR PARA MÓVIL */}
              <div className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase tracking-wider shrink-0 animate-pulse select-none" title="Desliza horizontalmente para ver más pestañas">
                <span>Desliza</span>
                <ChevronsRight size={15} />
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2.5 shrink-0 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-white/5">
                <button
                  onClick={() => setIsNewChallengeModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl border-2 border-dashed border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-black uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={14} /> Nuevo Desafío
                </button>
                <button
                  onClick={() => handleDeleteScoreboardClick(currentScoreboard.id)}
                  className="p-2.5 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-900/40 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                  title="Eliminar esta competencia"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: GROUP LEADERBOARD (RANKING GRUPOS GP VIVO CON TARJETAS 3D Y ANIMACIONES) */}
          {activeTab === 'GROUPS' && (
            <div className="space-y-4">
              {groupLeaderboard.length === 0 ? (
                <div className="bg-white dark:bg-slate-900/40 rounded-3xl p-12 text-center border-2 border-slate-200 dark:border-white/5 space-y-3 shadow-sm">
                  <Trophy size={54} className="mx-auto text-amber-500 animate-bounce" />
                  <h3 className="text-base font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Aún no hay puntuaciones asignadas</h3>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 max-w-md mx-auto">
                    Haz clic en "Asignar Puntos" para empezar a calificar a los Grupos Pequeños en tiempo real.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {groupLeaderboard.map((group, idx) => {
                    const isGold = idx === 0;
                    const isSilver = idx === 1;
                    const isBronze = idx === 2;
                    const percentage = Math.min(100, Math.round((group.totalPoints / maxGroupScore) * 100));

                    return (
                      <div
                        key={group.id}
                        className={`relative rounded-3xl p-6 border-2 transition-all duration-300 hover:-translate-y-2 shadow-xl overflow-hidden group ${isGold
                            ? 'bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-amber-500/10 dark:from-amber-950/50 dark:via-orange-950/30 dark:to-amber-950/20 border-amber-500/60 ring-4 ring-amber-500/20 shadow-amber-500/20'
                            : isSilver
                              ? 'bg-gradient-to-br from-slate-200/50 via-slate-100/40 to-slate-200/20 dark:from-slate-800/50 dark:to-slate-900/30 border-slate-400 dark:border-slate-600 ring-2 ring-slate-400/20'
                              : isBronze
                                ? 'bg-gradient-to-br from-orange-200/40 via-amber-100/30 to-amber-200/10 dark:from-amber-950/40 dark:to-slate-900/30 border-amber-600/40'
                                : 'bg-white/90 dark:bg-slate-900/70 border-slate-200/90 dark:border-white/10'
                          }`}
                      >
                        {/* Position Medal Badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isGold && (
                              <span className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/40 animate-pulse">
                                🥇 1er Lugar (ORO)
                              </span>
                            )}
                            {isSilver && (
                              <span className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-slate-400 to-slate-600 text-white text-xs font-black uppercase tracking-wider shadow-md">
                                🥈 2do Lugar (PLATA)
                              </span>
                            )}
                            {isBronze && (
                              <span className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-700 via-amber-800 to-orange-900 text-white text-xs font-black uppercase tracking-wider shadow-md">
                                🥉 3er Lugar (BRONCE)
                              </span>
                            )}
                            {!isGold && !isSilver && !isBronze && (
                              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-wider">
                                Posición #{idx + 1}
                              </span>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                              {group.totalPoints.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 block uppercase tracking-widest">PTS</span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-1">
                          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider truncate">
                            {group.name.toUpperCase()}
                          </h3>
                          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 truncate">
                            Líder: {(() => {
                              let finalLeader = group.leaderName;
                              let isAssigned = finalLeader && finalLeader.trim() !== '' && !finalLeader.toLowerCase().includes('sin lider') && !finalLeader.toLowerCase().includes('sin líder');
                              
                              if (!isAssigned) {
                                const dynamicLeader = allUsers.find(u => Number(u.groupSmallId) === Number(group.id) && u.groupRole && u.groupRole.toLowerCase().includes('lider') && !u.groupRole.toLowerCase().includes('sub'));
                                if (dynamicLeader) {
                                  finalLeader = dynamicLeader.name;
                                  isAssigned = true;
                                }
                              }
                              return isAssigned ? <span className="capitalize text-slate-700 dark:text-slate-300">{finalLeader}</span> : 'Sin líder asignado';
                            })()}
                          </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4 space-y-1">
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isGold ? 'bg-gradient-to-r from-amber-500 to-orange-500' : isSilver ? 'bg-slate-400' : isBronze ? 'bg-amber-700' : 'bg-indigo-500'
                                }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400">
                              {group.scoreCount} registro(s) de puntos
                            </span>
                            <button
                              onClick={() => openAwardModalForGroup(group)}
                              className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              + Puntos rápidos
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PARTICIPANTS LEADERBOARD */}
          {activeTab === 'PARTICIPANTS' && (
            <div className="space-y-4">
              {participantLeaderboard.length === 0 ? (
                <div className="bg-white dark:bg-slate-900/40 rounded-3xl p-12 text-center border-2 border-slate-200 dark:border-white/5 space-y-3">
                  <User size={54} className="mx-auto text-fuchsia-500 animate-pulse" />
                  <h3 className="text-base font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Sin puntos individuales registrados</h3>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 max-w-md mx-auto">
                    Los administradores pueden otorgar puntos individuales a participantes por desempeño en pruebas.
                  </p>
                </div>
              ) : (
                <div className="bg-white/95 dark:bg-slate-900/80 rounded-3xl border-2 border-slate-200/90 dark:border-white/10 shadow-xl overflow-hidden">
                  <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {participantLeaderboard.map((part, idx) => (
                      <div key={part.id} className="p-4 flex items-center justify-between gap-3 hover:bg-indigo-50/40 dark:hover:bg-white/[0.03] transition">
                        <div className="flex items-center gap-4 min-w-0">
                          <span className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${idx === 0 ? 'bg-amber-500 text-white shadow-md' : idx === 1 ? 'bg-slate-400 text-white' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider truncate">{part.name}</p>
                              {part.groupRole && (
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${part.groupRole.toLowerCase().includes('lider') && !part.groupRole.toLowerCase().includes('sub')
                                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                                    : part.groupRole.toLowerCase().includes('sub')
                                      ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40'
                                      : part.groupRole.toLowerCase().includes('secretar')
                                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                                        : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                                  }`}>
                                  {part.groupRole.toLowerCase().includes('lider') && !part.groupRole.toLowerCase().includes('sub') ? '👑 ' : part.groupRole.toLowerCase().includes('sub') ? '⭐ ' : part.groupRole.toLowerCase().includes('secretar') ? '📜 ' : '👤 '}
                                  {part.groupRole}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest truncate">{part.groupName}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">
                            {part.totalPoints.toLocaleString()} PTS
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CHALLENGES LIST */}
          {activeTab === 'CHALLENGES' && (
            <div className="space-y-4">
              {/* Category Filter Pills & Manager Button Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/80 p-3 rounded-3xl border-2 border-slate-200/80 dark:border-white/10 shadow-md">
                <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto custom-visible-scrollbar pb-1 max-w-full">
                  <span className="text-[10px] font-black uppercase text-slate-400 mr-1 flex items-center gap-1">
                    <Filter size={12} /> Categorías:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter('TODAS')}
                    className={`px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${selectedCategoryFilter === 'TODAS'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                  >
                    Todas ({currentScoreboard?.challenges?.length || 0})
                  </button>
                  {challengeCategoriesList.map((cat) => {
                    const count = currentScoreboard?.challenges?.filter(c => c.category === cat).length || 0;
                    if (count === 0 && selectedCategoryFilter !== cat) return null;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${selectedCategoryFilter === cat
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                      >
                        <span>{cat}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${selectedCategoryFilter === cat ? 'bg-white/20 text-white' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsCategoryManagerOpen(true)}
                    className="px-3.5 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 border border-indigo-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shrink-0"
                  >
                    <Tag size={12} /> ⚙️ Gestionar Categorías
                  </button>
                )}
              </div>

              {filteredChallenges.length === 0 ? (
                <div className="bg-white dark:bg-slate-900/40 rounded-3xl p-12 text-center border-2 border-slate-200 dark:border-white/5 space-y-3">
                  <Target size={54} className="mx-auto text-indigo-500 animate-pulse" />
                  <h3 className="text-base font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {selectedCategoryFilter !== 'TODAS' ? `No hay desafíos en la categoría "${selectedCategoryFilter}"` : 'No hay desafíos o pruebas creadas'}
                  </h3>
                  {isAdmin && (
                    <button
                      onClick={() => setIsNewChallengeModalOpen(true)}
                      className="px-5 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-wider shadow-lg hover:bg-indigo-700 transition cursor-pointer"
                    >
                      + Crear Primer Desafío
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredChallenges.map((ch) => (
                    <div key={ch.id} className="group bg-white dark:bg-slate-900 rounded-[2rem] p-1.5 relative overflow-hidden border border-slate-200/70 dark:border-white/10 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300">
                      {/* Decorative Background Gradient (Premium touch) */}
                      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/10 dark:to-purple-500/10 blur-3xl pointer-events-none transition-transform group-hover:scale-150 duration-700 ease-out" />
                      
                      <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl rounded-[1.6rem] p-5 sm:p-6 h-full flex flex-col justify-between relative z-10 border border-white/50 dark:border-white/5">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-800/50 shadow-sm">
                              {ch.category}
                            </span>
                            <div className="flex flex-col items-end">
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Máximo</span>
                              <span className="text-sm font-black text-slate-800 dark:text-slate-200 leading-none mt-0.5">
                                {ch.maxPoints} <span className="text-[10px] text-slate-400">PTS</span>
                              </span>
                            </div>
                          </div>
                          <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {ch.title}
                          </h4>
                          {ch.description && (
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                              {ch.description}
                            </p>
                          )}
                        </div>

                        {isAdmin && (
                          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
                            <button
                              onClick={() => openAssignModalForChallenge(ch)}
                              className="flex-1 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 dark:shadow-indigo-600/20 transition-all active:scale-95 border border-transparent"
                            >
                              <Target size={14} className="opacity-80" /> Completado
                            </button>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => openEditChallengeModal(ch)}
                                className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/50 dark:hover:text-indigo-400 transition-colors border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-200 dark:hover:border-indigo-800 shadow-sm"
                                title="Editar desafío"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteChallengeClick(ch.id)}
                                className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/50 dark:hover:text-rose-400 transition-colors border border-slate-200/80 dark:border-slate-700/80 hover:border-rose-200 dark:hover:border-rose-800 shadow-sm"
                                title="Eliminar desafío"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LOGS */}
          {activeTab === 'LOGS' && (
            <div className="space-y-4">
              <div className="bg-white/95 dark:bg-slate-900/80 rounded-3xl border-2 border-slate-200/90 dark:border-white/10 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-white/5 font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Historial en Tiempo Real de Puntos Otorgados
                </div>
                <div className="flex flex-col gap-2 p-3 max-h-[36rem] overflow-y-auto custom-visible-scrollbar">
                  {allCombinedLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-semibold text-xs">
                      Aún no hay puntos asignados.
                    </div>
                  ) : (
                    allCombinedLogs.map((log) => {
                      const isPositive = log.points >= 0;
                      return (
                        <div 
                          key={`${log.type}-${log.id}`} 
                          className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100/80 dark:border-white/5 transition-all duration-300 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-lg group"
                        >
                          {/* Log Info */}
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            {/* Icon Indicator */}
                            <div className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center text-white shadow-md transform transition-transform group-hover:scale-105 group-hover:rotate-3 ${isPositive 
                                ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/30' 
                                : 'bg-gradient-to-br from-rose-400 to-red-500 shadow-rose-500/30'
                              }`}
                            >
                              {log.type === 'GROUP' ? <Users size={18} className="stroke-[2.5]" /> : <User size={18} className="stroke-[2.5]" />}
                            </div>
                            
                            {/* Text Content */}
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {log.type === 'GROUP' ? (
                                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-[9px] uppercase tracking-wider border border-indigo-500/20">
                                    Grupo GP
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 font-black text-[9px] uppercase tracking-wider border border-fuchsia-500/20">
                                    Participante
                                  </span>
                                )}
                                <span className="font-black text-sm text-slate-800 dark:text-white uppercase truncate">{log.targetName}</span>
                              </div>
                              <p className="text-[13px] text-slate-600 dark:text-slate-300 font-semibold leading-snug max-w-lg">
                                {log.reason}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                <span className="flex items-center gap-1"><Zap size={10} className={isPositive ? 'text-amber-500' : 'text-slate-400'} /> {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                <span className="text-slate-500 dark:text-slate-400 font-black">{log.awardedByName}</span>
                              </div>
                            </div>
                          </div>

                          {/* Points & Actions */}
                          <div className="flex items-center justify-between sm:justify-end gap-5 pl-14 sm:pl-0">
                            {/* Points Badge */}
                            <div className={`px-4 py-2 rounded-2xl border-2 flex items-center justify-center font-black text-lg tracking-tight shadow-sm ${isPositive 
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400' 
                                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {isPositive ? `+${log.points}` : log.points} <span className="text-[10px] ml-1 opacity-70">PTS</span>
                            </div>

                            {/* Admin Actions */}
                            {isAdmin && (
                              <div className="flex items-center gap-1.5 ml-2">
                                <button
                                  onClick={() => openEditScoreModal(log.id, log.type, log.targetName, log.points, log.reason)}
                                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:scale-110 transition-all cursor-pointer border border-indigo-100 dark:border-indigo-800 shadow-sm"
                                  title="Editar puntuación"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => log.type === 'GROUP'
                                    ? handleDeleteGroupScoreClick(log.id, log.targetName, log.points)
                                    : handleDeleteParticipantScoreClick(log.id, log.targetName, log.points)
                                  }
                                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:scale-110 transition-all cursor-pointer border border-rose-100 dark:border-rose-800 shadow-sm"
                                  title="Eliminar puntuación"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODAL EDIT AWARDED SCORE LOG */}
      {isEditScoreModalOpen && editScoreLogData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsEditScoreModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 max-w-lg w-full relative z-10 border-2 border-indigo-500/30 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-violet-600 text-white flex items-center justify-center shadow-md">
                  <Edit2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900 dark:text-white tracking-wider">Editar Puntuación</h3>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Modificar registro de {editScoreLogData.type === 'GROUP' ? 'Grupo Pequeño' : 'Participante'}: <strong className="text-indigo-600 dark:text-indigo-400 uppercase">{editScoreLogData.targetName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditScoreModalOpen(false)}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateScoreSubmit} className="space-y-5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <Trophy size={12} /> Cantidad de Puntos (PTS)
                </label>
                <input
                  type="number"
                  required
                  value={editScorePointsInput}
                  onChange={(e) => setEditScorePointsInput(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-white/10 p-3.5 rounded-2xl font-black text-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition"
                />

                {/* Preset Quick Points */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[10, 25, 50, 100, 200, 500, 1000, 1500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditScorePointsInput(preset)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${editScorePointsInput === preset
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <FileText size={12} /> Motivo / Descripción
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Desafío Completado / Puntualidad / Carrera de Obstáculos"
                  value={editScoreReasonInput}
                  onChange={(e) => setEditScoreReasonInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-white/10 p-3.5 rounded-2xl font-bold text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsEditScoreModalOpen(false)}
                  className="px-5 py-3 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION / ALERT MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))} />
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full relative z-10 border-2 border-slate-200 dark:border-white/10 shadow-2xl space-y-4 text-center select-none transform transition-all scale-100">

            {/* Header Icon */}
            <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center shadow-lg ${confirmModal.variant === 'warning'
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-amber-500/10'
                : 'bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-rose-500/10'
              }`}>
              {confirmModal.variant === 'warning' ? (
                <AlertTriangle size={26} className="animate-pulse" />
              ) : (
                <Trash2 size={26} className="animate-bounce" />
              )}
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {confirmModal.title}
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed px-1">
                {confirmModal.message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 py-3 rounded-2xl border-2 border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-wider transition active:scale-95 cursor-pointer"
              >
                {confirmModal.cancelText || 'Cancelar'}
              </button>

              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-3 rounded-2xl text-white text-xs font-black uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-lg ${confirmModal.variant === 'warning'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30'
                    : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/30'
                  }`}
              >
                {confirmModal.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: NEW SCOREBOARD COMPETITION */}
      {isNewScoreboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setIsNewScoreboardModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full relative z-10 border-2 border-slate-200 dark:border-white/10 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar">

            {/* Header del Modal */}
            <div className="flex items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
                  <Trophy size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-lg font-black uppercase bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-400 dark:to-violet-400 tracking-wider truncate">
                    Nueva Competencia / Evento
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider truncate">
                    Recreativo, Social, Educativo o Espiritual
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewScoreboardModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateScoreboardSubmit} className="space-y-5 text-xs font-semibold text-slate-600 dark:text-slate-300">

              {/* FILA 1: TÍTULO Y TIPO DE EVENTO EN GRID DE 2 COLUMNAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* TÍTULO */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Título de la Competencia</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Campamento Maranatha 2026 / Rally Deportivo"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50/90 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-white/10 p-3.5 rounded-2xl font-bold text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition-all duration-200 shadow-sm"
                  />
                </div>

                {/* TIPO DE EVENTO */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Tipo de Evento</label>
                    {!isCreatingCustomType && (
                      <button
                        type="button"
                        onClick={() => setIsCreatingCustomType(true)}
                        className="text-[10px] font-black text-violet-600 dark:text-violet-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Plus size={12} /> Crear nuevo tipo
                      </button>
                    )}
                  </div>

                  {isCreatingCustomType ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej. Torneo Ajedrez..."
                        value={customTypeInput}
                        onChange={(e) => setCustomTypeInput(e.target.value)}
                        className="flex-1 bg-indigo-500/5 dark:bg-slate-800 border-2 border-indigo-500 p-3 rounded-2xl font-bold text-xs text-slate-800 dark:text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customTypeInput.trim()) {
                            const val = customTypeInput.trim();
                            if (!eventTypesList.includes(val)) {
                              setEventTypesList(prev => [...prev, val]);
                            }
                            setNewEventType(val);
                            setCustomTypeInput('');
                            setIsCreatingCustomType(false);
                            triggerToast(`Tipo de evento "${val}" agregado.`);
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase cursor-pointer shadow-md"
                      >
                        Agregar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreatingCustomType(false)}
                        className="px-2.5 py-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <CustomSelectCombobox
                      value={newEventType}
                      options={eventTypesList}
                      onChange={(val) => setNewEventType(val)}
                      onCreateNew={() => setIsCreatingCustomType(true)}
                    />
                  )}
                </div>
              </div>

              {/* DESCRIPCIÓN */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Descripción o Reglas Generales</label>
                <textarea
                  rows={2}
                  placeholder="Describe el objetivo y reglas principales..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-50/90 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-white/10 p-3.5 rounded-2xl font-medium text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition-all duration-200 resize-none shadow-sm"
                />
              </div>

              {/* PREVISUALIZADOR PROMINENTE DE IMAGEN Y MULTIMEDIA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* UPLOAD LOGO / IMAGE */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">Logo / Imagen del Evento</label>
                  {newImageUrl ? (
                    <div className="rounded-2xl border-2 border-indigo-500 overflow-hidden shadow-lg bg-slate-50 dark:bg-slate-800 p-2.5 space-y-2">
                      <div className="relative h-32 w-full rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-900 flex items-center justify-center p-1">
                        <img
                          src={resolveFileUrl(newImageUrl)}
                          alt="Preview del Evento"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-500/30">
                          <Check size={12} /> Imagen Cargada
                        </span>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={resolveFileUrl(newImageUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1"
                          >
                            <Eye size={12} /> Ver
                          </a>
                          <label className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider shadow-sm transition cursor-pointer flex items-center gap-1">
                            {uploadingImage ? 'Subiendo...' : 'Cambiar'}
                            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUploadImageFile(e.target.files[0], false)} className="hidden" />
                          </label>
                          <button
                            type="button"
                            onClick={() => setNewImageUrl('')}
                            className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
                            title="Remover imagen"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-indigo-500/50 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider text-center cursor-pointer transition-all active:scale-95 shadow-sm space-y-2 h-44">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <ImageIcon size={22} />
                      </div>
                      <span>{uploadingImage ? 'Subiendo...' : 'Subir Imagen / Logo del Evento'}</span>
                      <span className="text-[9px] text-slate-400 font-semibold normal-case">Portada en PNG, JPG o WEBP</span>
                      <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUploadImageFile(e.target.files[0], false)} className="hidden" />
                    </label>
                  )}
                </div>

                {/* UPLOAD CONVOCATORIA PDF */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">Convocatoria en PDF (Opcional)</label>
                  <label className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-violet-500/50 bg-violet-500/5 hover:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-black uppercase tracking-wider text-center cursor-pointer transition-all active:scale-95 shadow-sm space-y-2 h-44">
                    <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-500">
                      <FileText size={22} />
                    </div>
                    <span>{uploadingPdf ? 'Subiendo...' : newPdfUrl ? '📄 PDF Cargado ✓' : 'Subir Convocatoria PDF'}</span>
                    <span className="text-[9px] text-slate-400 font-semibold normal-case">Reglamento o base oficial en PDF</span>
                    <input type="file" accept="application/pdf" onChange={(e) => e.target.files?.[0] && handleUploadPdfFile(e.target.files[0], false)} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-white/5">
                <button type="button" onClick={() => setIsNewScoreboardModalOpen(false)} className="px-5 py-3 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-xs font-bold uppercase cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">Cancelar</button>
                <button type="submit" className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-indigo-600/30">Crear Competencia</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT SCOREBOARD COMPETITION */}
      {isEditScoreboardModalOpen && currentScoreboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setIsEditScoreboardModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full relative z-10 border-2 border-slate-200 dark:border-white/10 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar">

            <div className="flex items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
                  <Edit2 size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-lg font-black uppercase bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-400 dark:to-violet-400 tracking-wider truncate">
                    Editar Evento / Competencia
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider truncate">
                    Actualiza los datos, tipo, imágenes o PDF
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditScoreboardModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditScoreboardSubmit} className="space-y-5 text-xs font-semibold text-slate-600 dark:text-slate-300">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Título del Evento</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-50/90 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-white/10 p-3.5 rounded-2xl font-bold text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
                  />
                </div>

                {/* TIPO CON COMBOBOX PERSONALIZADO */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Tipo de Evento</label>
                  </div>
                  {isCreatingCustomTypeEdit ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nuevo tipo..."
                        value={customTypeInputEdit}
                        onChange={(e) => setCustomTypeInputEdit(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border-2 border-indigo-500 p-3 rounded-2xl text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customTypeInputEdit.trim()) {
                            const val = customTypeInputEdit.trim();
                            if (!eventTypesList.includes(val)) {
                              setEventTypesList(prev => [...prev, val]);
                            }
                            setEditEventType(val);
                            setCustomTypeInputEdit('');
                            setIsCreatingCustomTypeEdit(false);
                          }
                        }}
                        className="px-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-bold"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <CustomSelectCombobox
                      value={editEventType}
                      options={eventTypesList}
                      onChange={(val) => setEditEventType(val)}
                      onCreateNew={() => setIsCreatingCustomTypeEdit(true)}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Estado del Evento</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 p-3.5 rounded-2xl font-bold text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer appearance-none"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="FINALIZADO">FINALIZADO</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Descripción</label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 p-3.5 rounded-2xl font-medium text-xs text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* EDIT LOGO & CONVOCATORIA PDF */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* EDIT LOGO / IMAGE */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">Logo / Imagen del Evento</label>
                  {editImageUrl ? (
                    <div className="rounded-2xl border-2 border-indigo-500 overflow-hidden shadow-lg bg-slate-50 dark:bg-slate-800 p-2.5 space-y-2">
                      <div className="relative h-32 w-full rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-900 flex items-center justify-center p-1">
                        <img
                          src={resolveFileUrl(editImageUrl)}
                          alt="Preview del Evento"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-500/30">
                          <Check size={12} /> Imagen Cargada
                        </span>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={resolveFileUrl(editImageUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1"
                          >
                            <Eye size={12} /> Ver
                          </a>
                          <label className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider shadow-sm transition cursor-pointer flex items-center gap-1">
                            {uploadingImage ? 'Subiendo...' : 'Cambiar'}
                            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUploadImageFile(e.target.files[0], true)} className="hidden" />
                          </label>
                          <button
                            type="button"
                            onClick={() => setEditImageUrl('')}
                            className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
                            title="Remover imagen"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-indigo-500/50 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider text-center cursor-pointer transition-all active:scale-95 shadow-sm space-y-2 h-44">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <ImageIcon size={22} />
                      </div>
                      <span>{uploadingImage ? 'Subiendo...' : 'Subir Imagen / Logo del Evento'}</span>
                      <span className="text-[9px] text-slate-400 font-semibold normal-case">Portada en PNG, JPG o WEBP</span>
                      <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUploadImageFile(e.target.files[0], true)} className="hidden" />
                    </label>
                  )}
                </div>

                {/* EDIT CONVOCATORIA PDF */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">Convocatoria PDF</label>
                  <label className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-rose-500/50 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider text-center cursor-pointer transition-all active:scale-95 shadow-sm space-y-2 h-44">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                      <FileText size={22} />
                    </div>
                    <span>{uploadingPdf ? 'Subiendo...' : editPdfUrl ? '📄 PDF Cargado ✓' : 'Subir Convocatoria PDF'}</span>
                    <span className="text-[9px] text-slate-400 font-semibold normal-case">Reglamento o base oficial en PDF</span>
                    <input type="file" accept="application/pdf" onChange={(e) => e.target.files?.[0] && handleUploadPdfFile(e.target.files[0], true)} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-white/5">
                <button type="button" onClick={() => setIsEditScoreboardModalOpen(false)} className="px-5 py-3 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-xs font-bold uppercase cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">Cancelar</button>
                <button type="submit" className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-md shadow-indigo-500/25 transition">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NEW CHALLENGE */}
      {isNewChallengeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsNewChallengeModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 max-w-2xl w-full sm:w-[620px] max-h-[90vh] overflow-y-auto no-scrollbar my-auto relative z-10 border-2 border-indigo-500/30 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900 dark:text-white tracking-wider">Nuevo Desafío / Prueba</h3>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Crea una nueva competencia o tarea asignable</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewChallengeModalOpen(false)}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateChallengeSubmit} className="space-y-5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} /> Nombre del Desafío
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carrera de Obstáculos / Cuestionario Espiritual / Canto Coral"
                  value={challengeTitle}
                  onChange={(e) => setChallengeTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-white/10 p-3.5 rounded-2xl font-bold text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                    <Tag size={12} /> Categoría
                  </label>
                  <CategorySelectCombobox
                    value={challengeCategory}
                    onChange={(cat) => setChallengeCategory(cat)}
                    categories={challengeCategoriesList}
                    onManageCategories={() => setIsCategoryManagerOpen(true)}
                    dropDirection="down"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                    <Trophy size={12} /> Puntaje Máximo
                  </label>
                  <input
                    type="number"
                    value={challengeMaxPoints}
                    onChange={(e) => setChallengeMaxPoints(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-white/10 p-3.5 rounded-2xl font-bold text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsNewChallengeModalOpen(false)}
                  className="px-5 py-3 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  + Agregar Desafío
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT CHALLENGE */}
      {isEditChallengeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsEditChallengeModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 max-w-2xl w-full sm:w-[620px] max-h-[90vh] overflow-y-auto no-scrollbar my-auto relative z-10 border-2 border-indigo-500/30 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 text-white flex items-center justify-center shadow-md">
                  <Edit2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900 dark:text-white tracking-wider">Editar Desafío</h3>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Modifica el nombre, reglas, categoría o puntaje</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditChallengeModalOpen(false)}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateChallengeSubmit} className="space-y-5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} /> Nombre del Desafío
                </label>
                <input
                  type="text"
                  required
                  value={editChallengeTitle}
                  onChange={(e) => setEditChallengeTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-white/10 p-3.5 rounded-2xl font-bold text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <FileText size={12} /> Descripción / Reglas
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles opcionales sobre cómo ganar o completar el desafío..."
                  value={editChallengeDescription}
                  onChange={(e) => setEditChallengeDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-white/10 p-3.5 rounded-2xl font-bold text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                    <Tag size={12} /> Categoría
                  </label>
                  <CategorySelectCombobox
                    value={editChallengeCategory}
                    onChange={(cat) => setEditChallengeCategory(cat)}
                    categories={challengeCategoriesList}
                    onManageCategories={() => setIsCategoryManagerOpen(true)}
                    dropDirection="down"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                    <Trophy size={12} /> Puntaje Máximo
                  </label>
                  <input
                    type="number"
                    value={editChallengeMaxPoints}
                    onChange={(e) => setEditChallengeMaxPoints(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-white/10 p-3.5 rounded-2xl font-bold text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsEditChallengeModalOpen(false)}
                  className="px-5 py-3 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CATEGORY MANAGER */}
      {isCategoryManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsCategoryManagerOpen(false)} />
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 max-w-2xl w-full sm:w-[620px] max-h-[90vh] overflow-y-auto no-scrollbar relative z-10 border-2 border-indigo-500/30 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-violet-600 text-white flex items-center justify-center shadow-md">
                  <Tag size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900 dark:text-white tracking-wider">Gestionar Categorías de Desafíos</h3>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Crea, edita o elimina las categorías globales de pruebas</p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryManagerOpen(false)}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Create New Category Bar */}
            <div className="flex gap-2.5">
              <input
                type="text"
                placeholder="Nombre de nueva categoría..."
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateCategory(newCatInput);
                  }
                }}
                className="flex-1 bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-white/10 px-4 py-3 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition"
              />
              <button
                type="button"
                onClick={() => handleCreateCategory(newCatInput)}
                className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-500/25 transition cursor-pointer shrink-0 flex items-center gap-1.5 hover:scale-[1.02] active:scale-95"
              >
                <Plus size={16} /> Crear
              </button>
            </div>

            {/* Categories List */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto custom-visible-scrollbar pr-1.5">
              <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">Categorías Existentes ({challengeCategoriesList.length})</label>

              {challengeCategoriesList.map((cat) => {
                const isEditing = editingCategoryOldName === cat;
                const count = currentScoreboard?.challenges?.filter(c => c.category === cat).length || 0;

                return (
                  <div key={cat} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 hover:border-indigo-500/40 transition">
                    {isEditing ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={editingCategoryNewName}
                          onChange={(e) => setEditingCategoryNewName(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-900 border-2 border-indigo-500 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRenameCategorySubmit(cat)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase cursor-pointer transition shadow-md"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategoryOldName(null)}
                          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-[11px] font-bold cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                            <Tag size={14} />
                          </div>
                          <span className="font-bold text-xs uppercase text-slate-800 dark:text-white truncate">{cat}</span>
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                            {count} {count === 1 ? 'desafío' : 'desafíos'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategoryOldName(cat);
                              setEditingCategoryNewName(cat);
                            }}
                            className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition cursor-pointer"
                            title="Editar nombre de categoría"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition cursor-pointer"
                            title="Eliminar categoría"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCategoryManagerOpen(false)}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AWARD POINTS (REAL-TIME SCORING) */}
      {isAwardModalOpen && currentScoreboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsAwardModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 max-w-2xl w-full sm:w-[620px] max-h-[90vh] overflow-y-auto no-scrollbar relative z-10 border-2 border-violet-500/30 shadow-2xl space-y-5">
            <div className="flex items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                  <Zap size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black uppercase text-slate-900 dark:text-white tracking-wider truncate">Asignar Puntos en Tiempo Real</h3>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">Otorga puntos instantáneos a grupos o integrantes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAwardModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAwardSubmit} className="space-y-5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {/* Type Switcher - Hidden if a specific group context was passed (Quick Points from Card) */}
              {!awardContextGroup && (
                <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1.5 border-2 border-slate-200 dark:border-white/5 gap-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setAwardTargetType('GROUP');
                      setAwardTargetId('');
                    }}
                    className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer min-w-0 ${awardTargetType === 'GROUP'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                  >
                    <Users size={14} className="shrink-0" />
                    <span className="truncate">Grupo Pequeño (GP)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAwardTargetType('PARTICIPANT');
                      setAwardTargetId('');
                    }}
                    className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer min-w-0 ${awardTargetType === 'PARTICIPANT'
                        ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                  >
                    <User size={14} className="shrink-0" />
                    <span className="truncate">Participante / Integrante</span>
                  </button>
                </div>
              )}

              {/* Target Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-wider flex items-center gap-1.5">
                  <Target size={12} /> {awardContextGroup ? 'Grupo Pequeño Destino' : awardTargetType === 'GROUP' ? 'Seleccionar Grupo Pequeño' : 'Seleccionar Participante'}
                </label>

                {awardContextGroup ? (
                  <div className="w-full bg-slate-50 dark:bg-slate-800/90 border-2 border-amber-500/50 p-3.5 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center text-xs font-black shadow-sm shrink-0">
                      G
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">Grupo GP</span>
                      <span className="text-sm font-extrabold uppercase text-slate-800 dark:text-white truncate">
                        {awardContextGroup.name}
                      </span>
                    </div>
                    <div className="ml-auto">
                      <span className="text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 px-2.5 py-1 rounded-full border border-amber-500/20">Fijo</span>
                    </div>
                  </div>
                ) : awardTargetType === 'GROUP' ? (
                  <CustomTargetSelectCombobox
                    value={awardTargetId}
                    options={availableGroupOptions}
                    placeholder="-- Elige un Grupo GP --"
                    onChange={(id) => setAwardTargetId(id)}
                    iconType="group"
                  />
                ) : (
                  <CustomTargetSelectCombobox
                    value={awardTargetId}
                    options={availableParticipantOptions}
                    placeholder="-- Elige un Participante --"
                    onChange={(id) => setAwardTargetId(id)}
                    iconType="participant"
                  />
                )}
              </div>

              {/* Quick Points Preset */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-wider flex items-center gap-1.5">
                  <Trophy size={12} /> Cantidad de Puntos
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[10, 25, 50, 100].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAwardPoints(p)}
                      className={`py-2.5 rounded-xl font-black text-xs border-2 transition cursor-pointer ${awardPoints === p
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500 shadow-md ring-2 ring-amber-500/30'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400'
                        }`}
                    >
                      +{p} PTS
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  required
                  value={awardPoints}
                  onChange={(e) => setAwardPoints(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-white/10 p-3.5 rounded-2xl font-black text-base text-indigo-600 dark:text-indigo-400 text-center focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition"
                />
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-wider flex items-center gap-1.5">
                  <FileText size={12} /> Motivo / Concepto del Puntaje
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 1er lugar en rally / Asistencia completa / Puntualidad"
                  value={awardReason}
                  onChange={(e) => setAwardReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-white/10 p-3.5 rounded-2xl font-bold text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAwardModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-violet-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Zap size={15} /> Otorgar Puntos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ASIGNAR DESAFÍO CREADO (DESAFÍO COMPLETADO EN TIEMPO REAL) */}
      {isAssignChallengeModalOpen && currentScoreboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setIsAssignChallengeModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 max-w-2xl w-full relative z-10 border-2 border-indigo-500/30 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/5 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 shrink-0">
                  <Target size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-wider truncate">
                    Asignar Desafío Completado
                  </h3>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest truncate">
                    Sincronización en Tiempo Real con Puntuaciones
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignChallengeModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignChallengeSubmit} className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {/* Challenge Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                  Desafío a Otorgar
                </label>
                {currentScoreboard.challenges.length === 0 ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs font-bold text-amber-600 dark:text-amber-400">
                    No hay desafíos creados aún en esta competencia.
                  </div>
                ) : (
                  <CustomTargetSelectCombobox
                    value={selectedChallengeForAssign ? String(selectedChallengeForAssign.id) : ''}
                    options={currentScoreboard.challenges.map((c) => ({
                      id: c.id,
                      name: c.title,
                      subname: `${c.category} • Máx ${c.maxPoints} PTS`
                    }))}
                    placeholder="-- Selecciona un Desafío Creado --"
                    onChange={(id) => {
                      const ch = currentScoreboard.challenges.find((c) => String(c.id) === id);
                      if (ch) {
                        setSelectedChallengeForAssign(ch);
                        setAssignPoints(ch.maxPoints);
                        setAssignNotes(`Desafío Completado: ${ch.title}`);
                      }
                    }}
                    iconType="group"
                  />
                )}
              </div>

              {/* Recipient Type Switcher */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                  Asignar A (Destinatario)
                </label>
                <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1.5 border-2 border-slate-200 dark:border-white/5 gap-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => { setAssignTargetType('GROUP'); setAssignGroupIds([]); setAssignUserIds([]); setAssignSearch(''); }}
                    className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer min-w-0 ${assignTargetType === 'GROUP' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    <Users size={14} className="shrink-0" />
                    <span className="truncate">Grupo Pequeño (GP)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAssignTargetType('PARTICIPANT'); setAssignGroupIds([]); setAssignUserIds([]); setAssignSearch(''); }}
                    className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer min-w-0 ${assignTargetType === 'PARTICIPANT' ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    <User size={14} className="shrink-0" />
                    <span className="truncate">Participante</span>
                  </button>
                </div>
              </div>

              {/* Target Checkbox List */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o rol..."
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 pl-9 pr-8 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                  {assignSearch && (
                    <button
                      type="button"
                      onClick={() => setAssignSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (assignTargetType === 'GROUP') {
                        const visibleGroupIds = allGroups
                          .filter((g) => g.name.toLowerCase().includes(assignSearch.toLowerCase()))
                          .map((g) => g.id);
                        setAssignGroupIds(Array.from(new Set([...assignGroupIds, ...visibleGroupIds])));
                      } else {
                        const visibleUserIds = allUsers
                          .filter((u) =>
                            u.name.toLowerCase().includes(assignSearch.toLowerCase()) ||
                            (u.groupRole && u.groupRole.toLowerCase().includes(assignSearch.toLowerCase()))
                          )
                          .map((u) => u.id);
                        setAssignUserIds(Array.from(new Set([...assignUserIds, ...visibleUserIds])));
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 text-[11px] font-black uppercase tracking-wider cursor-pointer transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={13} className="shrink-0" /> Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (assignTargetType === 'GROUP') {
                        setAssignGroupIds([]);
                      } else {
                        setAssignUserIds([]);
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 text-[11px] font-black uppercase tracking-wider cursor-pointer transition flex items-center gap-1.5"
                  >
                    <X size={13} className="shrink-0" /> Ninguno
                  </button>
                </div>
              </div>

              {/* Selection List Container */}
              <div className="flex-1 overflow-y-auto max-h-56 space-y-2 p-1 pr-2 border-2 border-slate-100 dark:border-white/5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40">
                {assignTargetType === 'GROUP' ? (
                  allGroups
                    .filter((g) => g.name.toLowerCase().includes(assignSearch.toLowerCase()))
                    .map((g) => {
                      const isSelected = assignGroupIds.includes(g.id);
                      return (
                        <label
                          key={g.id}
                          className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer ${isSelected
                              ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-600/15 border-amber-500/50 text-slate-900 dark:text-white font-black shadow-md'
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-amber-400/50'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                setAssignGroupIds((prev) =>
                                  e.target.checked ? [...prev, g.id] : prev.filter((id) => id !== g.id)
                                );
                              }}
                              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                            />
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center text-xs font-black shadow-sm">
                              {g.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-extrabold uppercase tracking-wider">{g.name}</span>
                          </div>
                          {isSelected && <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">Seleccionado</span>}
                        </label>
                      );
                    })
                ) : (
                  allUsers
                    .filter((u) =>
                      u.name.toLowerCase().includes(assignSearch.toLowerCase()) ||
                      (u.groupRole && u.groupRole.toLowerCase().includes(assignSearch.toLowerCase()))
                    )
                    .map((u) => {
                      const isSelected = assignUserIds.includes(u.id);
                      const roleName = u.groupRole || 'Integrante';

                      return (
                        <label
                          key={u.id}
                          className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer ${isSelected
                              ? 'bg-gradient-to-r from-fuchsia-600/15 via-purple-600/15 to-indigo-600/15 border-fuchsia-500/50 text-slate-900 dark:text-white font-black shadow-md'
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-fuchsia-400/50'
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                setAssignUserIds((prev) =>
                                  e.target.checked ? [...prev, u.id] : prev.filter((id) => id !== u.id)
                                );
                              }}
                              className="w-4 h-4 rounded text-fuchsia-600 focus:ring-fuchsia-500 accent-fuchsia-500 cursor-pointer"
                            />
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white flex items-center justify-center text-xs font-black shadow-sm shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-extrabold uppercase tracking-wider truncate">{u.name}</span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${roleName.toLowerCase().includes('lider') && !roleName.toLowerCase().includes('sub')
                                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                                    : roleName.toLowerCase().includes('sub')
                                      ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40'
                                      : roleName.toLowerCase().includes('secretar')
                                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                                  }`}>
                                  {roleName.toLowerCase().includes('lider') && !roleName.toLowerCase().includes('sub') ? '👑 ' : roleName.toLowerCase().includes('sub') ? '⭐ ' : roleName.toLowerCase().includes('secretar') ? '📜 ' : '👤 '}
                                  {roleName}
                                </span>
                              </div>
                            </div>
                          </div>
                          {isSelected && <span className="text-[10px] font-black uppercase text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded-full border border-fuchsia-500/30">Seleccionado</span>}
                        </label>
                      );
                    })
                )}
              </div>

              {/* Points & Custom Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                    Puntos a Otorgar
                  </label>
                  <input
                    type="number"
                    required
                    value={assignPoints}
                    onChange={(e) => setAssignPoints(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 p-3 rounded-2xl font-black text-sm text-indigo-600 dark:text-indigo-400 text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                    Motivo / Detalle
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Completó desafío en tiempo récord"
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 p-3 rounded-2xl font-bold text-xs text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAssignChallengeModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/5 cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedChallengeForAssign || (assignTargetType === 'GROUP' ? assignGroupIds.length === 0 : assignUserIds.length === 0) || isAssignSubmitting}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white text-xs font-black uppercase tracking-wider shadow-xl shadow-emerald-600/30 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Target size={16} /> {isAssignSubmitting ? 'Asignando...' : 'Confirmar & Sincronizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: BULK POINTS ASSIGNMENT (ASIGNACIÓN MÚLTIPLE EN TIEMPO REAL) */}
      {isBulkAwardModalOpen && currentScoreboard && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] border-2 border-fuchsia-500/30 shadow-2xl w-full max-w-2xl overflow-hidden p-4 sm:p-7 space-y-4 sm:space-y-5 max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/5 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-fuchsia-600 via-pink-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-fuchsia-600/30 shrink-0">
                  <Sparkles size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black uppercase text-slate-800 dark:text-white tracking-wider truncate">
                    Asignación Múltiple en Tiempo Real
                  </h3>
                  <p className="text-[10px] font-bold text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-widest truncate">
                    Otorga Puntos a Varios Grupos o Participantes
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkAwardModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Target Type Switcher Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => setBulkTargetType('GROUPS')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${bulkTargetType === 'GROUPS'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 scale-[1.02]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
              >
                <Users size={15} /> Múltiples Grupos Pequeños ({selectedGroupIds.length})
              </button>
              <button
                type="button"
                onClick={() => setBulkTargetType('PARTICIPANTS')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${bulkTargetType === 'PARTICIPANTS'
                    ? 'bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-fuchsia-600/20 scale-[1.02]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
              >
                <User size={15} /> Múltiples Participantes ({selectedUserIds.length})
              </button>
            </div>

            <form onSubmit={handleBulkAwardSubmit} className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-300 flex-1 flex flex-col min-h-0">

              {/* Search & Bulk Selection Actions Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Buscar ${bulkTargetType === 'GROUPS' ? 'grupo' : 'participante o cargo'}...`}
                    value={bulkSearch}
                    onChange={(e) => setBulkSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 pl-9 pr-8 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 transition"
                  />
                  {bulkSearch && (
                    <button
                      type="button"
                      onClick={() => setBulkSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (bulkTargetType === 'GROUPS') {
                        const visibleGroupIds = allGroups
                          .filter((g) => g.name.toLowerCase().includes(bulkSearch.toLowerCase()))
                          .map((g) => g.id);
                        setSelectedGroupIds(Array.from(new Set([...selectedGroupIds, ...visibleGroupIds])));
                      } else {
                        const visibleUserIds = allUsers
                          .filter((u) =>
                            u.name.toLowerCase().includes(bulkSearch.toLowerCase()) ||
                            (u.groupRole && u.groupRole.toLowerCase().includes(bulkSearch.toLowerCase()))
                          )
                          .map((u) => u.id);
                        setSelectedUserIds(Array.from(new Set([...selectedUserIds, ...visibleUserIds])));
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 text-[11px] font-black uppercase tracking-wider cursor-pointer transition"
                  >
                    ☑️ Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (bulkTargetType === 'GROUPS') setSelectedGroupIds([]);
                      else setSelectedUserIds([]);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 border border-slate-200 dark:border-white/10 text-[11px] font-black uppercase tracking-wider cursor-pointer transition"
                  >
                    🔲 Ninguno
                  </button>
                </div>
              </div>

              {/* Selection List Container */}
              <div className="flex-1 overflow-y-auto max-h-56 space-y-2 p-1 pr-2 border-2 border-slate-100 dark:border-white/5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40">
                {bulkTargetType === 'GROUPS' ? (
                  allGroups
                    .filter((g) => g.name.toLowerCase().includes(bulkSearch.toLowerCase()))
                    .map((g) => {
                      const isSelected = selectedGroupIds.includes(g.id);
                      return (
                        <label
                          key={g.id}
                          onClick={() => {
                            setSelectedGroupIds((prev) =>
                              prev.includes(g.id) ? prev.filter((id) => id !== g.id) : [...prev, g.id]
                            );
                          }}
                          className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer ${isSelected
                              ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-600/15 border-amber-500/50 text-slate-900 dark:text-white font-black shadow-md'
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-amber-400/50'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => { }}
                              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                            />
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center text-xs font-black shadow-sm">
                              {g.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-extrabold uppercase tracking-wider">{g.name}</span>
                          </div>
                          {isSelected && <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">Seleccionado</span>}
                        </label>
                      );
                    })
                ) : (
                  allUsers
                    .filter((u) =>
                      u.name.toLowerCase().includes(bulkSearch.toLowerCase()) ||
                      (u.groupRole && u.groupRole.toLowerCase().includes(bulkSearch.toLowerCase()))
                    )
                    .map((u) => {
                      const isSelected = selectedUserIds.includes(u.id);
                      const groupObj = allGroups.find((g) => Number(g.id) === Number(u.groupSmallId));
                      const roleName = u.groupRole || 'Integrante';

                      return (
                        <label
                          key={u.id}
                          onClick={() => {
                            setSelectedUserIds((prev) =>
                              prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                            );
                          }}
                          className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer ${isSelected
                              ? 'bg-gradient-to-r from-fuchsia-600/15 via-purple-600/15 to-indigo-600/15 border-fuchsia-500/50 text-slate-900 dark:text-white font-black shadow-md'
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-fuchsia-400/50'
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => { }}
                              className="w-4 h-4 rounded text-fuchsia-600 focus:ring-fuchsia-500 accent-fuchsia-500 cursor-pointer"
                            />
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white flex items-center justify-center text-xs font-black shadow-sm shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-extrabold uppercase tracking-wider truncate">{u.name}</span>
                                {/* CARGO BADGE */}
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${roleName.toLowerCase().includes('lider') && !roleName.toLowerCase().includes('sub')
                                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                                    : roleName.toLowerCase().includes('sub')
                                      ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40'
                                      : roleName.toLowerCase().includes('secretar')
                                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                                  }`}>
                                  {roleName.toLowerCase().includes('lider') && !roleName.toLowerCase().includes('sub') ? '👑 ' : roleName.toLowerCase().includes('sub') ? '⭐ ' : roleName.toLowerCase().includes('secretar') ? '📜 ' : '👤 '}
                                  {roleName}
                                </span>
                              </div>
                              {groupObj && (
                                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block truncate">
                                  {groupObj.name}
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && <span className="text-[10px] font-black uppercase text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded-full border border-fuchsia-500/30 shrink-0">Seleccionado</span>}
                        </label>
                      );
                    })
                )}
              </div>

              {/* Score & Reason Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-fuchsia-600 dark:text-fuchsia-400 tracking-wider">
                    Puntos a Asignar
                  </label>
                  <input
                    type="number"
                    required
                    value={bulkPoints}
                    onChange={(e) => setBulkPoints(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 p-3 rounded-2xl font-black text-sm text-fuchsia-600 dark:text-fuchsia-400 text-center"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase text-fuchsia-600 dark:text-fuchsia-400 tracking-wider">
                    Motivo / Detalle de la Asignación Múltiple
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Asistencia General, Participación en Desfile, etc."
                    value={bulkReason}
                    onChange={(e) => setBulkReason(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 p-3 rounded-2xl font-bold text-xs text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Presets buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-black uppercase text-slate-400">Atajos Puntos:</span>
                {[10, 25, 50, 100, 200].map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => setBulkPoints(pts)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition cursor-pointer ${bulkPoints === pts
                        ? 'bg-fuchsia-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/40'
                      }`}
                  >
                    +{pts}
                  </button>
                ))}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-3 pt-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBulkAwardModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/5 cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBulk || (bulkTargetType === 'GROUPS' ? selectedGroupIds.length === 0 : selectedUserIds.length === 0)}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 hover:from-fuchsia-700 hover:to-rose-700 text-white text-xs font-black uppercase tracking-wider shadow-xl shadow-fuchsia-600/30 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingBulk ? (
                    'Procesando...'
                  ) : (
                    <>
                      <Sparkles size={16} /> Otorgar +{bulkPoints} PTS a {bulkTargetType === 'GROUPS' ? selectedGroupIds.length : selectedUserIds.length} Destinatarios
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* PDF PREVIEW MODAL */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-8 md:p-12 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-100 dark:bg-slate-900 rounded-[2rem] w-full max-w-6xl h-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-indigo-500/20 overflow-hidden relative">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                  <Eye size={20} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    Previsualización del PDF
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">
                    Revise el reporte oficial antes de exportar o imprimir.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  className="hidden sm:flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  <Printer size={14} /> Imprimir / Guardar
                </button>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/50 dark:hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Iframe container */}
            <div className="flex-1 w-full bg-slate-200 dark:bg-slate-950 p-2 sm:p-4 overflow-hidden relative">
              <iframe
                title="PDF Preview"
                srcDoc={previewHtml}
                className="w-full h-full bg-white rounded-xl shadow-inner border border-slate-300 dark:border-slate-700"
              />
            </div>
            
            {/* Mobile print button at bottom */}
            <div className="sm:hidden p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleExportPDF}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                <Printer size={14} /> Imprimir / Guardar PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
