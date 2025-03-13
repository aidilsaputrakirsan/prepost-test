// client/src/components/Common/Footer.js
import React from 'react';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} PrePostTEST. Dibuat oleh Aidil Saputra Kirsan</p>
      </div>
    </footer>
  );
};

export default Footer;