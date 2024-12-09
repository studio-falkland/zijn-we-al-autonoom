/**
 * This library is adapted from `chadkeck`'s `ip-to-asn` library, licensed under MIT
 * @see https://github.com/chadkeck/ip-to-asn/blob/master/lib/ip-to-asn.js
 * @author Chad Bibler (https://chadbibler.com)
 */

import net from 'net';
import logger from './logger.js';

const SERVICE_HOST = 'v4.whois.cymru.com';
const SERVICE_PORT = 43;

export type IPToASNResponse = {
    ASN?: string;
    address?: string;
    addressWithRange?: string;
    countryCode?: string;
    registrar?: string;
    dateString?: string;
    description?: string;
};

class IPToASN {
    serviceOptions = {
        host: SERVICE_HOST,
        port: SERVICE_PORT,
    };

    query(addresses: string[]) {
        return new Promise<IPToASNResponse[]>((resolve, reject) => {
            const client = net.connect(this.serviceOptions);
            const results: IPToASNResponse[] = [];
            client.setEncoding('utf8');

            client.on('connect', () => {
                const request = this._generateRequest(addresses);
                logger.info('Requesting WHOIS information for addresses:', request);
                client.write(request);
            });

            client.on('data', (response) => {
                const chunks = this._handleResponse(response);
                results.push(...chunks);
            });

            client.on('end', () => {
                resolve(results);
            });

            client.on('error', (err) => {
                reject(err);
            });
        });
    }

    _generateRequest(addresses: string[]) {
        let request = '';
        request += 'begin\r\n';
        request += 'verbose\r\n';
        addresses.forEach((address) => {
            request += address + '\r\n';
        });
        request += 'end\r\n';

        return request;
    }

    _handleResponse(response: Buffer): IPToASNResponse[] {
        const lines = response.toString().split('\n');
        return this._processResponseLines(lines);
    }

    _processResponseLines(lines: string[]) {
        return lines.map(this._processResponseLine)
            .filter((r) => !!r);
    }

    _processResponseLine(line: string): IPToASNResponse | void {
        const errorLineMessage = 'Error: no ASN or IP match';
        const commentResponseLine = 'Bulk mode;';
        const fieldDelimiter = '|';

        if (line.length === 0) return;
        if (line.indexOf(errorLineMessage) === 0) return;
        if (line.indexOf(commentResponseLine) === 0) return;

        const resultChunks = line.split(fieldDelimiter)
            .map((field) => field.trim());

        const asn = resultChunks[0];
        const ipAddress = resultChunks[1];
        const addressWithRange = resultChunks[2];
        const countryCode = resultChunks[3];
        const registrar = resultChunks[4];
        const dateString = resultChunks[5];
        const description = resultChunks[6];

        return {
            ASN: asn,
            address: ipAddress,
            addressWithRange: addressWithRange,
            countryCode: countryCode,
            registrar: registrar,
            dateString: dateString,
            description: description,
        };
    }
}
export default IPToASN;
