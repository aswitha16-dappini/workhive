import axios from 'axios';

// Resolve API base URL: Uses production VITE_API_URL on Vercel, or falls back to /api (Vite dev proxy)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('workhive_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (
        window.location.pathname.startsWith('/dashboard') ||
        window.location.pathname.startsWith('/post-project') ||
        window.location.pathname.startsWith('/profile')
      ) {
        localStorage.removeItem('workhive_token');
        localStorage.removeItem('workhive_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  getClientData: () => api.get('/auth/client-only'),
  getFreelancerData: () => api.get('/auth/freelancer-only'),
  getHealth: () => api.get('/health'),
};

// Freelancer Profile Services
export const profileService = {
  getAll: (params) => api.get('/profiles', { params }),
  getMyProfile: () => api.get('/profiles/me'),
  getById: (id) => api.get(`/profiles/${id}`),
  create: (profileData) => api.post('/profiles', profileData),
  update: (profileData) => api.put('/profiles/me', profileData),
  upsert: (profileData) => api.post('/profiles', profileData),
};

// Project / Job Posting Services
export const projectService = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  getMyClientProjects: () => api.get('/projects/my/client'),
  create: (projectData) => api.post('/projects', projectData),
  update: (id, projectData) => api.put(`/projects/${id}`, projectData),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Module 3: Proposal Submission & Bidding Services
export const proposalService = {
  submit: (proposalData) => api.post('/proposals', proposalData),
  getByProject: (projectId) => api.get(`/proposals/project/${projectId}`),
  getMyProposals: () => api.get('/proposals/my'),
  getClientProposals: () => api.get('/proposals/client'),
  accept: (proposalId) => api.patch(`/proposals/${proposalId}/accept`),
  reject: (proposalId) => api.patch(`/proposals/${proposalId}/reject`),
};

// Module 3: Escrow & Milestone Services
export const milestoneService = {
  getByProject: (projectId) => api.get(`/milestones/project/${projectId}`),
  create: (milestoneData) => api.post('/milestones', milestoneData),
  fund: (milestoneId) => api.patch(`/milestones/${milestoneId}/fund`),
  submitWork: (milestoneId, data) => api.patch(`/milestones/${milestoneId}/submit`, data),
  approve: (milestoneId) => api.patch(`/milestones/${milestoneId}/approve`),
  getMyMilestones: () => api.get('/milestones/my'),
  getClientMilestones: () => api.get('/milestones/client'),
};

// Platform Statistics Services (Live MongoDB Counts)
export const statsService = {
  getStats: () => api.get('/stats'),
};

// Client Profile Services
export const clientProfileService = {
  getMyProfile: () => api.get('/client-profile/me'),
  updateProfile: (profileData) => api.put('/client-profile/me', profileData),
  getById: (id) => api.get(`/client-profile/${id}`),
};

export default api;
