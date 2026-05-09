import { SupplierImportFormat } from '@prisma/client';

import { CsvParser } from './csv.parser';
import { JsonParser } from './json.parser';
import { XmlParser } from './xml.parser';

export interface ParseResult {
  /** Records selected by `recordsPath`, always returned as an array. */
  records: unknown[];
  /** The full parsed payload, exposed so the UI can show a sample tree. */
  raw: unknown;
}

export interface RecordParser {
  parse(input: string | Buffer, recordsPath: string): ParseResult;
}

export function parserFor(format: SupplierImportFormat): RecordParser {
  switch (format) {
    case 'JSON':
      return new JsonParser();
    case 'XML':
      return new XmlParser();
    case 'CSV':
      return new CsvParser();
    default: {
      const _exhaustive: never = format;
      void _exhaustive;
      throw new Error(`Unsupported format: ${String(format)}`);
    }
  }
}
