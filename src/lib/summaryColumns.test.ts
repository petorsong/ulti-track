import { describe, expect, it } from 'vitest';
import { buildSummaryColumns } from './summaryColumns';

describe('buildSummaryColumns', () => {
  it('includes base stat columns for Open teams', () => {
    const columns = buildSummaryColumns('Open');
    expect(columns.map((c) => c.title)).toEqual(['Player', 'PP', 'G', 'A', '2A', 'D', 'TA', 'Drop', 'Pass']);
  });

  it('adds mixed pass breakdown columns for Mixed teams', () => {
    const columns = buildSummaryColumns('Mixed');
    expect(columns.map((c) => c.title)).toContain('Pass (F)');
    expect(columns.map((c) => c.title)).toContain('Pass (O)');
  });
});
