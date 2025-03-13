// client/src/components/Common/Header.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const Header = () => {
  const { currentUser, logout } = useContext(AuthContext);

  return (
    <header className="app-header">
      <div className="container header-container">
        <div className="logo">
          <Link to="/">
            <h1>PrePostTEST</h1>
          </Link>
        </div>
        
        {currentUser && (
          <div className="user-info">
            <span>Hai, {currentUser.name}</span>
            {currentUser.isAdmin && (
              <Link to="/admin/panel" className="admin-link">
                Panel Admin
              </Link>
            )}
            <button
              onClick={logout}
              className="btn btn-sm btn-secondary"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;