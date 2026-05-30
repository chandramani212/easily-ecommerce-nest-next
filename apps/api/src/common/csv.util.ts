export interface CsvColumn<T> {
  header: string;
  value: (row: T) => unknown;
}

function escapeCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  let s: string;
  if (val instanceof Date) {
    s = val.toISOString();
  } else {
    s = String(val);
  }
  if (/[",\n\r]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Serializes rows to a CSV string (RFC 4180 quoting). A leading UTF-8 BOM is
 * prepended so Excel opens non-ASCII content correctly.
 */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCell(c.header)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escapeCell(c.value(row))).join(','))
    .join('\r\n');
  const content = body ? `${header}\r\n${body}\r\n` : `${header}\r\n`;
  return `﻿${content}`;
}
