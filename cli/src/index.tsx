#!/usr/bin/env node
import { Spinner } from '@inkjs/ui';
import { Box, render, Text } from 'ink';
import { createRequire } from 'module';
import { useEffect, useState } from 'react';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { check } from './check.js';
import type { CheckResult, CheckValue } from './check.js';
import { getEmojiForCountryCode } from './lib/emoji.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string };

const argv = await yargs(hideBin(process.argv))
    .scriptName('zwaa')
    .usage('$0 [options] <url...>')
    .option('json', {
        type: 'boolean',
        describe: 'Output the results as JSON',
        default: false,
    })
    .option('follow-redirects', {
        type: 'boolean',
        describe: 'Follow HTTP redirects to the final domain',
        default: true,
    })
    .help()
    .alias('help', 'h')
    .version(pkg.version)
    .alias('version', 'v')
    .demandCommand(1, 'Provide at least one URL to check.')
    .strict()
    .parse();

const urls = argv._.map(String);
const followRedirects = argv['follow-redirects'];

if (argv.json) {
    try {
        const results = await Promise.all(urls.map((url) => check(url, { followRedirects })));
        console.log(JSON.stringify(results, null, 2));
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
} else {
    render(<App urls={urls} followRedirects={followRedirects} />);
}

function App({ urls, followRedirects }: { urls: string[]; followRedirects: boolean }) {
    const [results, setResults] = useState<CheckResult[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all(urls.map((url) => check(url, { followRedirects })))
            .then(setResults)
            .catch((err) => setError(err instanceof Error ? err.message : String(err)));
    }, [urls, followRedirects]);

    if (error) {
        return <Text color="red">{error}</Text>;
    }

    if (!results) {
        return (
            <Box>
                <Spinner />
                <Text> Checking {urls.length} {urls.length === 1 ? 'domain' : 'domains'}…</Text>
            </Box>
        );
    }

    return (
        <Box flexDirection="column">
            <Text bold color="blueBright">🌐 zwaa</Text>
            {results.map((result, index) => (
                <Box key={result.url} flexDirection="column" marginTop={index === 0 ? 1 : 2}>
                    <Text bold>
                        {result.redirectedTo
                            ? `${result.url} → ${result.domain}`
                            : result.domain ?? result.url}
                    </Text>
                    {result.domain ? (
                        <>
                            <CheckRow label="Webhosting" value={result.webhosting} />
                            <CheckRow label="E-mail" value={result.email} />
                        </>
                    ) : (
                        <Text color="red">  Invalid URL</Text>
                    )}
                </Box>
            ))}
        </Box>
    );
}

function CheckRow({ label, value }: { label: string; value?: CheckValue }) {
    if (!value) {
        return (
            <Box flexDirection="row">
                <Box width={15}><Text>  {label}</Text></Box>
                <Text>—</Text>
            </Box>
        );
    }

    if ('error' in value) {
        return (
            <Box flexDirection="row">
                <Box width={15}><Text>  {label}</Text></Box>
                <Text color="red">—  {value.error}</Text>
            </Box>
        );
    }

    const flag = getEmojiForCountryCode(value.country);
    const organisation = value.organisation ?? 'Unknown';
    const asn = value.asn ? `(AS${value.asn})` : '';
    const isUS = value.country === 'US';
    const mark = value.country
        ? isUS
            ? <Text color="red">✗ </Text>
            : <Text color="green">✓ </Text>
        : null;

    return (
        <Box flexDirection="row">
            <Box width={15}><Text>  {label}</Text></Box>
            <Box width={2}>{mark}</Box>
            <Box width={3}><Text>{flag}</Text></Box>
            <Box flexGrow={1}><Text>{organisation}</Text></Box>
            <Box width={12}><Text>{asn}</Text></Box>
        </Box>
    );
}
