export const normalizeHex = (value) => {
  const text = String(value || '').trim().toLowerCase();
  const hex = text.startsWith('#') ? text : `#${text}`;
  return /^#[0-9a-f]{6}$/.test(hex) ? hex : null;
};

export const clampNumber = (value, min, max) => Math.min(max, Math.max(min, Number(value) || min));
export const clampFiniteNumber = (value, min, max) => {
  const next = Number(value);
  return Math.min(max, Math.max(min, Number.isFinite(next) ? next : min));
};
