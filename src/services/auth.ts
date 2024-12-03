import { ref, get } from 'firebase/database';
import { db } from '../config/firebase';

export interface User {
  id: string;
  email: string;
  password: string;
  clubs: {
    [key: string]: {
      id: string;
      role: string;
    };
  };
}

interface FirebaseUser {
  email: string;
  password: string;
  clubs?: {
    [key: string]: {
      id: string;
      role: string;
    };
  };
}

function isFirebaseUser(data: unknown): data is FirebaseUser {
  const user = data as FirebaseUser;
  return typeof user?.email === 'string' && typeof user?.password === 'string';
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
    
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      throw new Error('Invalid email or password');
    }

    const users = snapshot.val();
    const userEntries = Object.entries(users);
    const userEntry = userEntries.find(([_, data]) => {
      if (!isFirebaseUser(data)) return false;
      return data.email === email && data.password === password;
    });

    if (!userEntry) {
      throw new Error('Invalid email or password');
    }

    const [userId, userData] = userEntry as [string, FirebaseUser];
    return {
      id: userId,
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
  if (!user) return false;

  try {
    await login(user.email, user.password);
    return true;
  } catch {
    clearUserFromStorage();
    return false;
  }
}; 