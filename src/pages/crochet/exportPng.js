import { renderChartSvg } from '../../features/crochet/model/crochetRender.js';

const safeFileName = (name) => String(name || '코바늘 도안').replace(/[\\/:*?"<>|]+/g, '_').trim() || '코바늘 도안';

/** 차트를 PNG로 내려받는다 (보이는 단만, 흰 배경) */
export const exportChartPng = async (chart, name, scale = 3) => {
  const { svg, width, height } = renderChartSvg(chart, { scale, background: '#ffffff', title: name, padding: 28 });
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('이미지를 만들 수 없습니다.'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!pngBlob) throw new Error('PNG를 만들 수 없습니다.');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(pngBlob);
    link.download = `${safeFileName(name)}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
  } finally {
    URL.revokeObjectURL(url);
  }
};
