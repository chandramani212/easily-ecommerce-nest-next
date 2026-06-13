import { parse } from 'csv-parse/sync';

import { ParseResult, RecordParser } from './parser';

export class CsvParser implements RecordParser {
  parse(input: string | Buffer, _recordsPath: string): ParseResult {
    void _recordsPath;
    const text = Buffer.isBuffer(input) ? input.toString('utf8') : input;
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as Record<string, string>[];
    return { raw: records, records };
  }
}
