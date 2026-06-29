import { useEffect, useRef, useState } from 'react';

export function DropdownMenu({ label, icon: Icon, items, className = '' }) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  const getEnabledIndexes = () => items.reduce((indexes, item, index) => {
    if (!item.disabled) indexes.push(index);
    return indexes;
  }, []);

  const getFirstEnabledIndex = () => getEnabledIndexes()[0] ?? -1;

  const handleSelect = (item) => {
    if (item.disabled) return;
    setOpen(false);
    setActiveIndex(-1);
    item.onSelect();
    triggerRef.current?.focus();
  };

  const toggleMenu = () => {
    if (open) {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPosition({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right)
      });
    }
    setActiveIndex(getFirstEnabledIndex());
    setOpen(true);
  };

  const focusMenuItem = (nextEnabledIndex) => {
    const enabledIndexes = getEnabledIndexes();
    if (!enabledIndexes.length) return;
    const boundedIndex = ((nextEnabledIndex % enabledIndexes.length) + enabledIndexes.length) % enabledIndexes.length;
    setActiveIndex(enabledIndexes[boundedIndex]);
  };

  const handleMenuKeyDown = (event) => {
    const enabledIndexes = getEnabledIndexes();
    const currentEnabledIndex = enabledIndexes.indexOf(activeIndex);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusMenuItem(currentEnabledIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusMenuItem(currentEnabledIndex - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusMenuItem(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusMenuItem(enabledIndexes.length - 1);
    } else if (event.key === 'Tab') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className={`dropdown-menu ${className}`.trim()} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="dropdown-menu-trigger"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggleMenu}
      >
        <Icon size={17} aria-hidden="true" />
      </button>
      {open ? (
        <div className="dropdown-menu-content" role="menu" aria-label={label} style={menuPosition} onKeyDown={handleMenuKeyDown}>
          {items.map((item, index) => {
            const ItemIcon = item.icon;
            return (
              <button
                key={item.id}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                type="button"
                role="menuitem"
                className="dropdown-menu-item"
                disabled={item.disabled}
                tabIndex={activeIndex === index ? 0 : -1}
                onFocus={() => setActiveIndex(index)}
                onClick={() => handleSelect(item)}
              >
                {ItemIcon ? <ItemIcon size={15} aria-hidden="true" /> : null}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
