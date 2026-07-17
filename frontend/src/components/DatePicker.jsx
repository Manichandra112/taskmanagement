import React, { useEffect, useMemo, useRef, useState } from 'react';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseIsoDate(value) {
  if (!value || typeof value !== 'string') return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
}

function formatIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
  const parsed = parseIsoDate(value);
  if (!parsed) return '';
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[parsed.getMonth()].slice(0, 3);
  const year = parsed.getFullYear();
  return `${day} ${month} ${year}`;
}

export default function DatePicker({ id, value, onChange, required, min, max }) {
  const wrapperRef = useRef(null);
  const initialDate = parseIsoDate(value) || new Date();
  const [isOpen, setIsOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState('day');
  const [yearPageStart, setYearPageStart] = useState(initialDate.getFullYear() - 5);
  const [viewDate, setViewDate] = useState(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );

  useEffect(() => {
    const nextDate = parseIsoDate(value);
    if (nextDate) {
      setViewDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
      setYearPageStart(nextDate.getFullYear() - 5);
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) {
      setPickerMode('day');
    }
  }, [isOpen]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const selectedIso = value || '';
  const todayIso = formatIsoDate(new Date());
  const minIso = min || '';
  const maxIso = max || '';

  const monthOptions = MONTH_NAMES.map((monthName, index) => ({
    index,
    label: monthName,
  }));
  const yearOptions = Array.from({ length: 12 }, (_, index) => yearPageStart + index);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = new Date(year, month, 1).getDay();
    const leadingEmptyDays = Array.from({ length: firstWeekday }, (_, index) => ({
      key: `empty-start-${index}`,
      empty: true,
    }));
    const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(year, month, index + 1);
      const iso = formatIsoDate(date);
      const isSelected = iso === selectedIso;
      const isToday = iso === todayIso;
      const isBeforeMin = minIso && iso < minIso;
      const isAfterMax = maxIso && iso > maxIso;

      return {
        key: iso,
        label: date.getDate(),
        iso,
        isSelected,
        isToday,
        disabled: isBeforeMin || isAfterMax,
      };
    });
    const trailingSlots = (7 - ((leadingEmptyDays.length + monthDays.length) % 7)) % 7;
    const trailingEmptyDays = Array.from({ length: trailingSlots }, (_, index) => ({
      key: `empty-end-${index}`,
      empty: true,
    }));

    return [...leadingEmptyDays, ...monthDays, ...trailingEmptyDays];
  }, [maxIso, minIso, selectedIso, todayIso, viewDate]);

  const handleMonthChange = (monthIndex) => {
    setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
    setPickerMode('day');
  };

  const handleYearChange = (year) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setYearPageStart(year - 5);
    setPickerMode('day');
  };

  const handlePrevious = () => {
    if (pickerMode === 'year') {
      setYearPageStart((start) => start - 12);
      return;
    }
    if (pickerMode === 'month') {
      return;
    }
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNext = () => {
    if (pickerMode === 'year') {
      setYearPageStart((start) => start + 12);
      return;
    }
    if (pickerMode === 'month') {
      return;
    }
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelect = (iso) => {
    onChange(iso);
    setIsOpen(false);
  };

  return (
    <div className={`date-picker ${isOpen ? 'open' : ''}`} ref={wrapperRef}>
      <button
        id={id}
        type="button"
        className="date-picker-trigger mockup-select"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span>{formatDisplayDate(selectedIso) || 'Select date'}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </button>

      <input type="hidden" value={selectedIso} required={required} />

      {isOpen && (
        <div className="date-picker-panel" role="dialog" aria-label="Choose date">
          <div className="date-picker-header">
            <button
              type="button"
              className="date-picker-nav"
              onClick={handlePrevious}
              aria-label={pickerMode === 'year' ? 'Previous years' : 'Previous month'}
              disabled={pickerMode === 'month'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div className="date-picker-title-group">
              <button
                type="button"
                className={`date-picker-title-btn ${pickerMode === 'month' ? 'active' : ''}`.trim()}
                onClick={() => setPickerMode((mode) => (mode === 'month' ? 'day' : 'month'))}
              >
                {MONTH_NAMES[viewDate.getMonth()]}
              </button>
              <button
                type="button"
                className={`date-picker-title-btn ${pickerMode === 'year' ? 'active' : ''}`.trim()}
                onClick={() => {
                  setYearPageStart(viewDate.getFullYear() - 5);
                  setPickerMode((mode) => (mode === 'year' ? 'day' : 'year'));
                }}
              >
                {viewDate.getFullYear()}
              </button>
            </div>
            <button
              type="button"
              className="date-picker-nav"
              onClick={handleNext}
              aria-label={pickerMode === 'year' ? 'Next years' : 'Next month'}
              disabled={pickerMode === 'month'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>

          {pickerMode === 'day' ? (
            <>
              <div className="date-picker-weekdays">
                {WEEKDAY_NAMES.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="date-picker-grid">
                {calendarDays.map((day) => (
                  day.empty ? (
                    <div key={day.key} className="date-picker-day date-picker-day-empty" aria-hidden="true" />
                  ) : (
                    <button
                      key={day.key}
                      type="button"
                      className={`date-picker-day ${day.isSelected ? 'selected' : ''} ${day.isToday ? 'today' : ''}`.trim()}
                      onClick={() => handleSelect(day.iso)}
                      disabled={day.disabled}
                    >
                      {day.label}
                    </button>
                  )
                ))}
              </div>
            </>
          ) : pickerMode === 'month' ? (
            <div className="date-picker-choice-grid date-picker-month-grid">
              {monthOptions.map((month) => (
                <button
                  key={month.index}
                  type="button"
                  className={`date-picker-choice-btn ${month.index === viewDate.getMonth() ? 'active' : ''}`.trim()}
                  onClick={() => handleMonthChange(month.index)}
                >
                  {month.label.slice(0, 3)}
                </button>
              ))}
            </div>
          ) : (
            <div className="date-picker-year-picker">
              {/* <button
                type="button"
                className="date-picker-page-btn"
                onClick={() => setYearPageStart((start) => start - 12)}
              >
                Earlier Years
              </button> */}
              <div className="date-picker-choice-grid date-picker-year-grid">
                {yearOptions.map((year) => (
                  <button
                    key={year}
                    type="button"
                    className={`date-picker-choice-btn ${year === viewDate.getFullYear() ? 'active' : ''}`.trim()}
                    onClick={() => handleYearChange(year)}
                  >
                    {year}
                  </button>
                ))}
              </div>
              {/* <button
                type="button"
                className="date-picker-page-btn"
                onClick={() => setYearPageStart((start) => start + 12)}
              >
                Later Years
              </button> */}
            </div>
          )}

          <div className="date-picker-footer">
            <button
              type="button"
              className="date-picker-footer-btn"
              onClick={() => {
                onChange(todayIso);
                setViewDate(new Date());
                setIsOpen(false);
              }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


