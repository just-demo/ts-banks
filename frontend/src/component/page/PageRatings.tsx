import React, {Component} from 'react';
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

class PageRatings extends Component<any, any> {
    dates: any;
    banks: any;

    constructor(props: any) {
        super(props);
        this.state = {
            scale: 1,
            bankSelected: null,
            banks: [],
            ratings: {}
        };
    }

    componentDidMount() {
        fetch('/data/banks.json')
            .then(banks => banks.json())
            .then(banks => this.setState({banks: banks}));


        fetch('/data/minfin-ratings.json')
            .then(ratings => ratings.json())
            .then(ratings => this.setState({ratings: ratings}));
    }

    getMostRelevantBankName(bank: any) {
        // Even thought banks names were sorted in such a way that most relevant go first there are cases when non-relevant name groups go first and mess up final result
        const nameCounts = _.countBy(_.flatten([bank.names.api, bank.names.nbu, bank.names.fund].filter(_.identity)), _.identity);
        return _.maxBy(Object.keys(nameCounts), name => nameCounts[name]) || bank.name.minfin
    }

    applyFilter(bank: any) {
        if (this.state.filterActive && !bank.active) {
            return false;
        }
        const term = (this.state.search || '').toUpperCase();
        const hasTerm = (array: any) => array.some((item: any) => item.toUpperCase().includes(term));
        return !term || hasTerm(Object.values(bank.name)) || Object.values(bank.data.names).some(names => hasTerm(names));
    }

    render() {
        const start = Date.now();
        this.dates = Object.keys(this.state.ratings).sort().reverse();
        this.banks = _.keyBy(this.state.banks.map((bank: any) => {
            const datesIssue = Object.values(bank.dateIssue);
            return {
                id: bank.internal.id.minfin,
                name: this.getMostRelevantBankName(bank),
                // site: (bank.site.minfin || [])[0],
                // link: bank.internal.link.minfin,
                dateOpen: this.projectDate(bank.dateOpen.api),
                dateClosed: this.projectDate(bank.dateIssue.pdf),
                dateIssueMin: this.projectDate(_.min(datesIssue)),
                dateIssueMax: this.projectDate(_.max(datesIssue)),
                active: _.every(Object.values(bank.active)),
                data: bank
            }})
            .filter((bank: any) => bank.name)
            .filter((bank: any) => this.applyFilter(bank)), 'id');

        // Sort by latest rating in reverse order
        const bankIds = Object.keys(this.banks).sort((bankId1, bankId2) => {
            for (const date of this.dates) {
                const dateRating = this.state.ratings[date];
                const diff = this.compare(dateRating[bankId1], dateRating[bankId2]);
                if (diff) {
                    return diff;
                }
            }

            return this.compareBy(this.banks[bankId1], this.banks[bankId2], {
                dateIssueMin: true,
                dateIssueMax: true,
                dateOpen: false,
                dateClosed: true
            });
        }).reverse();

        const datesByYear = _.groupBy(this.dates, (date: string) => date.split('-')[0]);
        const r = (
            <div>
                <div style={{display: 'flex', justifyContent: 'center', padding: 5}}>
                        <Scale value={this.state.scale} values={[1, 2, 5, 10, 100]}
                               onChange={(scale: number) => this.setState({scale: scale})}/>
                </div>
                <table className="ratings">
                    <tbody>
                    <tr>
                        <th rowSpan={2}>
                            <input type="checkbox" onChange={event => this.setState({filterActive: event.target.checked})} style={{
                                marginTop: 5
                            }}/>
                        </th>
                        <th style={{minWidth: 215}} rowSpan={2}>
                            <Search onChange={(search: string) => this.setState({search: search})}/>
                        </th>
                        {Object.keys(datesByYear).sort().reverse().map(year => (
                            <th key={year} colSpan={datesByYear[year].length}>{year}</th>
                        ))}
                    </tr>
                    <tr>
                        {this.dates.map((date: string) => (
                            <th key={date}><ExternalLink url={this.getRatingSourceLink(date)} title={this.formatDayMonth(date)}/></th>
                        ))}
                    </tr>
                    {bankIds.map(bankId => (
                        <React.Fragment key={bankId}>
                            <tr onClick={() => this.handleBankSelected(bankId)}>
                                <td style={{textAlign: 'center'}}><ActiveIndicator value={this.banks[bankId].active}/></td>
                                <td style={{paddingLeft: 3}} title={Utils.ifExceeds(this.banks[bankId].name, 30)}><a
                                    href={this.banks[bankId].link}>{Utils.truncate(this.banks[bankId].name, 30)}</a></td>
                                {this.dates.map((date: string) => (
                                    <td key={date} className={this.classForCell(this.banks[bankId], date)}
                                        style={this.styleForCell(this.state.ratings[date][bankId])}>
                                        <div>
                                            {this.state.ratings[date][bankId] || '-'}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                            {bankId === this.state.bankSelected && (
                                <tr className="details">
                                    <td>&nbsp;</td>
                                    <td style={{paddingLeft: 20}}>
                                        {_.uniq(_.flatten(Object.values(this.banks[bankId].data.names))).map((name: any) => (
                                            <div key={name} title={Utils.ifExceeds(name, 23)}>{Utils.truncate(name, 23)}</div>
                                        ))}
                                    </td>
                                    <td colSpan={this.dates.length} style={{padding: 20}}><Bank data={this.banks[bankId].data}/></td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                    </tbody>
                </table>
            </div>
        );

        console.log('Rendering time:', Date.now() - start);

        return r;
    }

    getRatingSourceLink(date: string) {
        return 'https://minfin.com.ua/ua/banks/rating/?date=' + date;
    }

    formatDayMonth(date: any) {
        date = new Date(date);
        return _.padStart('' + date.getDate(), 2, '0') + '.' + _.padStart('' + (date.getMonth() + 1), 2,'0');
    }

    handleBankSelected(bankId: string) {
        this.setState({bankSelected: this.state.bankSelected === bankId ? null : bankId});
    }

    compare(a: any, b: any) {
        return _.isUndefined(a) ?
            _.isUndefined(b) ? 0 : -1 :
            _.isUndefined(b) ? 1 :
                a > b ? 1 : a < b ? -1 : 0;
    }

    compareBy(obj1: any, obj2: any, fields: any) {
        for (const field of  Object.keys(fields)) {
            const diff = this.compare(obj1[field], obj2[field]);
            if (diff) {
                return fields[field] ? diff : -diff;
            }
        }
        return 0;
    }

    projectDate(date: any) {
        if (!date) {
            return date;
        }
        let projected = date;
        for (const d of this.dates) {
            if (d < date) {
                return projected;
            }
            projected = d;
        }
        return projected;
    }

    classForCell(bank: any, date: string) {
        return classNames({
            'rating': true,
            'issue': bank.dateIssueMax >= date && date >= bank.dateIssueMin,
            'issue-max': bank.dateIssueMax === date,
            'issue-min': bank.dateIssueMin === date,
            'closed': (bank.dateClosed && date > bank.dateIssueMax) || (bank.dateOpen && date < bank.dateOpen),
            'open': bank.dateOpen && bank.dateOpen === date
        });
    }

    styleForCell(rating: any) {
        if (!rating) {
            return {};
        }

        const max = 5;    // green  - rgb(  0, 128, 0)
        const middle = 3; // yellow - rgb(255, 255, 0)
        const min = 1;    // red    - rgb(255,   0, 0)
        const scale = this.state.scale;
        rating = Math.max(min, Math.min(max, rating)); // truncate
        rating = Math.floor(rating * scale) / scale; // resolution
        const red = rating <= middle ? 255 : this.scale(rating, middle, 255, max, 0);
        const green = rating >= middle ? this.scale(rating, middle, 255, max, 128) : this.scale(rating, min, 0, middle, 255);
        const blue = 0;
        return {backgroundColor: `rgb(${red}, ${green}, ${blue})`};
    }

    scale(key: number, minKey: number, minValue: number, maxKey: number, maxValue: number) {
        return Math.round(minValue + (maxValue - minValue) * (key - minKey) / (maxKey - minKey));
    }
}

export default PageRatings;
