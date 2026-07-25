import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  placeholder?: string;
}

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Seleccionar fecha'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parseValueToDate = (valStr: string) => {
    if (!valStr) return new Date();
    const parts = valStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
    return new Date();
  };

  const selectedDate = value ? parseValueToDate(value) : null;
  const [viewDate, setViewDate] = useState<Date>(selectedDate || new Date());

  useEffect(() => {
    if (value) {
      setViewDate(parseValueToDate(value));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    setViewDate(new Date(newYear, month, 1));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value, 10);
    setViewDate(new Date(year, newMonth, 1));
  };

  const handleSelectDay = (dayNum: number) => {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    onChange(formatted);
    setViewDate(now);
    setIsOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const currentYear = new Date().getFullYear();
  const yearsList: number[] = [];
  for (let y = currentYear; y >= 1930; y--) {
    yearsList.push(y);
  }

  const formatDisplay = (valStr: string) => {
    if (!valStr) return '';
    const parts = valStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return valStr;
  };

  const isToday = (d: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === d
    );
  };

  const isSelected = (d: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === d
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative group">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-500 via-teal-500 to-emerald-600 rounded-l-xl z-10" />
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 dark:from-emerald-500/30 dark:to-teal-500/30 rounded-lg flex items-center justify-center border border-emerald-500/30 shadow-3xs group-hover:scale-105 transition-transform cursor-pointer z-20"
        >
          <CalendarIcon size={13} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-2.5 pl-12 pr-9 bg-slate-50 dark:bg-slate-800/70 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 rounded-xl text-xs font-bold text-left text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-200 cursor-pointer shadow-3xs flex items-center justify-between"
        >
          <span className={value ? "text-slate-800 dark:text-white font-extrabold" : "text-slate-400 dark:text-slate-500 font-semibold"}>
            {value ? formatDisplay(value) : placeholder}
          </span>
        </button>

        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-1 rounded-lg z-20 cursor-pointer"
            title="Limpiar fecha"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-2xl shadow-emerald-950/20 z-50 animate-scaleUp text-slate-800 dark:text-slate-100">
          <div className="flex items-center justify-between gap-1 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1">
              <select
                value={month}
                onChange={handleMonthChange}
                className="bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-800 dark:text-slate-100 px-2 py-1 rounded-lg border-none focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES_ES.map((mName, idx) => (
                  <option key={mName} value={idx} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold">
                    {mName}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={handleYearChange}
                className="bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-800 dark:text-slate-100 px-2 py-1 rounded-lg border-none focus:outline-none cursor-pointer"
              >
                {yearsList.map((yNum) => (
                  <option key={yNum} value={yNum} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold">
                    {yNum}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAYS_ES.map((wd) => (
              <span key={wd} className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight py-1">
                {wd}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: firstDayIndex }).map((_, idx) => {
              const pDay = daysInPrevMonth - firstDayIndex + idx + 1;
              return (
                <div key={`prev-${pDay}`} className="py-1.5 text-slate-300 dark:text-slate-700 text-[11px] font-medium pointer-events-none select-none">
                  {pDay}
                </div>
              );
            })}

            {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
              const dNum = idx + 1;
              const selected = isSelected(dNum);
              const today = isToday(dNum);

              return (
                <button
                  key={`day-${dNum}`}
                  type="button"
                  onClick={() => handleSelectDay(dNum)}
                  className={`py-1.5 rounded-xl font-bold transition-all duration-150 cursor-pointer ${
                    selected
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black shadow-md shadow-emerald-500/30 scale-105'
                      : today
                      ? 'border border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {dNum}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800 text-[10px] font-black">
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-wider cursor-pointer"
            >
              Limpiar
            </button>

            <button
              type="button"
              onClick={handleSelectToday}
              className="text-emerald-600 dark:text-emerald-400 hover:underline uppercase tracking-wider cursor-pointer"
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
