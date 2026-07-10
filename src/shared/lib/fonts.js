/** 폰트 추가 시 아래 목록에 한 줄 추가하고 index.html preload만 맞추면 됩니다. */
export const GALMURI_FONT_NAME = 'Galmuri9';
export const GALMURI_FONT_FILE = '/Galmuri9.ttf';
export const GALMURI_FONT_FAMILY = `"${GALMURI_FONT_NAME}", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif`;

export const BESTTEN_FONT_NAME = 'BestTen-DOT';
export const BESTTEN_FONT_FILE = '/BestTen-DOT.otf';
export const BESTTEN_FONT_FAMILY = `"${BESTTEN_FONT_NAME}", ${GALMURI_FONT_FAMILY}`;

// name/file/format(ttf=truetype, otf=opentype)만 맞추면 @font-face·로드가 자동 처리됩니다.
const APP_FONTS = [
  { name: GALMURI_FONT_NAME, file: GALMURI_FONT_FILE, format: 'truetype' },
  { name: BESTTEN_FONT_NAME, file: BESTTEN_FONT_FILE, format: 'opentype' }
];

const STYLE_ID = 'knitgrid-app-fonts';

/** @font-face와 --kg-font-sans를 주입해 CSS/Canvas가 같은 폰트를 씁니다. */
export const installAppFonts = () => {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) {
    return;
  }

  const faces = APP_FONTS.map((font) => `
    @font-face {
      font-family: "${font.name}";
      src: url("${font.file}") format("${font.format}");
      font-weight: 400 700;
      font-style: normal;
      font-display: swap;
    }
  `).join('\n');

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    ${faces}

    :root {
      --kg-font-sans: ${GALMURI_FONT_FAMILY};
    }
  `;
  document.head.appendChild(style);
};

/** Canvas/UI에서 앱 폰트 로드가 끝날 때까지 대기 */
export const loadAppFonts = () => {
  installAppFonts();

  if (typeof document === 'undefined' || !document.fonts?.load) {
    return Promise.resolve();
  }

  const loads = APP_FONTS.flatMap((font) => [
    document.fonts.load(`400 16px "${font.name}"`),
    document.fonts.load(`700 16px "${font.name}"`)
  ]);

  return Promise.all(loads).catch(() => undefined);
};
