import {useEffect, useState} from 'react';
import {Line} from 'react-chartjs-2';
import {Chart, type ChartData, type ChartDataset, registerables} from 'chart.js';
import rcolor from 'rcolor';
import _ from "lodash";
import FormControl from "@mui/material/FormControl";
import Select, {type SelectChangeEvent} from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import type {Bank, Ratings} from "../../model";

Chart.register(...registerables);

function getMostRelevantBankName(bank: Bank) {
    // Even thought banks names were sorted in such a way that most relevant go first there are cases when non-relevant name groups go first and mess up final result
    const nameCounts = _.countBy(_.flatten([bank.names.api, bank.names.nbu, bank.names.fund].filter(_.identity) as string[][]), _.identity);
    return _.maxBy(Object.keys(nameCounts), name => nameCounts[name]) || bank.name.minfin;
}

function topBy<T>(array: T[], number: number, iteratee: (item: T) => string) {
    if (!number || array.length <= number) {
        return array;
    }

    array = _.sortBy(array, iteratee).reverse();
    // Can't simply use slice because multiple equal values may fall into top and thereby exceed requested number
    const top: T[] = [];
    for (let i = 0; i < array.length && (top.length < number || iteratee(_.last(top)!) <= iteratee(array[i])); i++) {
        top.push(array[i]);
    }

    return top;
}

function PageCharts() {
    const [top, setTop] = useState(3);
    const [lastOnly, setLastOnly] = useState(true);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [ratings, setRatings] = useState<Ratings>({});

    useEffect(() => {
        fetch('/data/banks.json')
            .then(banks => banks.json())
            .then(banks => setBanks(banks));

        fetch('/data/minfin-ratings.json')
            .then(ratings => ratings.json())
            .then(ratings => setRatings(ratings));
    }, []);

    const dates = Object.keys(ratings).sort();
    const nameById: Record<string, string | undefined> = {};
    banks
        .filter(bank => bank.internal.id.minfin)
        .forEach(bank => nameById[bank.internal.id.minfin!] = getMostRelevantBankName(bank));

    const topSearchScope = lastOnly && dates.length ? [ratings[_.last(dates)!]] : Object.values(ratings);
    const topIds = _.uniq(_.flatten(
        topSearchScope.map(dateRatings => topBy(Object.keys(dateRatings), top, id => dateRatings[id]))
    ));

    const datasets: ChartDataset<'line'>[] = topIds.map(id => {
        const color = rcolor();
        return {
            label: nameById[id],
            data: dates.map(date => ratings[date][id]) as unknown as number[],
            fill: false,
            tension: 0.1,
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            backgroundColor: color,
            borderColor: color,
            pointBorderColor: color,
            pointBackgroundColor: color,
            pointHoverBackgroundColor: color,
            pointHoverBorderColor: color
        };
    });
    const data: ChartData<'line'> = {
        labels: dates,
        datasets
    };

    return (
        <div>
            <div>
                <FormControl variant="outlined" style={{margin: 5}}>
                    <Select value={top} onChange={(event: SelectChangeEvent<number>) => setTop(Number(event.target.value))}>
                        {_.range(0, 11).map(value => (
                            <MenuItem key={value} value={value}>{value ? 'Топ-' + value : 'Всі'}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl variant="outlined" style={{margin: 5}}>
                    <Select value={lastOnly}
                            onChange={(event: SelectChangeEvent<boolean>) => setLastOnly(Boolean(event.target.value))}>
                        {[true, false].map(value => (
                            <MenuItem key={String(value)} value={value as unknown as number}>{value ? 'за останніми показниками' : 'за весь період'}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </div>
            <Line data={data}/>
        </div>
    );
}

export default PageCharts;
