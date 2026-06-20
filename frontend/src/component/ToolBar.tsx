import {type ReactNode, useState} from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import {Link, Routes, Route, Navigate, useLocation} from 'react-router-dom';
import PageRatings from "./page/PageRatings";
import PageBanks from "./page/PageBanks";
import PageLogs from "./page/PageLogs";
import UserMenu from "./UserMenu";
import PageRefresh from "./page/PageRefresh";
import classNames from 'classnames';
import _ from 'lodash';
import Disclaimer from "./Disclaimer";
import PageCharts from "./page/PageCharts";
import ExternalLink from "./ExternalLink";
import Grid from '@mui/icons-material/Apps';
import Chart from '@mui/icons-material/EqualizerSharp';
import Bank from '@mui/icons-material/AccountBalance';
import Log from '@mui/icons-material/LibraryBooks';
import Refresh from '@mui/icons-material/Sync';
import './ToolBar.css';

interface NavLink {
    path: string;
    title: string;
    access: number;
    icon: ReactNode;
}

const links: NavLink[] = [{
    path: '/',
    title: 'Таблиця',
    access: 0,
    icon: <Grid/>
}, {
    path: '/chart',
    title: 'Графік',
    access: 0,
    icon: <Chart style={{marginTop: -2}}/>
}, {
    path: '/banks',
    title: 'Банки',
    access: 1,
    icon: <Bank style={{transform: 'scale(0.9)'}}/>
}, {
    path: '/refresh',
    title: 'Оновлення',
    access: 1,
    icon: <Refresh style={{transform: 'scale(0.9)'}}/>
}, {
    path: '/logs',
    title: 'Логи',
    access: 1,
    icon: <Log style={{marginRight: 3}}/>
}];

function getPageAccess(path: string) {
    const link = _.find(links, link => link.path === path);
    return link ? link.access : 0;
}

function ToolBar() {
    const [access, setAccess] = useState(0);
    const selectedPath = useLocation().pathname;
    const redirect = getPageAccess(selectedPath) > access;

    return (
        <div style={{flexGrow: 1}}>
            <AppBar position="static">
                <Toolbar>
                    {links.filter(link => link.access <= access).map(link => (
                        <Link key={link.path} to={link.path} style={{color: 'white'}}
                              className={classNames('router-link', {
                                  'router-link-active': link.path === selectedPath
                              })}><Button style={{
                            color: 'white',
                            paddingRight: 10
                        }}>{link.icon}{link.title}</Button></Link>
                    ))}
                    <Typography color="inherit" style={{
                        flexGrow: 1,
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        color: 'skyblue'
                    }}>
                        Рейтинг банків України за версією сайту <ExternalLink
                        url="https://minfin.com.ua/ua/banks/rating" title="Мінфін" style={{color: 'skyblue'}}/>
                    </Typography>
                    <UserMenu selected={access} onSelect={setAccess}/>
                </Toolbar>
            </AppBar>
            <Disclaimer/>
            {redirect ? <Navigate to="/" replace/> : (
                <Routes>
                    <Route path="/" element={<PageRatings/>}/>
                    <Route path="/chart" element={<PageCharts/>}/>
                    <Route path="/banks" element={<PageBanks/>}/>
                    <Route path="/refresh" element={<PageRefresh/>}/>
                    <Route path="/logs" element={<PageLogs/>}/>
                </Routes>
            )}
        </div>
    );
}

export default ToolBar;
