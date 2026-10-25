import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';

/**
 * 우클릭 메뉴 — 위치 지정 팝오버, 하위 메뉴(▸), 키보드 조작(↑↓ → ← Enter Esc)
 * item = { id, label, icon?, hint?, disabled?, danger?, checked?, separator?, items?: item[], onSelect? }
 */
export function ContextMenu({ x, y, items, onClose, label = '편집 메뉴' }) {
  const rootRef = useRef(null);
  const [position, setPosition] = useState({ left: x, top: y });

  // 화면 밖으로 넘치지 않게 위치 보정
  useLayoutEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const left = Math.max(8, Math.min(x, window.innerWidth - rect.width - 8));
    const top = Math.max(8, Math.min(y, window.innerHeight - rect.height - 8));
    setPosition({ left, top });
  }, [x, y]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) onClose();
    };
    const handleBlur = () => onClose();
    document.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('resize', handleBlur);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', handleBlur);
    };
  }, [onClose]);

  return (
    <div ref={rootRef} className="ce-context-menu" style={position}>
      <MenuList items={items} onClose={onClose} label={label} autoFocus />
    </div>
  );
}

function MenuList({ items, onClose, onBack, label, autoFocus, className = '' }) {
  const listRef = useRef(null);
  const itemRefs = useRef([]);
  const enabled = items.map((item, index) => (!item.separator && !item.disabled ? index : -1)).filter((i) => i >= 0);
  const [active, setActive] = useState(autoFocus ? enabled[0] ?? -1 : -1);
  const [openSub, setOpenSub] = useState(-1);
  const [flip, setFlip] = useState(false);
  const [shiftY, setShiftY] = useState(0);

  useEffect(() => {
    if (active >= 0 && openSub !== active) itemRefs.current[active]?.focus({ preventScroll: true });
  }, [active, openSub]);

  // 하위 메뉴가 화면 밖으로 넘치면 왼쪽으로 펼치거나 위로 올린다
  useLayoutEffect(() => {
    if (!onBack) return;
    const rect = listRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (rect.right > window.innerWidth - 8) setFlip(true);
    const overflow = rect.bottom - (window.innerHeight - 8);
    if (overflow > 0) setShiftY(-Math.min(overflow, Math.max(0, rect.top - 8)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const move = (delta) => {
    if (!enabled.length) return;
    const pos = enabled.indexOf(active);
    const next = enabled[(pos + delta + enabled.length) % enabled.length];
    setOpenSub(-1);
    setActive(next);
  };

  const activate = (index) => {
    const item = items[index];
    if (!item || item.disabled || item.separator) return;
    if (item.items) {
      setActive(index);
      setOpenSub(index);
      return;
    }
    onClose();
    item.onSelect?.();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') move(1);
    else if (event.key === 'ArrowUp') move(-1);
    else if (event.key === 'Home') setActive(enabled[0] ?? -1);
    else if (event.key === 'End') setActive(enabled[enabled.length - 1] ?? -1);
    else if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
      if (event.key === 'ArrowRight' && !items[active]?.items) return;
      activate(active);
    } else if (event.key === 'ArrowLeft' && onBack) onBack();
    else if (event.key === 'Escape') {
      if (onBack) onBack();
      else onClose();
    } else if (event.key === 'Tab') onClose();
    else return;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      ref={listRef}
      className={`ce-menu-list ${flip ? 'is-flipped' : ''} ${className}`.trim()}
      role="menu"
      aria-label={label}
      style={shiftY ? { transform: `translateY(${shiftY}px)` } : undefined}
      onKeyDown={handleKeyDown}
    >
      {items.map((item, index) => {
        if (item.separator) return <div key={item.id} className="ce-menu-separator" role="separator" />;
        const Icon = item.icon;
        const isOpen = openSub === index;
        return (
          <div key={item.id} className="ce-menu-item-wrap" onMouseEnter={() => !item.disabled && (setActive(index), setOpenSub(item.items ? index : -1))}>
            <button
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              type="button"
              role={item.checked !== undefined ? 'menuitemcheckbox' : 'menuitem'}
              aria-checked={item.checked !== undefined ? item.checked : undefined}
              aria-haspopup={item.items ? 'menu' : undefined}
              aria-expanded={item.items ? isOpen : undefined}
              className={`ce-menu-item ${item.danger ? 'is-danger' : ''} ${active === index ? 'is-active' : ''}`.trim()}
              disabled={item.disabled}
              tabIndex={active === index ? 0 : -1}
              title={item.title}
              onClick={() => activate(index)}
            >
              <span className="ce-menu-icon">
                {item.checked ? <Check size={14} /> : Icon ? <Icon size={14} /> : item.glyph ?? null}
              </span>
              <span className="ce-menu-label">{item.label}</span>
              {item.hint ? <kbd className="ce-menu-hint">{item.hint}</kbd> : null}
              {item.items ? <ChevronRight size={14} className="ce-menu-chevron" /> : null}
            </button>
            {isOpen ? (
              <MenuList
                items={item.items}
                onClose={onClose}
                label={item.label}
                autoFocus
                className="ce-submenu"
                onBack={() => {
                  setOpenSub(-1);
                  itemRefs.current[index]?.focus({ preventScroll: true });
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
