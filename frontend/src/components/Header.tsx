import React from 'react';
import "./Header.css"

interface HeaderProps {
    state: string;
}

const Header = (props: HeaderProps) => {
    return (
        <div className='d-flex justify-content-between header-container'>
            <p className="header-item">ほげほげ</p>
            <p className="header-item">{props.state}</p>
        </div>
    );
}


export default Header;