// client/src/App.js - versi minimal untuk testing
import React from 'react';
import './styles.css';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="container header-container">
          <div className="logo">
            <h1>PrePostTEST</h1>
          </div>
        </div>
      </header>
      
      <main className="main-content">
        <div className="container">
          <div className="home-container">
            <h2>Selamat Datang di PrePostTEST</h2>
            <p>Aplikasi quiz untuk pretest dan posttest</p>
            
            <div style={{ marginTop: '2rem' }}>
              <button className="btn btn-primary">
                Mulai Quiz
              </button>
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              <a href="/admin" className="btn btn-secondary">
                Login Admin
              </a>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="app-footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} PrePostTEST. Dibuat oleh Aidil Saputra Kirsan</p>
        </div>
      </footer>
    </div>
  );
}

export default App;