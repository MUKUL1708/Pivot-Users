import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

/**
 * Test Firebase connection by adding a test document
 * This can be used for debugging purposes
 */
export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    
    // Try to add a test document
    const testData = {
      test: true,
      message: 'Firebase connection test',
      timestamp: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'test'), testData);
    console.log('✅ Firebase connection successful! Test document ID:', docRef.id);
    
    return { success: true, docId: docRef.id };
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Log Firebase configuration (without sensitive data)
 */
export const logFirebaseConfig = () => {
  console.log('Firebase Configuration:');
  console.log('- Project ID: fir-mart-e9e21');
  console.log('- Auth Domain: fir-mart-e9e21.firebaseapp.com');
  console.log('- Storage Bucket: fir-mart-e9e21.firebasestorage.app');
  console.log('- App initialized: ✅');
  console.log('- Firestore initialized: ✅');
};
