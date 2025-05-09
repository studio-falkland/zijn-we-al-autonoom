import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, render, Spacer, Text } from 'ink';

// import RetrieveBasisbeveiligingURLs from '@/tasks/basisbeveiliging/index.js';
import RetrieveMX from '@/tasks/mx/index.js';
import RetrieveElsevier500URLs from '@/tasks/elsevier/index.js';
import RetrieveWebhost from '@/tasks/webhost/index.js';
import RetrieveRijksoverheidURLs from '@/tasks/rio/index.js';
import RetrieveSchoolURLs from '@/tasks/duo/index.js';
import { Task } from './lib/task/index.jsx';
import db from '@are-we-dependent/data';
import TaskExecutor from './lib/task/executor.jsx';
import RetrieveIPInfoDatabase from './tasks/ipinfo/index.js';
import RetrieveCaidaASNDataset from './tasks/caida/index.js';
import { RetrieveSIDNLabsNLTLDData } from './tasks/sidn-labs/index.js';
import RetrieveOpenStreetMapData from './tasks/open-street-map/index.js';
import GeocodeOrganisationAddresses from './tasks/kadaster/index.js';
import { Spinner } from '@inkjs/ui';

await db.initialize();
await db.runMigrations();

const tasks: (typeof Task)[] = [
    RetrieveCaidaASNDataset,
    RetrieveIPInfoDatabase,
    RetrieveRijksoverheidURLs,
    RetrieveSchoolURLs,
    RetrieveElsevier500URLs,
    // RetrieveBasisbeveiligingURLs,
    RetrieveOpenStreetMapData,
    RetrieveMX,
    RetrieveWebhost,
    RetrieveSIDNLabsNLTLDData,
    GeocodeOrganisationAddresses,
];

// Add signal handling before the App component
process.on('SIGINT', () => {
    process.exit(0);
});

const enterAltScreenCommand = '\x1b[?1049h';
const leaveAltScreenCommand = '\x1b[?1049l';
process.stdout.write(enterAltScreenCommand);
process.on('exit', () => {
    process.stdout.write(leaveAltScreenCommand);
});

process.on('uncaughtException', (error) => {
    process.stdout.write(leaveAltScreenCommand);
    console.error(error);
    process.exit(1);
});

function App() {
    const [state, setState] = useState(0);

    const handleFinish = useCallback(() => setState((s) => s + 1), []);

    const task = useMemo(() => tasks[state], [state]);

    useEffect(() => {
        if (state >= tasks.length) {
            process.exit();
        }
    }, [state]);

    return (
        <Box height="100%" width="100%" flexDirection="column" borderStyle="double">
            <Box width="100%" marginX={1} marginBottom={1}>
                <Text bold color="blueBright">🌐 NL Infrastructure Dependency Scanner</Text>
            </Box>
            <Box marginX={1}>
                <Box width="66%" flexDirection="column">
                    <Text bold>{task.name}</Text>
                    <TaskExecutor task={task} onFinish={handleFinish} />
                    <Spacer />
                </Box>
                <Box flexDirection="column">
                    <Text bold>Tasks</Text>
                    {tasks.map((task, i) => (
                        <Box gap={2} key={task.name}>
                            {state === i ? <Spinner /> : state > i ? <Text color="greenBright">✔️</Text> : <Text color="gray">…</Text>}
                            <Text
                                wrap="truncate"
                                bold={state === i}
                                color={state === i ? 'white' : state > i ? 'greenBright' : 'gray'}
                            >
                                {task.name}
                            </Text>
                        </Box>
                    ))}
                    <Spacer />
                </Box>
            </Box>
        </Box>
    );
}

render(<App />);
