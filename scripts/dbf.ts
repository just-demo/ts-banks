import iconv from 'iconv-lite';
import _ from 'lodash';
import files from './files';
import type {DbfField, DbfRecord, DbfValue} from './model';

export default {
    async parse(fileOrBuffer: string | Buffer): Promise<DbfRecord[]> {
        const buffer = _.isString(fileOrBuffer) ? await files.readRaw(fileOrBuffer) : fileOrBuffer;
        return new DbfParser('cp866').parse(buffer);
    }
};

class DbfParser {
    encoding: string;

    constructor(encoding: string = 'utf-8') {
        this.encoding = encoding;
    }

    parse(buffer: Buffer): DbfRecord[] {
        const numberOfRecords = this.parseInt(buffer.slice(4, 8));
        const headerLength = this.parseInt(buffer.slice(8, 10));
        const recordLength = this.parseInt(buffer.slice(10, 12));

        const fields: DbfField[] = [];
        for (let i = 32, iMax = headerLength - 32; i <= iMax; i += 32) {
            fields.push(this.parseFieldDesc(buffer.slice(i, i + 32)));
        }

        const records: DbfRecord[] = [fields.map(field => field.name)];
        for (let i = 0; i < numberOfRecords; i++) {
            const recordStart = headerLength + i * recordLength;
            const recordBuffer = buffer.slice(recordStart, recordStart + recordLength);
            const recordDeleted = recordBuffer.slice(0, 1).toString() === '*';
            if (!recordDeleted) {
                let shift = 1;
                const record = fields.map(field => this.parseField(field, recordBuffer.slice(shift, (shift += field.length))));
                records.push(record);
            }
        }

        return records;
    }

    parseField(field: DbfField, buffer: Buffer): DbfValue {
        const value = buffer.toString().trim();
        switch (field.type) {
            case 'C':
            case 'M':
                return this.parseString(buffer);
            case 'F':
            case 'N':
                return field.decimalCount ? parseFloat(value) : parseInt(value);
            case 'L':
                return this.parseBoolean(value);
            case 'D':
                return this.parseDate(value);
            default:
                return value;
        }
    }

    parseBoolean(str: string): boolean | null {
        switch (str) {
            case 'Y':
            case 'y':
            case 'T':
            case 't':
                return true;
            case 'N':
            case 'n':
            case 'F':
            case 'f':
                return false;
            default:
                return null;
        }
    }

    parseString(buffer: Buffer): string {
        const str = iconv.decode(buffer, this.encoding).trim();
        return this.encoding === 'cp866' ? this.fixCp866Chars(str) : str;
    }

    fixCp866Chars(str: string): string {
        return str.replace(/Ї/g, 'Є')
            .replace(/°/g, 'Ї')
            .replace(/∙/g, 'ї')
            .replace(/Ў/g, 'І')
            .replace(/ў/g, 'і');
    }

    parseDate(str: string): string | null {
        return str ? [str.substring(0, 4), str.substring(4, 6), str.substring(6, 8)].join('-') : null;
    }

    parseFieldDesc(buffer: Buffer): DbfField {
        return {
            name: buffer.slice(0, 11).toString().replace(/\0+/, ''),
            type: buffer.slice(11, 12).toString(),
            length: this.parseInt(buffer.slice(16, 18)),
            decimalCount: 0, // TODO: research this.parseInt(buffer.slice(17, 18)),
        };
    }

    parseInt(buffer: Buffer): number {
        return buffer.readIntLE(0, buffer.length);
    }
}
