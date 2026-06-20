import './Bank.css';
import _ from 'lodash';
import classNames from 'classnames';
import ExternalLink from "./ExternalLink";
import type {Bank as BankData, SourceKey} from "../model";

// TODO: share link with code that fetches data
// TODO: show status like Реорганізація and so on
const source: Record<SourceKey, {name: string; link: (link?: string) => string}> = {
    nbu: {
        name: 'НБУ',
        link: link => 'https://bank.gov.ua' + (link || '')
    },
    api: {
        name: 'НБУ API',
        link: () => 'https://bank.gov.ua/NBU_BankInfo/get_data_branch?typ=0'
    },
    fund: {
        name: 'ФГВФО',
        link: link => 'http://www.fg.gov.ua' + (link || '/uchasnyky-fondu')
    },
    minfin: {
        name: 'Міфін',
        link: link => 'https://minfin.com.ua' + (link || '')
    }
};

interface BankProps {
    data: BankData;
}

function buildLinks(urls?: string[]) {
    const links = urls && urls
        .filter(url => url)
        .map(url => <ExternalLink key={url} url={url}/>)
        .map((link, index) => index > 0 ? [<br key={index}/>, link] : link);
    return _.isEmpty(links) ? null : links;
}

function Bank({data: bank}: BankProps) {
    return (
        <table className="bank">
            <tbody>
            <tr>
                <td>Джерело</td>
                <td>Початок</td>
                <td>Подія</td>
                <td>Сайт</td>
            </tr>
            {(Object.keys(source) as SourceKey[]).map(type => (
                <tr key={type}>
                    <td><ExternalLink url={source[type].link(bank.internal.link[type])} title={source[type].name}/></td>
                    <td>{bank.dateOpen[type] || '-'}</td>
                    <td>{bank.dateIssue[type] || '-'}</td>
                    <td className={classNames({site: !_.isEmpty(bank.site[type])})}>{buildLinks(bank.site[type]) || '-'}</td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}

export default Bank;
