// src/api/axiosClient.js – SIÊU GỌN, KHÔNG CẦN TOKEN
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true  // Quan trọng: gửi cookie session
});

export default axiosClient;