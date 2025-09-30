import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { authenticateMemberCredentials as authenticateMembers } from './memberService.js';

// Collection names
const COLLECTIONS = {
  HIVE_CREDENTIALS: 'hive_credentials',
  HIVES_APPROVED: 'hives_approved',
  HIVES: 'hives'
};

/**
 * Authenticate hive credentials against the database
 * @param {string} email - The email address to authenticate
 * @param {string} password - The password to authenticate
 * @returns {Promise<Object>} - Returns authentication result with hive info or error
 */
export const authenticateHiveCredentials = async (email, password) => {
  try {
    console.log('🔐 Attempting to authenticate hive credentials:', { email });

    // Query the hive_credentials collection for the email
    const credentialsQuery = query(
      collection(db, COLLECTIONS.HIVE_CREDENTIALS),
      where('email', '==', email),
      where('isActive', '==', true)
    );

    const credentialsSnapshot = await getDocs(credentialsQuery);

    if (credentialsSnapshot.empty) {
      console.log('❌ No active credentials found for email:', email);
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
      console.log('❌ Password mismatch for email:', email);
      return {
        success: false,
        error: 'Invalid credentials. Please check your email and password.',
        errorCode: 'INVALID_CREDENTIALS'
      };
    }

    console.log('✅ Credentials validated successfully for:', matchedCredential.hiveName);

    // Get the approved hive data
    let hiveData = null;
    try {
      const approvedHiveQuery = query(
        collection(db, COLLECTIONS.HIVES_APPROVED),
        where('credentials.email', '==', email)
      );
      const approvedHiveSnapshot = await getDocs(approvedHiveQuery);
      
      if (!approvedHiveSnapshot.empty) {
        approvedHiveSnapshot.forEach((doc) => {
          hiveData = {
            id: doc.id,
            ...doc.data()
          };
        });
      }
    } catch (error) {
      console.log('⚠️ Could not fetch approved hive data:', error.message);
    }

    // Return successful authentication with hive information
    return {
      success: true,
      hive: {
        id: matchedCredential.hiveId,
        originalHiveId: matchedCredential.originalHiveId,
        hiveName: matchedCredential.hiveName,
        creatorName: matchedCredential.creatorName,
        email: matchedCredential.email,
        generatedAt: matchedCredential.generatedAt,
        isActive: matchedCredential.isActive,
        approvedData: hiveData
      },
      message: `Welcome back to ${matchedCredential.hiveName}!`
    };

  } catch (error) {
    console.error('💥 Error during authentication:', error);
    return {
      success: false,
      error: 'Authentication service error. Please try again later.',
      errorCode: 'SERVICE_ERROR'
    };
  }
};

/**
 * Authenticate credentials (tries both hive and member credentials)
 * @param {string} email - The email address to authenticate
 * @param {string} password - The password to authenticate
 * @returns {Promise<Object>} - Returns authentication result with user info or error
 */
export const authenticateCredentials = async (email, password) => {
  try {
    console.log('🔐 Attempting authentication for:', { email });
    
    // First try hive credentials
    const hiveResult = await authenticateHiveCredentials(email, password);
    if (hiveResult.success) {
      return {
        ...hiveResult,
        userType: 'hive'
      };
    }
    
    // If hive auth fails, try member credentials
    const memberResult = await authenticateMembers(email, password);
    if (memberResult.success) {
      return {
        ...memberResult,
        userType: 'member'
      };
    }
    
    // Both failed
    console.log('❌ Authentication failed for both hive and member credentials');
    return {
      success: false,
      error: 'Invalid credentials. Please check your email and password.',
      errorCode: 'INVALID_CREDENTIALS'
    };
    
  } catch (error) {
    console.error('💥 Error during authentication:', error);
    return {
      success: false,
      error: 'Authentication service error. Please try again later.',
      errorCode: 'SERVICE_ERROR'
    };
  }
};

/**
 * Validate hive session (check if hive is still active)
 * @param {string} hiveId - The hive ID to validate
 * @param {string} email - The hive email to validate
 * @returns {Promise<Object>} - Returns validation result
 */
export const validateHiveSession = async (hiveId, email) => {
  try {
    console.log('🔍 Validating hive session:', { hiveId, email });

    // Check if credentials are still active
    const credentialsQuery = query(
      collection(db, COLLECTIONS.HIVE_CREDENTIALS),
      where('hiveId', '==', hiveId),
      where('email', '==', email),
      where('isActive', '==', true)
    );

    const credentialsSnapshot = await getDocs(credentialsQuery);

    if (credentialsSnapshot.empty) {
      console.log('❌ Hive session invalid - credentials not found or deactivated');
      return {
        valid: false,
        error: 'Session expired or credentials deactivated.',
        errorCode: 'SESSION_EXPIRED'
      };
    }

    console.log('✅ Hive session is valid');
    return {
      valid: true,
      message: 'Session is active'
    };

  } catch (error) {
    console.error('💥 Error validating hive session:', error);
    return {
      valid: false,
      error: 'Session validation error. Please sign in again.',
      errorCode: 'VALIDATION_ERROR'
    };
  }
};

/**
 * Get hive dashboard data after successful authentication
 * @param {string} hiveId - The approved hive ID
 * @param {string} originalHiveId - The original hive ID from pending collection
 * @returns {Promise<Object>} - Returns hive dashboard data
 */
export const getHiveDashboardData = async (hiveId, originalHiveId) => {
  try {
    console.log('📊 Fetching hive dashboard data:', { hiveId, originalHiveId });

    let dashboardData = {
      hive: null,
      stats: {
        totalMembers: 0,
        activeMembers: 0,
        pendingRequests: 0,
        totalEvents: 0
      },
      recentActivity: [],
      settings: {}
    };

    // Get approved hive data
    if (hiveId) {
      const approvedHiveRef = doc(db, COLLECTIONS.HIVES_APPROVED, hiveId);
      const approvedHiveDoc = await getDoc(approvedHiveRef);
      
      if (approvedHiveDoc.exists()) {
        dashboardData.hive = {
          id: approvedHiveDoc.id,
          ...approvedHiveDoc.data()
        };
      }
    }

    // Get original hive data if needed
    if (originalHiveId && !dashboardData.hive) {
      const originalHiveRef = doc(db, COLLECTIONS.HIVES, originalHiveId);
      const originalHiveDoc = await getDoc(originalHiveRef);
      
      if (originalHiveDoc.exists()) {
        dashboardData.hive = {
          id: originalHiveDoc.id,
          ...originalHiveDoc.data()
        };
      }
    }

    // TODO: In future, fetch additional dashboard data:
    // - Members count from members collection
    // - Events from events collection
    // - Recent activity logs
    // - Settings from hive settings

    console.log('✅ Dashboard data fetched successfully');
    return {
      success: true,
      data: dashboardData
    };

  } catch (error) {
    console.error('💥 Error fetching dashboard data:', error);
    return {
      success: false,
      error: 'Failed to load dashboard data.',
      errorCode: 'DASHBOARD_ERROR'
    };
  }
};

/**
 * Store hive session in localStorage for persistence
 * @param {Object} hiveData - The hive data to store
 */
export const storeHiveSession = (hiveData) => {
  try {
    const sessionData = {
      userType: 'hive',
      hiveId: hiveData.id,
      originalHiveId: hiveData.originalHiveId,
      hiveName: hiveData.hiveName,
      creatorName: hiveData.creatorName,
      email: hiveData.email,
      loginTime: new Date().toISOString()
    };

    localStorage.setItem('userSession', JSON.stringify(sessionData));
    console.log('💾 Hive session stored successfully');
  } catch (error) {
    console.error('💥 Error storing hive session:', error);
  }
};

/**
 * Store member session in localStorage for persistence
 * @param {Object} memberData - The member data to store
 */
export const storeMemberSession = (memberData) => {
  try {
    const sessionData = {
      userType: 'member',
      memberId: memberData.id,
      originalMemberId: memberData.originalMemberId,
      memberName: memberData.memberName,
      email: memberData.email,
      hiveId: memberData.hiveId,
      hiveName: memberData.hiveName,
      loginTime: new Date().toISOString()
    };

    localStorage.setItem('userSession', JSON.stringify(sessionData));
    console.log('💾 Member session stored successfully');
  } catch (error) {
    console.error('💥 Error storing member session:', error);
  }
};

/**
 * Get stored user session from localStorage (hive or member)
 * @returns {Object|null} - Returns stored session data or null
 */
export const getStoredUserSession = () => {
  try {
    const storedSession = localStorage.getItem('userSession');
    if (storedSession) {
      const sessionData = JSON.parse(storedSession);
      const displayName = sessionData.userType === 'hive' ? sessionData.hiveName : `${sessionData.memberName} (${sessionData.hiveName})`;
      console.log(`📶 Retrieved stored ${sessionData.userType} session:`, displayName);
      return sessionData;
    }
    return null;
  } catch (error) {
    console.error('💥 Error retrieving user session:', error);
    return null;
  }
};

/**
 * Clear user session from localStorage
 */
export const clearUserSession = () => {
  try {
    localStorage.removeItem('userSession');
    console.log('🗱️ User session cleared');
  } catch (error) {
    console.error('💥 Error clearing user session:', error);
  }
};

// Legacy function names for backward compatibility
export const getStoredHiveSession = getStoredUserSession;
export const clearHiveSession = clearUserSession;

/**
 * Check if user is authenticated with valid hive credentials
 * @returns {Promise<Object>} - Returns authentication status
 */
export const checkAuthStatus = async () => {
  try {
    const storedSession = getStoredUserSession();
    
    if (!storedSession) {
      return {
        isAuthenticated: false,
        user: null,
        userType: null
      };
    }

    // Validate the stored session based on user type
    let validation = { valid: true }; // Default to valid for now
    
    if (storedSession.userType === 'hive') {
      validation = await validateHiveSession(storedSession.hiveId, storedSession.email);
    }
    // TODO: Add member session validation if needed
    
    if (!validation.valid) {
      clearUserSession();
      return {
        isAuthenticated: false,
        user: null,
        userType: null,
        error: validation.error
      };
    }

    return {
      isAuthenticated: true,
      user: storedSession,
      userType: storedSession.userType
    };

  } catch (error) {
    console.error('💥 Error checking auth status:', error);
    clearUserSession();
    return {
      isAuthenticated: false,
      user: null,
      userType: null,
      error: 'Authentication check failed'
    };
  }
};
