import {useState} from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Person from '@mui/icons-material/Person';

function UserMenu(props: any) {
    const [anchorEl, setAnchorEl] = useState<any>(null);
    const [userSelected, setUserSelected] = useState(props.selected);
    const users = ['Користувач', 'Розробник'];

    function handleClick(event: any) {
        setAnchorEl(event.currentTarget);
    }

    function handleClose() {
        setAnchorEl(null);
    }

    function handleSelect(index: number) {
        setUserSelected(index);
        handleClose();
        props.onSelect(index);
    }

    return (
        <div>
            <Button
                color="inherit"
                aria-owns={anchorEl ? 'simple-menu' : undefined}
                aria-haspopup="true"
                onClick={handleClick}
            >
                <Person style={{marginTop: -3}}/>{users[userSelected]}
            </Button>
            <Menu id="simple-menu" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                {users.map((user, index) => (
                    <MenuItem key={index} onClick={() => handleSelect(index)} style={{
                        fontSize: 14,
                        textTransform: 'uppercase'
                    }}>{user}</MenuItem>
                ))}
            </Menu>
        </div>
    );
}

export default UserMenu;
