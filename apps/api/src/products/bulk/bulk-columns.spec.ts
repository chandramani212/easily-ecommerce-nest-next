import { describe, expect, it } from '@jest/globals';

import {
  EXPORT_COLUMNS,
  csvRow,
  mapHeaders,
  normalizeCell,
  normalizeHeader,
  slugifyName,
} from './bulk-columns';

describe('normalizeHeader', () => {
  it('strips case, spaces and punctuation', () => {
    expect(normalizeHeader('Website Category L1')).toBe('websitecategoryl1');
    expect(normalizeHeader('category_L1')).toBe('categoryl1');
    expect(normalizeHeader('  SKU  ')).toBe('sku');
  });
});

describe('mapHeaders', () => {
  it('maps the export header row onto itself', () => {
    expect(mapHeaders([...EXPORT_COLUMNS])).toEqual([...EXPORT_COLUMNS]);
  });

  it("accepts the client's own sorting-sheet spellings", () => {
    expect(
      mapHeaders([
        'Product Name',
        'SKU',
        'ASI Product ID',
        'Website Category L1',
        'Website Category L2',
        'Website Category L3',
      ]),
    ).toEqual([
      'name',
      'sku',
      null, // unrecognised columns are carried past, not rejected
      'categoryL1',
      'categoryL2',
      'categoryL3',
    ]);
  });

  it('keeps only the first of a duplicated column', () => {
    expect(mapHeaders(['sku', 'SKU', 'categoryL1'])).toEqual([
      'sku',
      null,
      'categoryL1',
    ]);
  });
});

describe('normalizeCell', () => {
  it('trims and collapses whitespace', () => {
    // The sorting sheet carries trailing spaces on many category names;
    // without this "Bags " and "Bags" would be two different categories.
    expect(normalizeCell('3-d Products ')).toBe('3-d Products');
    expect(normalizeCell('  Office   & Desk ')).toBe('Office & Desk');
    expect(normalizeCell(undefined)).toBe('');
  });
});

describe('slugifyName', () => {
  it('matches the slugs already in the catalogue', () => {
    expect(slugifyName('USB & Tech')).toBe('usb-and-tech');
    expect(slugifyName('Events & Giveaways')).toBe('events-and-giveaways');
    expect(slugifyName('Ballpoint-plunger Action')).toBe(
      'ballpoint-plunger-action',
    );
    expect(slugifyName('  Pens  ')).toBe('pens');
  });
});

describe('csvRow', () => {
  it('quotes only what needs quoting', () => {
    expect(csvRow(['EB-1', 'Plain name'])).toBe('EB-1,Plain name\r\n');
    expect(csvRow(['EB-1', 'Name, with comma'])).toBe(
      'EB-1,"Name, with comma"\r\n',
    );
    expect(csvRow(['EB-1', 'He said "hi"'])).toBe('EB-1,"He said ""hi"""\r\n');
  });
});
