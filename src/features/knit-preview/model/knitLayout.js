import { resolveCellDisplay } from '../../../entities/palette/model/paletteModel.js';
import { getKnitStitch } from '../../../entities/knit-stitch/model/knitStitchModel.js';

// 실물에서 코가 보이는 모양: knit(V) | purl(가로 물결) | hole(걸기 구멍) | none(무코)
const PURL_STITCHES = new Set(['p', 'ptbl', 'p2tog']);
export const getKnitStitchLook = (stitchId) => {
  const stitch = getKnitStitch(stitchId);
  if (stitch.id === 'ns') return 'none';
  if (stitch.id === 'yo') return 'hole';
  if (PURL_STITCHES.has(stitch.id)) return 'purl';
  return 'knit';
};

// 빈 칸은 실물에서 바탕실로 뜬 코다.
export const KNIT_BASE_COLOR = '#ffffff';
// 메리야스 한 코의 세로/가로 비율(게이지 미입력 시 기본값).
export const KNIT_STITCH_RATIO = 0.75;

// 윗단 코가 아랫단 코 머리를 덮어야 하므로 아랫단부터 그린다.
export const buildKnitStitches = ({ grid, palette, baseColor = KNIT_BASE_COLOR }) => {
  const stitches = [];
  for (let row = grid.length - 1; row >= 0; row -= 1) {
    grid[row].forEach((cell, col) => {
      const display = resolveCellDisplay(cell, palette);
      stitches.push({
        row,
        col,
        color: cell.active && display.visible ? display.color : baseColor,
        look: getKnitStitchLook(cell.stitch)
      });
    });
  }
  return stitches;
};

// 면적을 유지(w*h=1)하면서 세로/가로 = KNIT_STITCH_RATIO.
export const getDefaultKnitCellScale = () => {
  const root = Math.sqrt(1 / KNIT_STITCH_RATIO);
  return { w: root, h: 1 / root };
};

const parseHex = (hex) => {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!match) return null;
  const raw = match[1].length === 3 ? match[1].replace(/./g, '$&$&') : match[1];
  return [0, 2, 4].map((i) => parseInt(raw.slice(i, i + 2), 16));
};

// amount > 0이면 흰색 쪽, < 0이면 검정 쪽으로 섞는다(-1~1).
export const shadeColor = (hex, amount) => {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const target = amount >= 0 ? 255 : 0;
  const t = Math.min(1, Math.abs(amount));
  return `#${rgb.map((v) => Math.round(v + (target - v) * t).toString(16).padStart(2, '0')).join('')}`;
};
