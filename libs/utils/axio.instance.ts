// libs/utils/axio.instance.ts
import axios from 'axios';

const createAPI = (baseURL: string, token?: string) => {
  const AxioInstance = axios.create({
    baseURL: baseURL,
    timeout: 5000,
    headers: {
      'Content-Type': 'application/json',
      'X-Custom-Header': 'My-App-Identifier',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // Request interceptor
  AxioInstance.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor
  AxioInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        console.log('Unauthorized access, redirecting to login...');
      }
      return Promise.reject(error);
    },
  );

  return AxioInstance; // ✅ this was missing
};

export default createAPI;
