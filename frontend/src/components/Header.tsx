import React from 'react';
import "./Header.css"

interface HeaderProps {
    state: string;
    user_count:number;
    pod_count:number;
}

const Header = (props: HeaderProps) => {
    return (
        <div className='d-flex justify-content-between header-container'>
            <p className="header-item">奇声を発してハッピーハッピー</p>
            <div>
                <p className="header-item">{props.state} / 接続ユーザー数: {props.user_count}人</p>
                {/*<p className="header-item">{`Pod数: ${props.pod_count}`}</p>*/}

            </div>
        </div>
    );
}


export default Header;