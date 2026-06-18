import {Component} from 'react';
import '../../App.css';
import _ from 'lodash';
import 'bootstrap/dist/css/bootstrap.css'
import Utils from "../Utils";
import ExternalLink from "../ExternalLink";
import ActiveIndicator from "../ActiveIndicator";

class PageBanks extends Component<any, any> {
    sources: any;

    constructor(props: any) {
        super(props);
        this.state = {
            filter: {
                seagreen: true,
                royalblue: true,
                deeppink: true,
                red: true,
                orange: true,
                yellow: true,
                brown: true
            },
            filterActive: false,
            banks: []
        };

        this.sources = [
            {
                type: 'pdf',
                title: 'НБУ PDF',
                href: 'https://bank.gov.ua/control/uk/publish/article?art_id=52047',
                color: 'deeppink',
            },
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

        fetch('/data/banks.json')
            .then(banks => banks.json())
            .then(banks => this.setState({banks: banks}));
    }

    handleFilterChange(color: string) {
        const filter = {...this.state.filter};
        filter[color] = !filter[color];
        this.setState({filter});
    }

    handleFilterActiveChange = (event: any) => {
        this.setState({filterActive: event.target.checked})
    };

    render() {
        const filterNames: any = {
            seagreen: 'Повний збіг',
            royalblue: 'Неоднозначність',
        };
        this.sources.forEach((source: any) => filterNames[source.color] = source.title);
        //TODO: make filter component reusable?
        return (
            <div>
                <div style={{padding: 10}}>
                {Object.keys(this.state.filter).map(color => (
                    <span key={color} style={{backgroundColor: color, marginRight: 5, padding: 5}}>
                        <input
                            type="checkbox"
                            id={'filter-' + color}
                            checked={this.state.filter[color]}
                            onChange={() => this.handleFilterChange(color)}
                        />
                        <label htmlFor={'filter-' + color}>{filterNames[color]}</label>
                    </span>
                ))}
                </div>
                <table className="banks">
                    <tbody>
                    <tr>
                        <th>
                            <input type="checkbox" onChange={this.handleFilterActiveChange} style={{marginTop: 5}}/>
                        </th>
                        <th>Сайт</th>
                        {this.enabledSources().map((source: any) => (
                            <th key={source.type}>
                                <ExternalLink url={source.href} title={source.title}/>
                            </th>
                        ))}
                    </tr>
                    {this.state.banks.filter((bank: any) => !this.state.filterActive || this.allTrue(bank.active)).map((bank: any) => (
                        <tr key={bank.id} style={this.styleForRow(bank)}>
                            {/*TODO: style for active if there is a mismatch*/}
                            <td style={{textAlign: 'center'}}>
                                <ActiveIndicator value={this.allTrue(bank.active)}/>
                            </td>
                            {/*TODO: filter out duplicate sites and show source of each site*/}
                            <td>
                                {_.uniq(_.flatten(Object.values(bank.site) || [])).map((site: any) => (
                                    <p key={site}><ExternalLink url={this.truncateSite(site)} style={{color: 'black'}}/></p>
                                ))}
                            </td>
                            {this.enabledSources().map((source: any) => (
                                <td
                                    key={source.type}
                                    style={this.styleForCell(bank, source)}
                                    title={Utils.ifExceeds(bank.name[source.type], 30)}
                                >
                                {Utils.truncate(bank.name[source.type], 30)}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    }

    truncateSite(site: string) {
        return site.replace(/(?<!:|:\/)\/.*/g, '').replace(/^http(s)?:\/\//, '');
    }

    enabledSources() {
        // TODO: optimize performance
        return this.sources.filter((source: any) => this.state.filter[source.color]);
    }

    allTrue(object: any) {
        return _.every(Object.values(object));
    }

    styleForCell(bank: any, currentSource: any) {
        const enabledSources = this.enabledSources();
        const allNames = enabledSources.length;
        const populatedNames = enabledSources.filter((source: any) => bank.name[source.type]).length;
        return (populatedNames === 1 && bank.name[currentSource.type]) || (populatedNames === allNames - 1 && !bank.name[currentSource.type]) ? {
            backgroundColor: currentSource.color
        } : {};
    }

    styleForRow(bank: any) {
        const enabledSources = this.enabledSources();
        const allNames = enabledSources.length;
        const populatedNames = enabledSources.filter((source: any) => bank.name[source.type]).length;
        const color = populatedNames === allNames || !populatedNames ? 'seagreen' :
            populatedNames === 1 || populatedNames === allNames - 1 ? 'white' : 'royalblue';
        const style: any = {
            backgroundColor: color
        };

        if (color !== 'white' && !this.state.filter[color]) {
            style.display = 'none';
        }

        return style;
    }
}

export default PageBanks;
