import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiUser, FiMusic } from 'react-icons/fi';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: 'user' as 'user' | 'artist',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (role: 'user' | 'artist') => {
    setFormData({ ...formData, role });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    setLoading(true);

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        role: formData.role,
      });
      toast.success('Аккаунт создан!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Создать аккаунт</h1>
        <p>Присоединяйтесь к Wavve</p>

        <form onSubmit={handleSubmit}>
          <div className="role-selector">
            <label className="role-option">
              <input
                type="radio"
                name="role"
                value="user"
                checked={formData.role === 'user'}
                onChange={() => handleRoleChange('user')}
              />
              <div className={`role-card ${formData.role === 'user' ? 'active' : ''}`}>
                <FiUser size={24} />
                <span className="role-title">Слушатель</span>
                <span className="role-desc">Слушайте музыку, создавайте плейлисты</span>
              </div>
            </label>
            <label className="role-option">
              <input
                type="radio"
                name="role"
                value="artist"
                checked={formData.role === 'artist'}
                onChange={() => handleRoleChange('artist')}
              />
              <div className={`role-card ${formData.role === 'artist' ? 'active' : ''}`}>
                <FiMusic size={24} />
                <span className="role-title">Артист</span>
                <span className="role-desc">Загружайте треки, управляйте музыкой</span>
              </div>
            </label>
          </div>

          <div className="form-group">
            <label>Отображаемое имя</label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Как вас видят другие"
              required
            />
          </div>

          <div className="form-group">
            <label>Имя пользователя</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Уникальное имя"
              required
              minLength={3}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Минимум 6 символов"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label>Подтвердите пароль</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Повторите пароль"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Создание...' : 'Создать аккаунт'}
          </button>
        </form>

        <p className="auth-link">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
