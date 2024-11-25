import React, { useCallback, useEffect, useState } from 'react';
import { render, Text } from 'ink';
import { Task, TaskExecutor } from './lib/Task';

import RetrieveBasisbeveiligingURLs from './tasks/RetrieveBasisbeveiligingURLs';
import RetrieveMX from './tasks/RetrieveMX';
import RetrieveElsevier500URLs from './tasks/RetrieveElsevier500URLs';
import RetrieveWebhost from './tasks/RetrieveWebhost';

const tasks: Task[] = [
    RetrieveBasisbeveiligingURLs,
    RetrieveElsevier500URLs,
    RetrieveMX,
    RetrieveWebhost,
];

function App() {
    const [state, setState] = useState(0);

    const handleFinish = useCallback(() => setState((s) => s + 1), []);

    useEffect(() => {
        if (state >= tasks.length) {
            process.exit();
        }
    }, [state])

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