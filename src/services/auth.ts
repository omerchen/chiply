import { signInWithEmailAndPassword, signOut, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, createUserWithEmailAndPassword, fetchSignInMethodsForEmail, updatePassword } from 'firebase/auth';
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
  disabledAt: number | null;
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

export const sendLoginLink = async (email: string): Promise<void> => {
  const actionCodeSettings = {
    url: window.location.origin + '/login',
    handleCodeInApp: true
  };

  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    // Save the email locally to complete sign in after user clicks the link
    localStorage.setItem('emailForSignIn', email);
  } catch (error) {
    console.error('Error sending login link:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
};

export const completeLoginWithEmailLink = async (): Promise<User | null> => {
  if (!isSignInWithEmailLink(auth, window.location.href)) {
    return null;
  }

  let email = localStorage.getItem('emailForSignIn');
  if (!email) {
    // If email is not found, return null - the UI will handle asking the user for their email
    return null;
  }

  try {
    const userCredential = await signInWithEmailLink(auth, email, window.location.href);
    localStorage.removeItem('emailForSignIn'); // Clean up email from storage
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
    console.error('Error completing email link sign in:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
};

interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0;
  } catch (error) {
    console.error('Error checking email:', error);
    throw error;
  }
};

export const sendSignUpLink = async (data: SignUpData): Promise<void> => {
  const actionCodeSettings = {
    url: window.location.origin + '/signup/verify',
    handleCodeInApp: true
  };

  try {
    // Check if email already exists
    const exists = await checkEmailExists(data.email);
    if (exists) {
      throw new Error('An account with this email already exists');
    }

    await sendSignInLinkToEmail(auth, data.email, actionCodeSettings);
    // Save the registration data locally to complete sign up after verification
    localStorage.setItem('signUpData', JSON.stringify(data));
  } catch (error) {
    console.error('Error sending verification link:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
};

export const completeSignUpWithEmailLink = async (): Promise<User> => {
  if (!isSignInWithEmailLink(auth, window.location.href)) {
    throw new Error('Invalid verification link');
  }

  const signUpDataStr = localStorage.getItem('signUpData');
  if (!signUpDataStr) {
    throw new Error('Registration data not found. Please try signing up again.');
  }

  const signUpData: SignUpData = JSON.parse(signUpDataStr);

  try {
    // First verify the email using the link
    const userCredential = await signInWithEmailLink(auth, signUpData.email, window.location.href);
    
    // After successful email verification, update the user's password
    if (userCredential.user) {
      await updatePassword(userCredential.user, signUpData.password);
    }

    // Create the user data in the database if it doesn't exist
    const existingData = await readData(`users/${userCredential.user.uid}`);
    if (!existingData) {
      await createUserData(userCredential.user.uid, {
        email: signUpData.email,
        firstName: signUpData.firstName,
        lastName: signUpData.lastName,
        systemRole: 'member'
      });
    }

    // Clean up stored data
    localStorage.removeItem('signUpData');

    // Create and return the user object
    const user: User = {
      id: userCredential.user.uid,
      email: signUpData.email,
      firstName: signUpData.firstName,
      lastName: signUpData.lastName,
      systemRole: 'member',
      disabledAt: null,
      clubs: {}
    };

    saveUserToStorage(user);
    return user;
  } catch (error) {
    console.error('Error completing sign up:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}; 