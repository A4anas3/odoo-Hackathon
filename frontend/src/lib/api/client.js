import axios from 'axios';
import { API_BASE_URL, AUTH_API_BASE_URL } from '../../config/api';
import { attachInterceptors } from './interceptors';

/**
 * Main Centralized API Client for HRMS backend.
 * ALL feature APIs must use this client.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

/**
 * Dedicated Client for peoplePay Auth Microservice.
 */
export const authClient = axios.create({
  baseURL: AUTH_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

// Attach standard request & response interceptors
attachInterceptors(apiClient);
attachInterceptors(authClient);
