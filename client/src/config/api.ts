const base = import.meta.env.VITE_API_BASE_URL || '/api';
export const API_BASE_URL = base.endsWith('/') ? base.slice(0, -1) : base;

