import { ref, get } from 'firebase/database';
import { db } from '../config/firebase';

export interface StoredUser {
  id: string;
  password: string;
}

export interface User extends StoredUser {
  email: string;
  firstName: string;
  lastName: string;
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
  firstName: string;
  lastName: string;
  clubs?: {
    [key: string]: {
      id: string;
      role: string;
    };
  };
}

function isFirebaseUser(data: unknown): data is FirebaseUser {
  const user = data as FirebaseUser;
  return (
    typeof user?.email === 'string' && 
    typeof user?.password === 'string' &&
    typeof user?.firstName === 'string' &&
    typeof user?.lastName === 'string'
  );
}

const STORAGE_KEY = 'chiply_user';

export const saveUserToStorage = (user: User) => {
  const storedUser: StoredUser = {
    id: user.id,
    password: user.password
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storedUser));
};

export const getUserFromStorage = (): StoredUser | null => {
  const userData = localStorage.getItem(STORAGE_KEY);
  return userData ? JSON.parse(userData) : null;
};

export const clearUserFromStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getCurrentUser = async (): Promise<User | null> => {
  const storedUser = getUserFromStorage();
  if (!storedUser) return null;

  const usersRef = ref(db, `users/${storedUser.id}`);
  const snapshot = await get(usersRef);
  
  if (!snapshot.exists()) {
    clearUserFromStorage();
    return null;
  }

  const userData = snapshot.val();
  return {
    ...userData,
    id: storedUser.id
  };
};

export const login = async (email: string, password: string): Promise<User> => {
  try {
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
      ...userData
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
  const user = await getCurrentUser();
  return !!user;
}; 