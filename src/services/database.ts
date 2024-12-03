import { ref, get, set, update, remove } from 'firebase/database';
import { db } from '../config/firebase';

// Generic read function
export const readData = async (path: string) => {
  try {
    const snapshot = await get(ref(db, path));
    return snapshot.val();
  } catch (error) {
    console.error('Error reading data:', error);
    throw error;
  }
};

// Generic write function
export const writeData = async (path: string, data: any) => {
  try {
    await set(ref(db, path), data);
  } catch (error) {
    console.error('Error writing data:', error);
    throw error;
  }
};

// Generic update function
export const updateData = async (path: string, data: any) => {
  try {
    await update(ref(db, path), data);
  } catch (error) {
    console.error('Error updating data:', error);
    throw error;
  }
};

// Generic delete function
export const deleteData = async (path: string) => {
  try {
    await remove(ref(db, path));
  } catch (error) {
    console.error('Error deleting data:', error);
    throw error;
  }
}; 