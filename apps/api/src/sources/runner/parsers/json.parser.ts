import { getPath } from '../path.util';
import { ParseResult, RecordParser } from './parser';

export class JsonParser implements RecordParser {
  parse(input: string | Buffer, recordsPath: string): ParseResult {
    const text = Buffer.isBuffer(input) ? input.toString('utf8') : input;
    const raw = JSON.parse(text) as unknown;
    const selected = getPath(raw, recordsPath || '$');
    const records = Array.isArray(selected)
      ? selected
      : selected === undefined
        ? []
        : [selected];
    return { raw, records };
  }
}
