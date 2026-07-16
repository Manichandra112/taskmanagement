import React, { useState, useEffect, useRef } from 'react';

export default function CustomDropdown({ value, onChange, options, style, className, triggerStyle, disabled, menuPlacement = 'down' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeOption = options.find((opt) => {
    if (typeof opt === 'object') return opt.value === value;
    return opt === value;
  }) || { value: value, label: value };

  const displayLabel = typeof activeOption === 'object' ? activeOption.label : activeOption;

  const handleSelect = (opt) => {
    const val = typeof opt === 'object' ? opt.value : opt;
    onChange({ target: { value: val } });
    setIsOpen(false);
  };


  return (
    <div
      className={`custom-dropdown-container ${isOpen ? 'open' : ''} ${className || ''}`.trim()}
      ref={dropdownRef}
      style={{ position: 'relative', zIndex: isOpen ? 30 : undefined, ...style }}
    >
      <button
        type="button"
        className="custom-dropdown-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.75 : 1,
          ...triggerStyle
        }}
        disabled={disabled}
      >
        <span>{displayLabel}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: 'transform 180ms ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            marginLeft: '8px',
            color: 'var(--text)',
            flexShrink: 0
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <ul className={`custom-dropdown-menu ${menuPlacement === 'up' ? 'open-up' : ''}`.trim()}>
          {options.map((opt, idx) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const label = typeof opt === 'object' ? opt.label : opt;
            const isSelected = val === value;
            const isSpecial = typeof opt === 'object' && opt.special;

            return (
              <li
                key={idx}
                className={`custom-dropdown-item ${isSelected ? 'selected' : ''} ${isSpecial ? 'special-action' : ''}`}
                onClick={() => handleSelect(opt)}
                style={{
                  fontWeight: isSelected || isSpecial ? 'bold' : 'normal'
                }}
              >
                {label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
