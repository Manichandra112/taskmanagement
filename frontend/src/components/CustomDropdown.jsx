import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function CustomDropdown({ value, onChange, options, style, className, triggerStyle, disabled, menuPlacement = 'down' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedTrigger = dropdownRef.current?.contains(event.target);
      const clickedMenu = menuRef.current?.contains(event.target);

      if (!clickedTrigger && !clickedMenu) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) {
      return undefined;
    }

    const updateMenuPosition = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      const width = rect.width;
      const maxWidth = Math.max(180, width);
      const spacing = 6;
      const estimatedHeight = 220;
      const viewportHeight = window.innerHeight;
      const shouldOpenUp = menuPlacement === 'up' || (menuPlacement !== 'down' && rect.bottom + spacing + estimatedHeight > viewportHeight && rect.top > estimatedHeight);
      const top = shouldOpenUp
        ? Math.max(8, rect.top - spacing - Math.min(estimatedHeight, viewportHeight - 16))
        : Math.min(viewportHeight - estimatedHeight - 8, rect.bottom + spacing);

      setMenuStyle({
        position: 'fixed',
        top,
        left: Math.min(rect.left, window.innerWidth - maxWidth - 8),
        width,
        minWidth: width,
        maxWidth,
        zIndex: 12000,
      });
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen, menuPlacement, options.length]);

  const activeOption = options.find((opt) => {
    if (typeof opt === 'object') return opt.value === value;
    return opt === value;
  }) || { value, label: value };

  const displayLabel = typeof activeOption === 'object' ? activeOption.label : activeOption;

  const handleSelect = (opt) => {
    const val = typeof opt === 'object' ? opt.value : opt;
    onChange({ target: { value: val } });
    setIsOpen(false);
  };

  const menu = isOpen && menuStyle ? createPortal(
    <ul
      ref={menuRef}
      className={`custom-dropdown-menu ${menuPlacement === 'up' ? 'open-up' : ''}`.trim()}
      style={menuStyle}
    >
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
            style={{ fontWeight: isSelected || isSpecial ? 'bold' : 'normal' }}
          >
            {label}
          </li>
        );
      })}
    </ul>,
    document.body
  ) : null;

  return (
    <div
      className={`custom-dropdown-container ${isOpen ? 'open' : ''} ${className || ''}`.trim()}
      ref={dropdownRef}
      style={{ position: 'relative', ...style }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="custom-dropdown-trigger"
        onClick={() => !disabled && setIsOpen((open) => !open)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.75 : 1,
          ...triggerStyle,
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
            flexShrink: 0,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {menu}
    </div>
  );
}
