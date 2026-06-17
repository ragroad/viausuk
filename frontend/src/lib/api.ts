import axios from 'axios';
import { useAuthStore } from '../store';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token from Clerk on every request
api.interceptors.request.use(async (config) => {
  const { getToken } = useAuthStore.getState();
  const token = await getToken?.();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Request failed';
    if (err.response?.status === 401) {
      window.location.href = '/auth/sign-in';
    }
    return Promise.reject(new Error(msg));
  }
);

// ── Typed API helpers ─────────────────────────────────────────

export const inspectionsApi = {
  list:   (params?: Record<string,string>) => api.get('/inspections', { params }),
  get:    (id: string)   => api.get(`/inspections/${id}`),
  create: (data: any)    => api.post('/inspections', data),
  update: (id: string, data: any) => api.patch(`/inspections/${id}`, data),
  delete: (id: string)   => api.delete(`/inspections/${id}`),
};

export const casesApi = {
  list:   (params?: Record<string,string>) => api.get('/cases', { params }),
  get:    (id: string)   => api.get(`/cases/${id}`),
  create: (data: any)    => api.post('/cases', data),
  update: (id: string, data: any) => api.patch(`/cases/${id}`, data),
};

export const vinApi = {
  decode: (vin: string)  => api.get(`/vin/${vin}`),
  plate:  (plate: string)=> api.post('/vin/plate', { plate }),
};

export const documentsApi = {
  getUploadUrl: (data: any)   => api.post('/documents/upload-url', data),
  process:      (id: string, ocrText: string) => api.post(`/documents/${id}/process`, { ocrText }),
  get:          (id: string)  => api.get(`/documents/${id}`),
};

export const photosApi = {
  getUploadUrl: (data: any)   => api.post('/photos/upload-url', data),
  analyse:      (id: string)  => api.post(`/photos/${id}/analyse`),
  listByInspection: (inspId: string) => api.get(`/photos/inspection/${inspId}`),
};

export const billingApi = {
  overview:  ()           => api.get('/billing/overview'),
  checkout:  (priceId: string) => api.post('/billing/checkout', { priceId }),
  portal:    ()           => api.post('/billing/portal'),
};

export const teamApi = {
  list:    ()             => api.get('/team'),
  invite:  (data: any)    => api.post('/team/invite', data),
  update:  (id: string, data: any) => api.patch(`/team/${id}`, data),
  remove:  (id: string)   => api.delete(`/team/${id}`),
};

export const integrationsApi = {
  status: ()  => api.get('/integrations/status'),
};

export const authApi = {
  sync: (data: any)  => api.post('/auth/sync', data),
  me:   ()           => api.get('/auth/me'),
};
