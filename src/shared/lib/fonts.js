/** 폰트 변경 시 이 두 값과 index.html preload만 맞추면 됩니다. */
export const GALMURI_FONT_NAME = 'Galmuri9';
export const GALMURI_FONT_FILE = '/Galmuri9.ttf';

export const GALMURI_FONT_FAMILY = `"${GALMURI_FONT_NAME}", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif`;

const STYLE_ID = 'knitgrid-app-fonts';

/** @font-face와 --kg-font-sans를 주입해 CSS/Canvas가 같은 폰트를 씁니다. */
export const installAppFonts = () => {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @font-face {
      font-family: "${GALMURI_FONT_NAME}";
      src: url("${GALMURI_FONT_FILE}") format("truetype");
      font-weight: 400 700;
      font-style: normal;
      font-display: swap;
    }

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

  return Promise.all([
    document.fonts.load(`400 16px "${GALMURI_FONT_NAME}"`),
    document.fonts.load(`700 16px "${GALMURI_FONT_NAME}"`)
  ]).catch(() => undefined);
};
