import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5001', // local
  //baseURL: 'http://3.26.96.188:5001', // live
  headers: { 'Content-Type': 'application/json' },
});

// Automoatically attach the JWT token to every request if it exists in localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user.token) {
          config.headers['Authorization'] = `Bearer ${user.token}`;
        }
      } catch (error) {
        localStorage.removeItem('user'); // Remove invalid JSON from localStorage
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
