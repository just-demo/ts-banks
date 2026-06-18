import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';

function Search(props: any) {
    const {onChange} = props;

    return (
        <Paper sx={{display: 'flex', marginLeft: '10px', marginTop: '3px', width: 180, height: 25}} elevation={0}>
            <InputBase placeholder="Пошук..." onChange={event => onChange(event.target.value)}/>
        </Paper>
    );
}

export default Search;
