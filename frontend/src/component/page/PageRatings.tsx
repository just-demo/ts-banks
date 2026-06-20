import React, {useEffect, useState} from 'react';
import '../../App.css';
import './PageRatings.css';
import _ from 'lodash';
import 'bootstrap/dist/css/bootstrap.css'
import Scale from '../Scale';
import classNames from 'classnames';
import Bank from '../Bank';
import Utils from "../Utils";
import ExternalLink from "../ExternalLink";
import Search from "../Search";
import ActiveIndicator from "../ActiveIndicator";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import type {Bank as BankData, Ratings, RatingBank} from "../../model";

function getMostRelevantBankName(bank: BankData) {
    // Even thought banks names were sorted in such a way that most relevant go first there are cases when non-relevant name groups go first and mess up final result
    const nameCounts = _.countBy(_.flatten([bank.names.api, bank.names.nbu, bank.names.fund].filter(_.identity) as string[][]), _.identity);
    return _.maxBy(Object.keys(nameCounts), name => nameCounts[name]) || bank.name.minfin;
}

function getRatingSourceLink(date: string) {
    return 'https://minfin.com.ua/ua/banks/rating/?date=' + date;
}

function formatDayMonth(date: string) {
    const parsed = new Date(date);
    return _.padStart('' + parsed.getDate(), 2, '0') + '.' + _.padStart('' + (parsed.getMonth() + 1), 2, '0');
}

function compare(a?: string, b?: string) {
    return _.isUndefined(a) ?
        _.isUndefined(b) ? 0 : -1 :
        _.isUndefined(b) ? 1 :
            a > b ? 1 : a < b ? -1 : 0;
}

function compareBy(obj1: RatingBank, obj2: RatingBank, fields: Partial<Record<keyof RatingBank, boolean>>) {
    for (const field of Object.keys(fields) as Array<keyof RatingBank>) {
        const diff = compare(obj1[field] as string, obj2[field] as string);
        if (diff) {
            return fields[field] ? diff : -diff;
        }
    }
    return 0;
}

function linearScale(key: number, minKey: number, minValue: number, maxKey: number, maxValue: number) {
    return Math.round(minValue + (maxValue - minValue) * (key - minKey) / (maxKey - minKey));
}

function classForCell(bank: RatingBank, date: string) {
    return classNames({
        'rating': true,
        'issue': (bank.dateIssueMax as string) >= date && date >= (bank.dateIssueMin as string),
        'issue-max': bank.dateIssueMax === date,
        'issue-min': bank.dateIssueMin === date,
        'closed': (bank.dateClosed && date > (bank.dateIssueMax as string)) || (bank.dateOpen && date < bank.dateOpen),
        'open': bank.dateOpen && bank.dateOpen === date
    });
}

function PageRatings() {
    const [scale, setScale] = useState(1);
    const [bankSelected, setBankSelected] = useState<string | null>(null);
    const [collapsedYears, setCollapsedYears] = useState<Record<string, boolean>>({});
    const [banks, setBanks] = useState<BankData[]>([]);
    const [ratings, setRatings] = useState<Ratings>({});
    const [filterActive, setFilterActive] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/data/banks.json')
            .then(banks => banks.json())
            .then(banks => setBanks(banks));

        fetch('/data/minfin-ratings.json')
            .then(ratings => ratings.json())
            .then(ratings => setRatings(ratings));
    }, []);

    const dates = Object.keys(ratings).sort().reverse();

    const projectDate = (date?: string) => {
        if (!date) {
            return date;
        }
        let projected = date;
        for (const d of dates) {
            if (d < date) {
                return projected;
            }
            projected = d;
        }
        return projected;
    };

    const applyFilter = (bank: RatingBank) => {
        if (filterActive && !bank.active) {
            return false;
        }
        const term = (search || '').toUpperCase();
        const hasTerm = (array: string[]) => array.some(item => item.toUpperCase().includes(term));
        return !term || hasTerm(Object.values(bank.data.name)) || Object.values(bank.data.names).some(names => hasTerm(names));
    };

    const styleForCell = (rating?: string) => {
        if (!rating) {
            return {};
        }

        const max = 5;    // green  - rgb(  0, 128, 0)
        const middle = 3; // yellow - rgb(255, 255, 0)
        const min = 1;    // red    - rgb(255,   0, 0)
        let value = Math.max(min, Math.min(max, Number(rating))); // truncate
        value = Math.floor(value * scale) / scale; // resolution
        const red = value <= middle ? 255 : linearScale(value, middle, 255, max, 0);
        const green = value >= middle ? linearScale(value, middle, 255, max, 128) : linearScale(value, min, 0, middle, 255);
        const blue = 0;
        return {backgroundColor: `rgb(${red}, ${green}, ${blue})`};
    };

    const handleBankSelected = (bankId: string) => {
        setBankSelected(bankSelected === bankId ? null : bankId);
    };

    const toggleYear = (year: string) => {
        setCollapsedYears({...collapsedYears, [year]: !collapsedYears[year]});
    };

    const banksById = _.keyBy(banks.map(bank => {
        const datesIssue = Object.values(bank.dateIssue);
        return {
            id: bank.internal.id.minfin,
            name: getMostRelevantBankName(bank),
            // site: (bank.site.minfin || [])[0],
            // link: bank.internal.link.minfin,
            dateOpen: projectDate(bank.dateOpen.api),
            dateClosed: projectDate(bank.dateIssue.pdf),
            dateIssueMin: projectDate(_.min(datesIssue)),
            dateIssueMax: projectDate(_.max(datesIssue)),
            active: _.every(Object.values(bank.active)),
            data: bank
        };
    })
        .filter(bank => bank.name)
        .filter(bank => applyFilter(bank as RatingBank)), 'id') as Record<string, RatingBank>;

    // Sort by latest rating in reverse order
    const bankIds = Object.keys(banksById).sort((bankId1, bankId2) => {
        for (const date of dates) {
            const dateRating = ratings[date];
            const diff = compare(dateRating[bankId1], dateRating[bankId2]);
            if (diff) {
                return diff;
            }
        }

        return compareBy(banksById[bankId1], banksById[bankId2], {
            dateIssueMin: true,
            dateIssueMax: true,
            dateOpen: false,
            dateClosed: true
        });
    }).reverse();

    const datesByYear = _.groupBy(dates, (date: string) => date.split('-')[0]);
    const years = Object.keys(datesByYear).sort().reverse();
    const nVisibleColumns = years.reduce((n, year) =>
        n + (collapsedYears[year] ? 1 : datesByYear[year].length), 0);
    return (
        <div>
            <div style={{display: 'flex', justifyContent: 'center', padding: 5}}>
                    <Scale value={scale} values={[1, 2, 5, 10, 100]}
                           onChange={(scale: number) => setScale(scale)}/>
            </div>
            <table className="ratings">
                <tbody>
                <tr>
                    <th rowSpan={2}>
                        <input type="checkbox" onChange={event => setFilterActive(event.target.checked)} style={{
                            marginTop: 5
                        }}/>
                    </th>
                    <th style={{minWidth: 215}} rowSpan={2}>
                        <Search onChange={(search: string) => setSearch(search)}/>
                    </th>
                    {years.map(year => collapsedYears[year] ? (
                        <th key={year} className="year-col-collapsed" title={'Розгорнути ' + year}
                            onClick={() => toggleYear(year)}><ChevronRight fontSize="small"/></th>
                    ) : (
                        <th key={year} colSpan={datesByYear[year].length} className="year-header"
                            title={'Згорнути ' + year} onClick={() => toggleYear(year)}>
                            {year}<ChevronLeft fontSize="small" style={{verticalAlign: 'middle'}}/>
                        </th>
                    ))}
                </tr>
                <tr>
                    {years.map(year => collapsedYears[year] ? (
                        <th key={year} className="year-col-collapsed" title={'Розгорнути ' + year}
                            onClick={() => toggleYear(year)}><span className="year-label-vertical">{year}</span></th>
                    ) : (
                        datesByYear[year].map((date: string) => (
                            <th key={date}><ExternalLink url={getRatingSourceLink(date)} title={formatDayMonth(date)}/></th>
                        ))
                    ))}
                </tr>
                {bankIds.map(bankId => (
                    <React.Fragment key={bankId}>
                        <tr onClick={() => handleBankSelected(bankId)}>
                            <td style={{textAlign: 'center'}}><ActiveIndicator value={banksById[bankId].active}/></td>
                            <td style={{paddingLeft: 3}} title={Utils.ifExceeds(banksById[bankId].name, 30)}><a
                                href={undefined}>{Utils.truncate(banksById[bankId].name, 30)}</a></td>
                            {years.map(year => collapsedYears[year] ? (
                                <td key={year} className="year-col-collapsed"/>
                            ) : (
                                datesByYear[year].map((date: string) => (
                                    <td key={date} className={classForCell(banksById[bankId], date)}
                                        style={styleForCell(ratings[date][bankId])}>
                                        <div>
                                            {ratings[date][bankId] || '-'}
                                        </div>
                                    </td>
                                ))
                            ))}
                        </tr>
                        {bankId === bankSelected && (
                            <tr className="details">
                                <td>&nbsp;</td>
                                <td style={{paddingLeft: 20}}>
                                    {_.uniq(_.flatten(Object.values(banksById[bankId].data.names) as string[][])).map(name => (
                                        <div key={name} title={Utils.ifExceeds(name, 23)}>{Utils.truncate(name, 23)}</div>
                                    ))}
                                </td>
                                <td colSpan={nVisibleColumns} style={{padding: 20}}><Bank data={banksById[bankId].data}/></td>
                            </tr>
                        )}
                    </React.Fragment>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default PageRatings;
