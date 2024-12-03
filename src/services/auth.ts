import { ref, get } from 'firebase/database';
import { db } from '../config/firebase';

export interface User {
  email: string;
  password: string;
  clubs: {
    [key: string]: {
      id: string;
      role: string;
    };
  };
}

const STORAGE_KEY = 'chiply_user';

export const saveUserToStorage = (user: User) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

export const getUserFromStorage = (): User | null => {
  const userData = localStorage.getItem(STORAGE_KEY);
  return userData ? JSON.parse(userData) : null;
};

export const clearUserFromStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const login = async (email: string, password: string): Promise<User> => {
  try {
    console.log('Starting login process...');
    
    // Get the test user reference directly
    const userRef = ref(db, 'users/TESTUSER');
    console.log('Fetching test user from database...');
    
    const snapshot = await get(userRef);
    console.log('Database response received');
    
    if (!snapshot.exists()) {
      console.error('Test user not found in database');
      throw new Error('Invalid email or password');
    }

    const userData = snapshot.val();
    console.log('Found user data, verifying credentials...');
    
    // Verify credentials
    if (userData.email !== email || userData.password !== password) {
      console.error('Invalid credentials');
      throw new Error('Invalid email or password');
    }

    console.log('Login successful for user:', email);

    // Return user data
    return {
      id: 'TESTUSER',
      email: userData.email,
      password: userData.password,
      clubs: userData.clubs || {}
    };
    
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
};

export const checkAuth = async (): Promise<boolean> => {
  const user = getUserFromStorage();
  if (!user) {
    console.log('No user found in storage');
    return false;
  }

  try {
    console.log('Verifying stored credentials for:', user.email);
    await login(user.email, user.password);
    console.log('Stored credentials verified successfully');
    return true;
  } catch (error) {
    console.error('Auth check error:', error);
    clearUserFromStorage();
    return false;
  }
}; 