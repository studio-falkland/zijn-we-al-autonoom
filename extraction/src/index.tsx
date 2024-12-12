import React, { useCallback, useEffect, useState } from 'react';
import { render, Text } from 'ink';

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

await db.initialize();
await db.runMigrations();

const tasks: (typeof Task)[] = [
    RetrieveIPInfoDatabase,
    RetrieveRijksoverheidURLs,
    RetrieveSchoolURLs,
    RetrieveElsevier500URLs,
    // RetrieveBasisbeveiligingURLs,
    // RetrieveMX,
    // RetrieveWebhost,
];

function App() {
    const [state, setState] = useState(0);

    const handleFinish = useCallback(() => setState((s) => s + 1), []);

    useEffect(() => {
        if (state >= tasks.length) {
            process.exit();
        }
    }, [state]);

    return (
        <>
            <Text>🌐 NL Infrastructure Dependency Scanner</Text>
            {tasks.map((task, i) => (
                <TaskExecutor task={task} onFinish={handleFinish} key={i} active={state >= i} />
            ))}
        </>
    );
}

render(<App />);
