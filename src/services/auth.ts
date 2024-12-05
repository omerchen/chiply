import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { readData, writeData } from './database';

export interface StoredUser {
  id: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  systemRole: 'admin' | 'member';
  clubs: {
    [key: string]: {
      role: "admin" | "member";
    };
  };
  disabledAt: Date | null;
}

interface FirebaseUser {
  firstName: string;
  lastName: string;
  systemRole: 'admin' | 'member';
  clubs?: {
    [key: string]: {
      role: "admin" | "member";
    };
  };
  disabledAt: Date | null;
}

function isFirebaseUser(data: unknown): data is FirebaseUser {
  const user = data as FirebaseUser;
  return (
    typeof user?.firstName === 'string' &&
    typeof user?.lastName === 'string' &&
    (user?.systemRole === 'admin' || user?.systemRole === 'member')
  );
}

const STORAGE_KEY = 'chiply_user';

export const saveUserToStorage = (user: User) => {
  const storedUser: StoredUser = {
    id: user.id
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storedUser));
};

export const getUserFromStorage = (): StoredUser | null => {
  const userData = localStorage.getItem(STORAGE_KEY);
  return userData ? JSON.parse(userData) : null;
};

export const clearUserFromStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
  signOut(auth);
};

export const getCurrentUser = async (): Promise<User | null> => {
  const storedUser = getUserFromStorage();
  if (!storedUser) return null;

  try {
    const userData = await readData(`users/${storedUser.id}`);
    
    if (!userData) {
      clearUserFromStorage();
      return null;
    }

    const authUser = auth.currentUser;
    if (!authUser?.email) {
      clearUserFromStorage();
      return null;
    }

    if (userData.disabledAt) {
      clearUserFromStorage();
      window.location.href = "/login?error=account_disabled";
      return null;
    }

    return {
      ...userData,
      id: storedUser.id,
      email: authUser.email,
      systemRole: userData.systemRole || 'member',
      disabledAt: userData.disabledAt || null,
      clubs: userData.clubs || {}
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    clearUserFromStorage();
    return null;
  }
};

export const login = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const userData = await readData(`users/${uid}`);
    
    if (!userData) {
      throw new Error('User data not found. Please contact an administrator.');
    }

    if (!isFirebaseUser(userData)) {
      throw new Error('Invalid user data format. Please contact an administrator.');
    }

    if (userData.disabledAt) {
      throw new Error('This account has been disabled. Please contact an administrator.');
    }

    const user: User = {
      id: uid,
      email: userCredential.user.email!,
      firstName: userData.firstName,
      lastName: userData.lastName,
      systemRole: userData.systemRole || 'member',
      disabledAt: userData.disabledAt || null,
      clubs: userData.clubs || {}
    };

    saveUserToStorage(user);
    return user;
    
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof Error) {
      if (error.message.includes('auth/invalid-credential')) {
        throw new Error('Invalid email or password');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
};

export const checkAuth = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return !!user;
};

export const createUserData = async (
  uid: string,
  userData: {
    email: string;
    firstName: string;
    lastName: string;
    systemRole?: 'admin' | 'member';
    clubs?: {
      [key: string]: {
        role: "admin" | "member";
      };
    };
  }
) => {
  try {
    await writeData(`users/${uid}`, {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      systemRole: userData.systemRole || 'member',
      clubs: userData.clubs || {}
    });
    return true;
  } catch (error) {
    console.error('Error creating user data:', error);
    throw error;
  }
}; 