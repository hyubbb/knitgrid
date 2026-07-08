import assert from 'node:assert/strict';
import test from 'node:test';
import { IMAGE_SAMPLE_SCALE, getCellSampleColor, luminance, clampImageColorCount, applyGrayscaleToImageData, getImageAspectGridSize } from '../src/features/image-conversion/model/imageConversionModel.js';

test('getCellSampleColor pixelArt mode snaps a cell to its majority color, ignoring minority noise', () => {
  // 한 셀(6x6) 안: 다수는 검정, 소수(격자선/노이즈)는 흰색
  const width = IMAGE_SAMPLE_SCALE;
  const pixels = new Uint8ClampedArray(width * width * 4);
  for (let i = 3; i < pixels.length; i += 4) pixels[i] = 255; // 알파
  // 샘플 영역(inset=1): x,y 1..4. 대부분 검정(0), 일부만 흰색(255)
  let whitesPlaced = 0;
  for (let y = 1; y <= 4; y += 1) {
    for (let x = 1; x <= 4; x += 1) {
      const index = (y * width + x) * 4;
      const white = whitesPlaced < 3 && (x === 1 && y <= 3);
      if (white) whitesPlaced += 1;
      const v = white ? 255 : 0;
      pixels[index] = v; pixels[index + 1] = v; pixels[index + 2] = v;
    }
  }

  const dominant = getCellSampleColor(pixels, width, 0, 0, { pixelArt: true });
  const mean = getCellSampleColor(pixels, width, 0, 0, {});

  assert.equal(dominant, '#000000');       // 최빈색 = 검정으로 스냅
  assert.notEqual(mean, '#000000');         // 평균은 흰색이 섞여 더 밝아짐(뭉개짐)
  assert.ok(luminance(mean) > 0);
});

test('getImageAspectGridSize matches the grid to the image aspect on its long side', () => {
  // 세로형 20x100 이미지, 현재 격자 100x20 → 긴 변(100칸)을 이미지 긴 변(세로)에 배정
  const portrait = getImageAspectGridSize({ imageWidth: 20, imageHeight: 100, rows: 20, cols: 100 });
  assert.deepEqual(portrait, { cols: 20, rows: 100 });

  // 정사각 → 예산(최대 칸 수) 그대로 정사각
  const square = getImageAspectGridSize({ imageWidth: 50, imageHeight: 50, rows: 20, cols: 100 });
  assert.deepEqual(square, { cols: 100, rows: 100 });

  // 크롭이 켜지면 크롭 영역 비율을 따른다(전체 폭의 절반만 사용 → 세로형)
  const cropped = getImageAspectGridSize({
    imageWidth: 100, imageHeight: 100, rows: 80, cols: 80,
    crop: { enabled: true, x: 0, y: 0, width: 0.5, height: 1 }
  });
  assert.deepEqual(cropped, { cols: 40, rows: 80 });
});

test('getCellSampleColor keeps a dark cell when the center is noisy', () => {
  // Given
  const width = IMAGE_SAMPLE_SCALE;
  const height = IMAGE_SAMPLE_SCALE;
  const pixels = new Uint8ClampedArray(width * height * 4);

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const index = (row * width + col) * 4;
      const isBrightCore = row >= 2 && row <= 3 && col >= 2 && col <= 3;
      pixels[index] = isBrightCore ? 245 : 12;
      pixels[index + 1] = isBrightCore ? 245 : 12;
      pixels[index + 2] = isBrightCore ? 245 : 12;
      pixels[index + 3] = 255;
    }
  }

  // When
  const sample = getCellSampleColor(pixels, width, 0, 0, { artifactFilter: true });

  // Then
  assert.ok(sample);
  assert.ok(luminance(sample) < 0.55);
});

test('clampImageColorCount keeps values within 2..8 and rounds', () => {
  assert.equal(clampImageColorCount(1), 2);   // 하한
  assert.equal(clampImageColorCount(0), 2);
  assert.equal(clampImageColorCount(9), 8);   // 상한
  assert.equal(clampImageColorCount(4.6), 5); // 반올림
  assert.equal(clampImageColorCount(3), 3);
});

test('applyGrayscaleToImageData makes every pixel achromatic (r=g=b)', () => {
  const data = new Uint8ClampedArray([200, 50, 10, 255, 10, 240, 30, 255]);
  const result = applyGrayscaleToImageData({ data });
  for (let i = 0; i < data.length; i += 4) {
    assert.equal(result.data[i], result.data[i + 1]);
    assert.equal(result.data[i + 1], result.data[i + 2]);
    assert.equal(result.data[i + 3], 255); // 알파 보존
  }
});
