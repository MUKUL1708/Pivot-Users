import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase.js';

// Collection names
const COLLECTIONS = {
  MEMBERS: 'members',
  MEMBERS_APPROVED: 'members_approved',
  MEMBERS_REJECTED: 'members_rejected',
  MEMBER_CREDENTIALS: 'member_credentials',
  HIVES_APPROVED: 'hives_approved'
};

/**
 * Get all approved hives for dropdown selection
 * @returns {Promise<Array>} - Returns array of approved hives
 */
export const getApprovedHivesForSelection = async () => {
  try {
    console.log('📋 Fetching approved hives for member registration...');
    
    const approvedHivesQuery = query(
      collection(db, COLLECTIONS.HIVES_APPROVED),
      orderBy('approvedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(approvedHivesQuery);
    
    const hives = [];
    querySnapshot.forEach((doc) => {
      const hiveData = doc.data();
      hives.push({
        id: doc.id,
        hiveName: hiveData.hiveName,
        campusName: hiveData.campusName,
        campusLocation: hiveData.campusLocation,
        creatorName: hiveData.name,
        memberCount: hiveData.memberCount || 0,
        expectedAudience: hiveData.expectedAudience
      });
    });
    
    console.log(`✅ Found ${hives.length} approved hives`);
    return hives;
  } catch (error) {
    console.error('💥 Error fetching approved hives:', error);
    throw new Error(`Failed to fetch approved hives: ${error.message}`);
  }
};

/**
 * Save member application to Firestore
 * @param {Object} memberData - The member application data
 * @returns {Promise<string>} - Returns the document ID of the created member application
 */
export const saveMemberApplication = async (memberData) => {
  try {
    console.log('💾 Saving member application for:', memberData.selectedHive?.hiveName);
    
    // Add timestamp and status to the member data
    const currentTimestamp = new Date().toISOString();
    const memberWithMetadata = {
      ...memberData,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
      status: 'pending', // pending, approved, rejected
      isActive: false,
      applicationDate: currentTimestamp,
      selectedHiveId: memberData.selectedHive?.id,
      selectedHiveName: memberData.selectedHive?.hiveName
    };

    // Remove the selectedHive object to avoid storing duplicate data
    delete memberWithMetadata.selectedHive;

    // Add the document to the members collection
    const docRef = await addDoc(collection(db, COLLECTIONS.MEMBERS), memberWithMetadata);
    
    console.log('✅ Member application saved successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('💥 Error saving member application:', error);
    throw new Error(`Failed to save member application: ${error.message}`);
  }
};

/**
 * Get pending member applications for a specific hive
 * @param {string} hiveId - The approved hive ID
 * @param {number} limitCount - Number of documents to fetch
 * @param {Object} lastDoc - Last document for pagination
 * @returns {Promise<Object>} - Returns member applications and pagination info
 */
export const getPendingMemberApplications = async (hiveId, limitCount = 20, lastDoc = null) => {
  try {
    console.log('🔍 Fetching pending member applications for hive:', hiveId);

    let q = query(
      collection(db, COLLECTIONS.MEMBERS),
      where('selectedHiveId', '==', hiveId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    
    const applications = [];
    let lastVisible = null;
    
    querySnapshot.forEach((doc) => {
      applications.push({
        id: doc.id,
        ...doc.data()
      });
      lastVisible = doc;
    });
    
    console.log(`✅ Found ${applications.length} pending member applications`);
    return {
      applications,
      lastVisible,
      hasMore: querySnapshot.size === limitCount
    };
  } catch (error) {
    console.error('💥 Error fetching pending member applications:', error);
    throw new Error(`Failed to fetch member applications: ${error.message}`);
  }
};

/**
 * Get member application statistics for a hive
 * @param {string} hiveId - The approved hive ID
 * @returns {Promise<Object>} - Returns member statistics
 */
export const getMemberStats = async (hiveId) => {
  try {
    console.log('📊 Fetching member statistics for hive:', hiveId);

    // Get pending applications
    const pendingQuery = query(
      collection(db, COLLECTIONS.MEMBERS),
      where('selectedHiveId', '==', hiveId),
      where('status', '==', 'pending')
    );
    const pendingSnapshot = await getDocs(pendingQuery);

    // Get approved members
    const approvedQuery = query(
      collection(db, COLLECTIONS.MEMBERS_APPROVED),
      where('selectedHiveId', '==', hiveId)
    );
    const approvedSnapshot = await getDocs(approvedQuery);

    // Get rejected applications
    const rejectedQuery = query(
      collection(db, COLLECTIONS.MEMBERS_REJECTED),
      where('selectedHiveId', '==', hiveId)
    );
    const rejectedSnapshot = await getDocs(rejectedQuery);

    // Count recent applications (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let recentApplications = 0;
    pendingSnapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = new Date(data.createdAt);
      if (createdAt > sevenDaysAgo) {
        recentApplications++;
      }
    });

    const stats = {
      totalApplications: pendingSnapshot.size + approvedSnapshot.size + rejectedSnapshot.size,
      pending: pendingSnapshot.size,
      approved: approvedSnapshot.size,
      rejected: rejectedSnapshot.size,
      recentApplications
    };

    console.log('✅ Member statistics fetched successfully:', stats);
    return stats;
  } catch (error) {
    console.error('💥 Error fetching member statistics:', error);
    throw new Error(`Failed to fetch member statistics: ${error.message}`);
  }
};

/**
 * Generate login credentials for approved member
 * @param {Object} memberData - The member data
 * @returns {Object} - Generated email and password
 */
export const generateMemberCredentials = (memberData) => {
  try {
    console.log('🔑 Generating member credentials for:', memberData.name);

    // Generate email based on member name and hive
    const memberName = memberData.name || 'member';
    const hiveName = memberData.selectedHiveName || 'community';
    
    // Clean and format strings for email
    const cleanMemberName = memberName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
    const cleanHiveName = hiveName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
    
    // Generate unique email
    const timestamp = Date.now().toString().slice(-4);
    const email = `${cleanMemberName}.${cleanHiveName}.${timestamp}@members.hivecommunity.com`;
    
    // Generate secure password
    const password = generateSecurePassword();
    
    return {
      email,
      password,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('💥 Error generating member credentials:', error);
    throw new Error(`Failed to generate member credentials: ${error.message}`);
  }
};

/**
 * Generate a secure password for members
 * @returns {string} - Generated password
 */
const generateSecurePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  let password = '';
  
  // Ensure password has at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%&*'[Math.floor(Math.random() * 7)]; // Special char
  
  // Fill remaining length
  for (let i = 4; i < 10; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Shuffle password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Approve member application and generate credentials
 * @param {string} memberId - The member application ID
 * @param {string} hiveId - The approving hive ID
 * @param {string} hiveLeaderNote - Optional note from hive leader
 * @returns {Promise<Object>} - Returns generated credentials
 */
export const approveMemberApplication = async (memberId, hiveId, hiveLeaderNote = '') => {
  try {
    console.log('✅ Approving member application:', memberId);

    const batch = writeBatch(db);
    
    // Get the member application data
    const memberDoc = await getMemberApplicationById(memberId);
    if (!memberDoc) {
      throw new Error('Member application not found');
    }
    
    // Generate credentials
    const credentials = generateMemberCredentials(memberDoc);
    
    // Prepare approved member data
    const approvedMemberData = {
      ...memberDoc,
      status: 'approved',
      isActive: true,
      hiveLeaderNote,
      hiveLeaderActionDate: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: hiveId,
      credentials: {
        email: credentials.email,
        generatedAt: credentials.generatedAt
      }
    };
    
    // Add to approved collection
    const approvedRef = doc(collection(db, COLLECTIONS.MEMBERS_APPROVED));
    batch.set(approvedRef, approvedMemberData);
    
    // Store credentials separately
    const credentialsRef = doc(collection(db, COLLECTIONS.MEMBER_CREDENTIALS));
    batch.set(credentialsRef, {
      memberId: approvedRef.id,
      originalMemberId: memberId,
      memberName: memberDoc.name,
      email: credentials.email,
      password: credentials.password, // In production, this should be hashed
      generatedAt: credentials.generatedAt,
      hiveId: memberDoc.selectedHiveId,
      hiveName: memberDoc.selectedHiveName,
      isActive: true
    });
    
    // Delete from original members collection since it's now approved
    const originalRef = doc(db, COLLECTIONS.MEMBERS, memberId);
    batch.delete(originalRef);
    
    // Commit batch
    await batch.commit();
    
    console.log('✅ Member application approved successfully');
    
    return {
      approvedMemberId: approvedRef.id,
      credentials: {
        email: credentials.email,
        password: credentials.password,
        generatedAt: credentials.generatedAt
      }
    };
  } catch (error) {
    console.error('💥 Error approving member application:', error);
    throw new Error(`Failed to approve member application: ${error.message}`);
  }
};

/**
 * Reject member application
 * @param {string} memberId - The member application ID
 * @param {string} hiveId - The rejecting hive ID
 * @param {string} hiveLeaderNote - Note from hive leader
 * @returns {Promise<string>} - Returns rejected member ID
 */
export const rejectMemberApplication = async (memberId, hiveId, hiveLeaderNote = '') => {
  try {
    console.log('❌ Rejecting member application:', memberId);

    const batch = writeBatch(db);
    
    // Get the member application data
    const memberDoc = await getMemberApplicationById(memberId);
    if (!memberDoc) {
      throw new Error('Member application not found');
    }
    
    // Prepare rejected member data
    const rejectedMemberData = {
      ...memberDoc,
      status: 'rejected',
      isActive: false,
      hiveLeaderNote,
      hiveLeaderActionDate: new Date().toISOString(),
      rejectedAt: new Date().toISOString(),
      rejectedBy: hiveId
    };
    
    // Add to rejected collection
    const rejectedRef = doc(collection(db, COLLECTIONS.MEMBERS_REJECTED));
    batch.set(rejectedRef, rejectedMemberData);
    
    // Delete from original members collection since it's now rejected
    const originalRef = doc(db, COLLECTIONS.MEMBERS, memberId);
    batch.delete(originalRef);
    
    // Commit batch
    await batch.commit();
    
    console.log('❌ Member application rejected successfully');
    
    return rejectedRef.id;
  } catch (error) {
    console.error('💥 Error rejecting member application:', error);
    throw new Error(`Failed to reject member application: ${error.message}`);
  }
};

/**
 * Get member application by ID
 * @param {string} memberId - The member application ID
 * @returns {Promise<Object|null>} - Returns member application or null
 */
export const getMemberApplicationById = async (memberId) => {
  try {
    const memberRef = doc(db, COLLECTIONS.MEMBERS, memberId);
    const memberSnap = await getDoc(memberRef);
    
    if (memberSnap.exists()) {
      return {
        id: memberSnap.id,
        ...memberSnap.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('💥 Error fetching member application:', error);
    throw new Error(`Failed to fetch member application: ${error.message}`);
  }
};

/**
 * Authenticate member credentials against the database
 * @param {string} email - The email address to authenticate
 * @param {string} password - The password to authenticate
 * @returns {Promise<Object>} - Returns authentication result with member info or error
 */
export const authenticateMemberCredentials = async (email, password) => {
  try {
    console.log('🔐 Attempting to authenticate member credentials:', { email });

    // Query the member_credentials collection for the email
    const credentialsQuery = query(
      collection(db, COLLECTIONS.MEMBER_CREDENTIALS),
      where('email', '==', email),
      where('isActive', '==', true)
    );

    const credentialsSnapshot = await getDocs(credentialsQuery);

    if (credentialsSnapshot.empty) {
      console.log('❌ No active member credentials found for email:', email);
      return {
        success: false,
        error: 'Invalid credentials. Please check your email and password.',
        errorCode: 'INVALID_CREDENTIALS'
      };
    }

    // Check if any of the found credentials match the password
    let matchedCredential = null;
    credentialsSnapshot.forEach((doc) => {
      const credentialData = doc.data();
      // In production, you should hash passwords. For now, direct comparison
      if (credentialData.password === password) {
        matchedCredential = {
          id: doc.id,
          ...credentialData
        };
      }
    });

    if (!matchedCredential) {
      console.log('❌ Password mismatch for member email:', email);
      return {
        success: false,
        error: 'Invalid credentials. Please check your email and password.',
        errorCode: 'INVALID_CREDENTIALS'
      };
    }

    console.log('✅ Member credentials validated successfully for:', matchedCredential.memberName);

    // Get the approved member data if available
    let memberData = null;
    try {
      const approvedMemberQuery = query(
        collection(db, COLLECTIONS.MEMBERS_APPROVED),
        where('credentials.email', '==', email)
      );
      const approvedMemberSnapshot = await getDocs(approvedMemberQuery);
      
      if (!approvedMemberSnapshot.empty) {
        approvedMemberSnapshot.forEach((doc) => {
          memberData = {
            id: doc.id,
            ...doc.data()
          };
        });
      }
    } catch (error) {
      console.log('⚠️ Could not fetch approved member data:', error.message);
    }

    // Return successful authentication with member information
    return {
      success: true,
      member: {
        id: matchedCredential.memberId,
        originalMemberId: matchedCredential.originalMemberId,
        memberName: matchedCredential.memberName,
        email: matchedCredential.email,
        generatedAt: matchedCredential.generatedAt,
        isActive: matchedCredential.isActive,
        hiveId: matchedCredential.hiveId,
        hiveName: matchedCredential.hiveName,
        approvedData: memberData
      },
      message: `Welcome to ${matchedCredential.hiveName}, ${matchedCredential.memberName}!`
    };

  } catch (error) {
    console.error('💥 Error during member authentication:', error);
    return {
      success: false,
      error: 'Authentication service error. Please try again later.',
      errorCode: 'SERVICE_ERROR'
    };
  }
};

/**
 * Validate member form data
 * @param {Object} memberData - The member form data to validate
 * @returns {Object} - Returns validation result
 */
export const validateMemberData = (memberData) => {
  const requiredFields = {
    // Section 1
    'name': 'Full Name',
    'email': 'Email Address',
    'mobile': 'Mobile Number',
    'course': 'Course',
    'branch': 'Branch',
    'year': 'Year of Study',
    
    // Section 2
    'collegeName': 'College/University Name',
    'cgpa': 'CGPA/Percentage',
    'skills': 'Technical Skills',
    
    // Section 3
    'interestedEvents': 'Interested Events',
    
    // Section 4
    'selectedHive': 'Selected Hive',
    'heardAbout': 'How did you hear about us',
    'mainGoal': 'Main Goal',
    'termsAccepted': 'Terms Acceptance'
  };

  const errors = [];
  const missingFields = [];

  for (const [field, displayName] of Object.entries(requiredFields)) {
    const value = memberData[field];
    
    if (field === 'skills' || field === 'interestedEvents') {
      if (!value || !Array.isArray(value) || value.length === 0) {
        errors.push(`${displayName} is required`);
        missingFields.push(field);
      }
    } else if (field === 'selectedHive') {
      if (!value || !value.id) {
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

// Member Management Component Helper Functions

/**
 * Approve member and generate credentials (wrapper for component)
 * @param {string} applicationId - The application ID
 * @param {Object} applicationData - The application data
 * @returns {Promise<Object>} - Returns generated credentials
 */
export const approveMember = async (applicationId, applicationData) => {
  try {
    // Use the existing approveMemberApplication function with hive ID from application
    const result = await approveMemberApplication(
      applicationId, 
      applicationData.selectedHiveId || applicationData.selectedHive?.id,
      ''
    );
    
    return result.credentials;
  } catch (error) {
    console.error('Error in approveMember wrapper:', error);
    throw error;
  }
};

/**
 * Reject member application (wrapper for component)
 * @param {string} applicationId - The application ID
 * @param {Object} applicationData - The application data
 * @returns {Promise<void>}
 */
export const rejectMember = async (applicationId, applicationData) => {
  try {
    await rejectMemberApplication(
      applicationId,
      applicationData.selectedHiveId || applicationData.selectedHive?.id,
      ''
    );
  } catch (error) {
    console.error('Error in rejectMember wrapper:', error);
    throw error;
  }
};

/**
 * Get approved members for a hive
 * @param {string} hiveName - The hive name
 * @returns {Promise<QuerySnapshot>} - Returns approved members query snapshot
 */
export const getApprovedMembers = async (hiveName) => {
  try {
    const approvedQuery = query(
      collection(db, COLLECTIONS.MEMBERS_APPROVED),
      where('selectedHiveName', '==', hiveName)
    );
    return await getDocs(approvedQuery);
  } catch (error) {
    console.error('Error fetching approved members:', error);
    throw error;
  }
};

/**
 * Get rejected members for a hive
 * @param {string} hiveName - The hive name
 * @returns {Promise<QuerySnapshot>} - Returns rejected members query snapshot
 */
export const getRejectedMembers = async (hiveName) => {
  try {
    const rejectedQuery = query(
      collection(db, COLLECTIONS.MEMBERS_REJECTED),
      where('selectedHiveName', '==', hiveName)
    );
    return await getDocs(rejectedQuery);
  } catch (error) {
    console.error('Error fetching rejected members:', error);
    throw error;
  }
};

// Export the memberService object for the component
export const memberService = {
  getApprovedHivesForSelection,
  saveMemberApplication,
  getPendingMemberApplications,
  getMemberStats,
  generateMemberCredentials,
  approveMemberApplication,
  rejectMemberApplication,
  getMemberApplicationById,
  authenticateMemberCredentials,
  validateMemberData,
  approveMember,
  rejectMember,
  getApprovedMembers,
  getRejectedMembers
};
