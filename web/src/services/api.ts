import axios from 'axios';
import { User, ApiResponse } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>('/api/users');
    return response.data.data || [];
  },

  createUser: async (name: string, email: string): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/api/users', { name, email });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create user');
    }
    return response.data.data!;
  },

  getUserById: async (id: number): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/api/users/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'User not found');
    }
    return response.data.data!;
  },
};
