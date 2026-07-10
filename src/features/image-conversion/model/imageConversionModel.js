// 이미지 변환 모델 배럴. 실제 구현은 아래 도메인 모듈에 분리되어 있다.
// 색 수학 → 기하/격자감지 → 팔레트 → 샘플링 → 양자화 순의 의존 구조.
export * from './colorMath.js';
export * from './imageGeometry.js';
export * from './imagePalette.js';
export * from './imageSampling.js';
export * from './imageQuantize.js';
