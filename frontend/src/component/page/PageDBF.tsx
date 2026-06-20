import {useEffect, useState} from 'react';
import '../../App.css';
import type {DbfRow} from "../../model";

function filter(data: DbfRow[]): DbfRow[] {
    // const term = 'Укрексўмбанк'.toLowerCase();
    // return data.filter((row, index) => !index || row.some(cell => ('' + cell).toLowerCase().includes(term)));
    return data;
}

function PageDBF() {
    const [banks, setBanks] = useState<DbfRow[]>([]);

    useEffect(() => {
        fetch('/data/dbf.json')
            .then(banks => banks.json())
            .then(banks => setBanks(banks));
    }, []);

    return (
        <div>
            <table className="banks">
                <tbody>
                {filter(banks).map((bank, lineIndex) => (
                    <tr key={lineIndex}>
                        <td>{lineIndex}</td>
                        {bank.map((field, cellIndex) => (
                            <td key={cellIndex} style={{whiteSpace: 'nowrap'}}>{field}</td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default PageDBF;
