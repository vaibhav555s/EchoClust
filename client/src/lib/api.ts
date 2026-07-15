import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
});

export const uploadBatch = async (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const runClustering = async (batchId: string, k: number) => {
  const res = await api.post(`/cluster/${batchId}`, { k });
  return res.data;
};

export const getRuns = async () => {
  const res = await api.get('/runs');
  return res.data.runs;
};

export const getRun = async (id: string) => {
  const res = await api.get(`/runs/${id}`);
  return res.data.run;
};
