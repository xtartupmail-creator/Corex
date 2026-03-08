import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
});

export async function fetchData(path) {
  const { data } = await api.get(path);
  return data;
}

export default api;
