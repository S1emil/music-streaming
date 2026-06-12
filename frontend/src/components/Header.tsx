import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiMusic, FiUser, FiLogOut, FiUpload, FiRadio, FiZap, FiBarChart2 } from 'react-icons/fi';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="logo">
          <FiMusic size={24} />
          <span>MusicStream</span>
        </Link>
      </div>

      <div className="header-center">
        <form onSubmit={handleSearch} className="search-form">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Поиск треков, артистов, плейлистов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="header-right">
        {user ? (
          <>
            {(user.role === 'admin' || user.role === 'artist') && (
              <Link to="/upload" className="nav-link upload-link">
                <FiUpload size={16} /> Загрузить
              </Link>
            )}
            <Link to="/library" className="nav-link">Библиотека</Link>
            <Link to="/radio" className="nav-link"><FiRadio size={14} /> Радио</Link>
            <Link to="/generate-playlist" className="nav-link"><FiZap size={14} /> Генератор</Link>
            <Link to="/stats" className="nav-link"><FiBarChart2 size={14} /> Статистика</Link>
            <div className="user-menu">
              <Link to="/profile" className="user-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.displayName} />
                ) : (
                  <div className="avatar-placeholder">
                    <FiUser size={20} />
                  </div>
                )}
              </Link>
              <div className="dropdown">
                <Link to="/profile" className="dropdown-item">Профиль</Link>
                {(user.role === 'admin' || user.role === 'artist') && (
                  <Link to="/admin" className="dropdown-item">
                    {user.role === 'artist' ? 'Панель артиста' : 'Панель админа'}
                  </Link>
                )}
                <button onClick={logout} className="dropdown-item">
                  <FiLogOut size={16} /> Выйти
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline">Войти</Link>
            <Link to="/register" className="btn btn-primary">Регистрация</Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
