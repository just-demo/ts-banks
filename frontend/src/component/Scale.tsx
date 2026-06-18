import {Component} from 'react';
import _ from 'lodash';
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

const scaleButton = {
    margin: 5,
    width: 35,
    height: 35,
    fontSize: 20
};

class Scale extends Component<any, any> {
    min: any;
    max: any;

    constructor(props: any) {
        super(props);
        this.min = _.min(this.props.values);
        this.max = _.max(this.props.values);
        this.state = {
            value: this.props.value
        }
    }

    render() {
        return (
            <div>
                <button style={scaleButton} onClick={this.handleScaleDown}>-</button>
                <FormControl variant="outlined" style={{marginTop: 5}}>
                    <Select value={this.state.value} onChange={this.handleScaleSelect}
                            MenuProps={{PaperProps: {style: {maxHeight: 300}}}}>
                        {_.range(this.min, this.max + 1).map(value => (
                            <MenuItem key={value} value={value}>{value}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <button style={scaleButton} onClick={this.handleScaleUp}>+</button>
            </div>
        );
    }

    handleScaleDown = () => {
        this.setValue(_.max(this.props.values.filter((value: number) => value < this.state.value)) || this.min);
    };

    handleScaleUp = () => {
        this.setValue(_.min(this.props.values.filter((value: number) => value > this.state.value)) || this.max);
    };

    handleScaleSelect = (event: any) => {
        this.setValue(event.target.value);
    };

    setValue(value: any) {
        this.setState({value: value});
        this.props.onChange(value);
    }
}

export default Scale;
