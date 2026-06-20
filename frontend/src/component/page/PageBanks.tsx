import {type ChangeEvent, type CSSProperties, useEffect, useState} from 'react';
import '../../App.css';
import _ from 'lodash';
import 'bootstrap/dist/css/bootstrap.css'
import Utils from "../Utils";
import ExternalLink from "../ExternalLink";
import ActiveIndicator from "../ActiveIndicator";
import type {Bank, BySource, SourceKey} from "../../model";

interface Source {
    type: SourceKey;
    title: string;
    href: string;
    color: string;
}

const sources: Source[] = [
    {
        type: 'api',
        title: 'НБУ API',
        href: 'https://bank.gov.ua/control/uk/publish/article?art_id=38441973&cat_id=38459171#get_data_branch',
        color: 'red',
    },
    {
        type: 'nbu',
        title: 'НБУ',
        href: 'https://bank.gov.ua',
        color: 'orange',
    },
    {
        type: 'fund',
        title: 'ФГВФО',
        href: 'http://www.fg.gov.ua',
        color: 'yellow',
    },
    {
        type: 'minfin',
        title: 'Міфін',
        href: 'https://minfin.com.ua',
        color: 'brown',
    }
];

function truncateSite(site: string) {
    return site.replace(/(?<!:|:\/)\/.*/g, '').replace(/^http(s)?:\/\//, '');
}

function allTrue(object: BySource<boolean>) {
    return _.every(Object.values(object));
}

function PageBanks() {
    const [filter, setFilter] = useState<Record<string, boolean>>({
        seagreen: true,
        royalblue: true,
        red: true,
        orange: true,
        yellow: true,
        brown: true
    });
    const [filterActive, setFilterActive] = useState(false);
    const [banks, setBanks] = useState<Bank[]>([]);

    useEffect(() => {
        fetch('/data/banks.json')
            .then(banks => banks.json())
            .then(banks => setBanks(banks));
    }, []);

    const handleFilterChange = (color: string) => {
        setFilter({...filter, [color]: !filter[color]});
    };

    const handleFilterActiveChange = (event: ChangeEvent<HTMLInputElement>) => {
        setFilterActive(event.target.checked);
    };

    const enabledSources = () => {
        // TODO: optimize performance
        return sources.filter(source => filter[source.color]);
    };

    const styleForCell = (bank: Bank, currentSource: Source): CSSProperties => {
        const allNames = enabledSources().length;
        const populatedNames = enabledSources().filter(source => bank.name[source.type]).length;
        return (populatedNames === 1 && bank.name[currentSource.type]) || (populatedNames === allNames - 1 && !bank.name[currentSource.type]) ? {
            backgroundColor: currentSource.color
        } : {};
    };

    const styleForRow = (bank: Bank): CSSProperties => {
        const allNames = enabledSources().length;
        const populatedNames = enabledSources().filter(source => bank.name[source.type]).length;
        const color = populatedNames === allNames || !populatedNames ? 'seagreen' :
            populatedNames === 1 || populatedNames === allNames - 1 ? 'white' : 'royalblue';
        const style: CSSProperties = {
            backgroundColor: color
        };

        if (color !== 'white' && !filter[color]) {
            style.display = 'none';
        }

        return style;
    };

    const filterNames: Record<string, string> = {
        seagreen: 'Повний збіг',
        royalblue: 'Неоднозначність',
    };
    sources.forEach(source => filterNames[source.color] = source.title);
    //TODO: make filter component reusable?
    return (
        <div>
            <div style={{padding: 10}}>
            {Object.keys(filter).map(color => (
                <span key={color} style={{backgroundColor: color, marginRight: 5, padding: 5}}>
                    <input
                        type="checkbox"
                        id={'filter-' + color}
                        checked={filter[color]}
                        onChange={() => handleFilterChange(color)}
                    />
                    <label htmlFor={'filter-' + color}>{filterNames[color]}</label>
                </span>
            ))}
            </div>
            <table className="banks">
                <tbody>
                <tr>
                    <th>
                        <input type="checkbox" onChange={handleFilterActiveChange} style={{marginTop: 5}}/>
                    </th>
                    <th>Сайт</th>
                    {enabledSources().map(source => (
                        <th key={source.type}>
                            <ExternalLink url={source.href} title={source.title}/>
                        </th>
                    ))}
                </tr>
                {banks.filter(bank => !filterActive || allTrue(bank.active)).map(bank => (
                    <tr key={bank.id} style={styleForRow(bank)}>
                        {/*TODO: style for active if there is a mismatch*/}
                        <td style={{textAlign: 'center'}}>
                            <ActiveIndicator value={allTrue(bank.active)}/>
                        </td>
                        {/*TODO: filter out duplicate sites and show source of each site*/}
                        <td>
                            {_.uniq(_.flatten(Object.values(bank.site) as string[][])).map(site => (
                                <p key={site}><ExternalLink url={truncateSite(site)} style={{color: 'black'}}/></p>
                            ))}
                        </td>
                        {enabledSources().map(source => (
                            <td
                                key={source.type}
                                style={styleForCell(bank, source)}
                                title={Utils.ifExceeds(bank.name[source.type] || '', 30)}
                            >
                            {Utils.truncate(bank.name[source.type] || '', 30)}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default PageBanks;
