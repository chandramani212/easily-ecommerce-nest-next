import { XMLParser } from 'fast-xml-parser';

import { getPath } from '../path.util';
import { ParseResult, RecordParser } from './parser';

const xml = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
  // Don't auto-coerce: keep the textual fidelity for JSONPath consumers; Mapper
  // does explicit coercion based on the field-mapping spec.
  parseTagValue: false,
  trimValues: true,
});

export class XmlParser implements RecordParser {
  parse(input: string | Buffer, recordsPath: string): ParseResult {
    const text = Buffer.isBuffer(input) ? input.toString('utf8') : input;
    const raw = xml.parse(text);
    const selected = getPath(raw, recordsPath || '$');
    const records = Array.isArray(selected)
      ? selected
      : selected === undefined || selected === null
        ? []
        : [selected];
    return { raw, records };
  }
}
