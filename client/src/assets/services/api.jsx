import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

// if you still store a token in localStorage for some flows, keep a fallback
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Save development fallback token returned by the server (when cookies fail in dev)
API.interceptors.response.use(
  (response) => {
    const token = response?.data?.token;
    if (token) {
      try {
        localStorage.setItem('token', token);
      } catch (e) {
        // ignore storage errors
      }
    }
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      try {
        localStorage.removeItem('token');
      } catch (e) {
        // ignore
      }
    }
    return Promise.reject(error);
  }
);

export default API;
