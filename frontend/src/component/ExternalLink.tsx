import type {CSSProperties} from 'react';

interface ExternalLinkProps {
    url: string;
    title?: string;
    style?: CSSProperties;
}

function ExternalLink({url, title, style}: ExternalLinkProps) {
    const host = (url: string) => (url.match(/\/\/([^/]+)/) || [])[1] || url;
    return <a key={url} href={url} target="_blank" rel="noopener noreferrer" style={style}>{title || host(url)}</a>;
}

export default ExternalLink;
