import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { IconButton } from './Button.jsx';

const STORAGE_KEY = 'knitgrid-theme';

function readTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

/**
 * 다크/라이트 모드 토글. 상태는 <html data-theme>와 localStorage에 저장된다.
 * 초기 적용은 index.html의 인라인 스크립트가 담당(플래시 방지).
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState(readTheme);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage 불가 환경 — 세션 내 토글만 동작
    }
    setTheme(next);
  };

  const isDark = theme === 'dark';
  return (
    <IconButton
      icon={isDark ? Sun : Moon}
      label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      size={16}
      onClick={toggle}
    />
  );
}
