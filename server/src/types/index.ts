export interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
