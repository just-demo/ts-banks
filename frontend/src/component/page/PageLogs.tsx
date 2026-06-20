import {useEffect, useState} from 'react';
import '../../App.css';
import _ from 'lodash';
import AppBar from '@mui/material/AppBar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

const MAX_NUMBER = 3;

interface LogRequest {
    url: string;
    time: number;
}

function parseLog(text: string): LogRequest[] {
    const regex = /^GET (.*) (\d+)ms$/gm;
    const requests: LogRequest[] = [];
    let match;
    while ((match = regex.exec(text))) {
        requests.push({url: match[1], time: parseInt(match[2])});
    }
    return requests;
}

function logPath(file: string) {
    return '/data-logs/' + file;
}

async function probeLogs(): Promise<string[]> {
    const files: string[] = [];
    for (let number = 1; number <= MAX_NUMBER; number++) {
        const file = number + '.txt';
        const response = await fetch(logPath(file), {method: 'HEAD'});
        if (response.status === 404) {
            break;
        }
        files.push(file);
    }
    return files;
}

function formatTime(time: number) {
    return new Date(time).toISOString().substr(11, 8);
}

function PageLogs() {
    const [files, setFiles] = useState<string[]>([]);
    const [fileIndex, setFileIndex] = useState(0);
    const [requests, setRequests] = useState<LogRequest[]>([]);

    const selectFile = (fileIndex: number, fileList: string[] = files) => {
        setFileIndex(fileIndex);
        fetch(logPath(fileList[fileIndex]))
            .then(log => log.text())
            .then(log => setRequests(parseLog(log)));
    };

    useEffect(() => {
        // TODO: use log delays to emulate requests, divide time in dev mode for ease of use
        probeLogs().then(files => {
            setFiles(files);
            if (files.length) {
                fetch(logPath(files[0]))
                    .then(log => log.text())
                    .then(log => setRequests(parseLog(log)));
            }
        });
    }, []);

    const totalTime = _.sumBy(requests, 'time');

    return (
        <div>
            <AppBar position="static">
                <Tabs value={fileIndex} onChange={(_event, fileIndex) => selectFile(fileIndex)}
                      style={{backgroundColor: 'white', color: 'black'}}>
                    {files.map(file => (
                        <Tab key={file} label={file}/>
                    ))}
                </Tabs>
            </AppBar>
            <div style={{padding: 10}}>Сумарний час: {formatTime(totalTime)}</div>
            <table className="request">
                <tbody>
                {requests.map((request, index) => (
                    <tr key={index}>
                        <td>{index}</td>
                        <td>{request.url}</td>
                        <td>{request.time}</td>
                        <td>
                            <div style={{
                                backgroundColor: 'skyblue',
                                width: Math.round(request.time / 5)
                            }}>&nbsp;</div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

        </div>
    );
}

export default PageLogs;
