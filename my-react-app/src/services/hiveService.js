import { collection, addDoc, doc, setDoc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase.js';

// Collection names
const COLLECTIONS = {
  HIVES: 'hives',
  MEMBERS: 'members'
};

/**
 * Save hive form data to Firestore
 * @param {Object} hiveData - The hive form data to save
 * @returns {Promise<string>} - Returns the document ID of the created hive
 */
export const saveHiveData = async (hiveData) => {
  try {
    // Add timestamp and status to the hive data
    const currentTimestamp = new Date().toISOString();
    const hiveWithMetadata = {
      ...hiveData,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
      status: 'pending', // pending, approved, rejected
      isActive: false,
      memberCount: 0,
      applicationDate: currentTimestamp
    };

    // Add the document to the hives collection
    const docRef = await addDoc(collection(db, COLLECTIONS.HIVES), hiveWithMetadata);
    
    console.log('Hive data saved successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving hive data:', error);
    throw new Error(`Failed to save hive data: ${error.message}`);
  }
};

/**
 * Save member form data to Firestore
 * @param {Object} memberData - The member form data to save
 * @returns {Promise<string>} - Returns the document ID of the created member
 */
export const saveMemberData = async (memberData) => {
  try {
    // Add timestamp and status to the member data
    const currentTimestamp = new Date().toISOString();
    const memberWithMetadata = {
      ...memberData,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
      status: 'active',
      joinedHives: [],
      applicationDate: currentTimestamp
    };

    // Add the document to the members collection
    const docRef = await addDoc(collection(db, COLLECTIONS.MEMBERS), memberWithMetadata);
    
    console.log('Member data saved successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving member data:', error);
    throw new Error(`Failed to save member data: ${error.message}`);
  }
};

/**
 * Get all hives from Firestore
 * @returns {Promise<Array>} - Returns array of hive documents
 */
export const getAllHives = async () => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, COLLECTIONS.HIVES), orderBy('createdAt', 'desc'))
    );
    
    const hives = [];
    querySnapshot.forEach((doc) => {
      hives.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return hives;
  } catch (error) {
    console.error('Error fetching hives:', error);
    throw new Error(`Failed to fetch hives: ${error.message}`);
  }
};

/**
 * Get hive by ID
 * @param {string} hiveId - The hive document ID
 * @returns {Promise<Object|null>} - Returns hive document or null if not found
 */
export const getHiveById = async (hiveId) => {
  try {
    const docRef = doc(db, COLLECTIONS.HIVES, hiveId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching hive:', error);
    throw new Error(`Failed to fetch hive: ${error.message}`);
  }
};

/**
 * Search hives by name or location
 * @param {string} searchTerm - The search term
 * @returns {Promise<Array>} - Returns array of matching hive documents
 */
export const searchHives = async (searchTerm) => {
  try {
    const hives = await getAllHives();
    
    // Client-side filtering (for simple searches)
    // Note: For more complex searches, consider using Algolia or similar service
    const filteredHives = hives.filter(hive => 
      hive.hiveName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hive.campusName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hive.campusLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hive.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filteredHives;
  } catch (error) {
    console.error('Error searching hives:', error);
    throw new Error(`Failed to search hives: ${error.message}`);
  }
};

/**
 * Get hives by status
 * @param {string} status - The status to filter by (pending, approved, rejected)
 * @returns {Promise<Array>} - Returns array of hive documents with specified status
 */
export const getHivesByStatus = async (status) => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.HIVES), 
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      )
    );
    
    const hives = [];
    querySnapshot.forEach((doc) => {
      hives.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return hives;
  } catch (error) {
    console.error('Error fetching hives by status:', error);
    throw new Error(`Failed to fetch hives by status: ${error.message}`);
  }
};

/**
 * Update hive status
 * @param {string} hiveId - The hive document ID
 * @param {string} status - The new status (pending, approved, rejected)
 * @returns {Promise<void>}
 */
export const updateHiveStatus = async (hiveId, status) => {
  try {
    const hiveRef = doc(db, COLLECTIONS.HIVES, hiveId);
    await setDoc(hiveRef, {
      status,
      updatedAt: new Date().toISOString(),
      isActive: status === 'approved'
    }, { merge: true });
    
    console.log(`Hive ${hiveId} status updated to ${status}`);
  } catch (error) {
    console.error('Error updating hive status:', error);
    throw new Error(`Failed to update hive status: ${error.message}`);
  }
};

/**
 * Validate required fields in hive form data
 * @param {Object} hiveData - The hive form data to validate
 * @returns {Object} - Returns validation result
 */
export const validateHiveData = (hiveData) => {
  const requiredFields = {
    // Section 1
    'name': 'Full Name',
    'mobile': 'Mobile Number',
    'course': 'Course',
    'branch': 'Branch',
    'year': 'Year of Study',
    'codingLanguages': 'Coding Languages',
    
    // Section 2
    'campusName': 'Campus Name',
    'campusLocation': 'Campus Location',
    
    // Section 3
    'hiveName': 'Hive Name',
    'expectedAudience': 'Expected Audience',
    'facultyAdvisorName': 'Faculty Advisor Name',
    'facultyAdvisorContact': 'Faculty Advisor Contact',
    
    // Section 4
    'leadershipExperience': 'Leadership Experience',
    'longTermVision': 'Long-term Vision',
    'termsAccepted': 'Terms Acceptance'
  };

  const errors = [];
  const missingFields = [];

  for (const [field, displayName] of Object.entries(requiredFields)) {
    const value = hiveData[field];
    
    if (field === 'codingLanguages') {
      if (!value || !Array.isArray(value) || value.length === 0) {
        errors.push(`${displayName} is required`);
        missingFields.push(field);
      }
    } else if (field === 'termsAccepted') {
      if (!value) {
        errors.push('You must accept the terms and conditions');
        missingFields.push(field);
      }
    } else if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`${displayName} is required`);
      missingFields.push(field);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    missingFields
  };
};
