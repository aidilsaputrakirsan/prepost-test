// client/src/components/Common/NotFound.js
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container">
      <div className="not-found-container" style={{
        textAlign: "center",
        padding: "2rem",
        maxWidth: "500px",
        margin: "0 auto"
      }}>
        <h2>404 - Halaman Tidak Ditemukan</h2>
        <p>Maaf, halaman yang Anda cari tidak ditemukan.</p>
        <div style={{ marginTop: "2rem" }}>
          <Link to="/" className="btn btn-primary">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;