export function formatNumberShort(
  value: number | string,
  decimals: number = 2,
  locale: string = 'id-ID',
): string {
  const num = Number(value);

  if (isNaN(num)) return '0';

  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  const tiers = [
    { divider: 1e15, suffix: 'Q' },
    { divider: 1e12, suffix: 'T' },
    { divider: 1e9, suffix: 'B' },
    { divider: 1e6, suffix: 'M' },
    { divider: 1e3, suffix: 'K' },
  ];

  for (const tier of tiers) {
    if (abs >= tier.divider) {
      const formatted = abs / tier.divider;

      if (formatted % 1 === 0) {
        return `${sign}${formatted.toLocaleString(locale)}${tier.suffix}`;
      }
      return `${sign}${formatted
        .toFixed(decimals)
        .replace(/\.?0+$/, '')
        .replace(
          '.',
          ',',
        )} // optional: ganti titik jadi koma kalau mau style Indonesia
        }${tier.suffix}`;
    }
  }

  return sign + num.toLocaleString(locale);
}
