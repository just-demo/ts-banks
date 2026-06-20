import {Component} from 'react';
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

interface ScaleState {
    value: number;
}

class Scale extends Component<ScaleProps, ScaleState> {
    min: number;
    max: number;

    constructor(props: ScaleProps) {
        super(props);
        this.min = _.min(this.props.values) ?? 0;
        this.max = _.max(this.props.values) ?? 0;
        this.state = {
            value: this.props.value
        }
    }

    render() {
        return (
            <div>
                <button style={styleScaleButton} onClick={this.handleScaleDown}>-</button>
                <FormControl variant="outlined" style={{marginTop: 5}}>
                    <Select value={this.state.value} onChange={this.handleScaleSelect}
                            MenuProps={{PaperProps: {style: {maxHeight: 300}}}}>
                        {_.range(this.min, this.max + 1).map(value => (
                            <MenuItem key={value} value={value}>{value}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <button style={styleScaleButton} onClick={this.handleScaleUp}>+</button>
            </div>
        );
    }

    handleScaleDown = () => {
        this.setValue(_.max(this.props.values.filter(value => value < this.state.value)) || this.min);
    };

    handleScaleUp = () => {
        this.setValue(_.min(this.props.values.filter(value => value > this.state.value)) || this.max);
    };

    handleScaleSelect = (event: SelectChangeEvent<number>) => {
        this.setValue(Number(event.target.value));
    };

    setValue(value: number) {
        this.setState({value: value});
        this.props.onChange(value);
    }
}

export default Scale;
