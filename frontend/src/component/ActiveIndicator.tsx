import Done from '@mui/icons-material/Done';
import Clear from '@mui/icons-material/Clear';

interface ActiveIndicatorProps {
    value?: boolean;
}

function ActiveIndicator({value}: ActiveIndicatorProps) {
    return value ? <Done style={{color: 'green', fontSize: 16}}/> : <Clear style={{color: 'red', fontSize: 16}}/>;
}

export default ActiveIndicator;
