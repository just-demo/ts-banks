import {useState} from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from "@mui/material/FormControlLabel";

const REFRESH_SERVICE = 'http://localhost:3333';

interface RefreshResult {
    progress?: {
        ready: boolean;
        now: number;
        start: number;
        end: number;
    };
}

function formatTime(time?: number) {
    return time && new Date(time).toISOString().substr(11, 8);
}

function PageRefresh() {
    const [progress, setProgressValue] = useState(0);
    const [clearCache, setClearCache] = useState(false);
    const [error, setError] = useState(false);
    const [taken, setTaken] = useState<number>();

    const setProgress = (progress: number, taken?: number) => {
        setProgressValue(Math.min(Math.round(progress * 100), progress < 1 ? 99 : 100));
        if (taken) {
            setTaken(taken);
        }
    };

    const checkResult = () => {
        fetch(REFRESH_SERVICE)
            .then(result => result.json())
            .then((result: RefreshResult) => {
                if (result.progress) {
                    console.log('In progress...', result.progress);
                    if (result.progress.ready) {
                        const taken = result.progress.now - result.progress.start;
                        const total = result.progress.end - result.progress.start;
                        setProgress(taken / total, taken);
                    }
                    setTimeout(() => checkResult(), 100);
                } else {
                    console.log('Done!', result);
                    setProgress(1);
                }
            });
    };

    const handleRefresh = () => {
        setProgress(0);
        fetch(REFRESH_SERVICE, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({clearCache})
        }).then(() => {
            console.log('Refreshing...');
            setError(false);
            // TODO: make result a Promise?
            checkResult();
        }).catch(() => setError(true));
    };

    return (
        <div>
            <div style={{margin: 10, marginLeft: 20}}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={clearCache}
                            onChange={event => setClearCache(event.target.checked)}
                            color="primary"
                        />
                    } label="Очистити кеш"
                />
                <br/>
                <button onClick={() => handleRefresh()}>Старт</button>
                <div style={{
                    width: 300,
                    height: 25,
                    border: '1px solid black',
                    display: 'inline-block',
                    margin: 5,
                    marginLeft: 20,
                    position: 'relative',
                    textAlign: 'center'
                }}>
                    {progress}%
                    <div style={{
                        width: progress + '%',
                        height: '100%',
                        backgroundColor: 'skyblue',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: -1
                    }}>&nbsp;</div>
                </div>
                <div style={{
                    display: 'inline-block',
                    margin: 5,
                    marginLeft: 20,
                    textAlign: 'center'
                }}>{formatTime(taken)}</div>
            </div>
            <div style={{color: 'red', marginLeft: 20}}>
                {error && 'Сервіс недоступний'}
            </div>
        </div>
    );
}

export default PageRefresh;
