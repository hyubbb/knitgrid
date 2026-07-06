import assert from 'node:assert/strict';
import test from 'node:test';
import { IMAGE_SAMPLE_SCALE, getCellSampleColor, luminance } from '../src/features/image-conversion/model/imageConversionModel.js';

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
