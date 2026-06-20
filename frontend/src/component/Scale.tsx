import {useMemo, useState} from 'react';
import _ from 'lodash';
import FormControl from "@mui/material/FormControl";
import Select, {type SelectChangeEvent} from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

const styleScaleButton = {
    margin: 5,
    width: 35,
    height: 35,
    fontSize: 20
};

interface ScaleProps {
    value: number;
    values: number[];
    onChange: (value: number) => void;
}

function Scale({value, values, onChange}: ScaleProps) {
    const [current, setCurrent] = useState(value);
    const min = useMemo(() => _.min(values) ?? 0, [values]);
    const max = useMemo(() => _.max(values) ?? 0, [values]);

    const setValue = (next: number) => {
        setCurrent(next);
        onChange(next);
    };

    const handleScaleDown = () => {
        setValue(_.max(values.filter(value => value < current)) || min);
    };

    const handleScaleUp = () => {
        setValue(_.min(values.filter(value => value > current)) || max);
    };

    const handleScaleSelect = (event: SelectChangeEvent<number>) => {
        setValue(Number(event.target.value));
    };

    return (
        <div>
            <button style={styleScaleButton} onClick={handleScaleDown}>-</button>
            <FormControl variant="outlined" style={{marginTop: 5}}>
                <Select value={current} onChange={handleScaleSelect}
                        MenuProps={{PaperProps: {style: {maxHeight: 300}}}}>
                    {_.range(min, max + 1).map(value => (
                        <MenuItem key={value} value={value}>{value}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <button style={styleScaleButton} onClick={handleScaleUp}>+</button>
        </div>
    );
}

export default Scale;
