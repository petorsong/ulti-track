import { describe, expect, it } from 'vitest';
import { fieldSideChipColor } from './PointCard';

describe('fieldSideChipColor', () => {
  it('uses neutral for Left', () => {
    expect(fieldSideChipColor('Left')).toBe('neutral');
  });

  it('uses warning for Right', () => {
    expect(fieldSideChipColor('Right')).toBe('warning');
  });
});
