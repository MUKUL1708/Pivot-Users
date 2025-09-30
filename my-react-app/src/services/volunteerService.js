import {
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

// Collection names
const COLLECTIONS = {
  VOLUNTEERS: 'volunteers',
  VOLUNTEER_APPLICATIONS: 'volunteer_applications',
  VOLUNTEER_NOTIFICATIONS: 'volunteer_notifications'
};

/**
 * Get all active volunteer opportunities for members
 * @returns {Promise<Array>} - Returns array of active volunteer opportunities with event details
 */
export const getActiveVolunteerOpportunities = async () => {
  try {
    console.log('🔍 Fetching active volunteer opportunities for members...');
    
    // Query without orderBy to avoid needing a composite index
    const q = query(
      collection(db, COLLECTIONS.VOLUNTEERS),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const opportunities = [];
    
    for (const docSnapshot of snapshot.docs) {
      const opportunityData = docSnapshot.data();
      
      // Get current applications count
      const applicationsQuery = query(
        collection(db, COLLECTIONS.VOLUNTEER_APPLICATIONS),
        where('volunteerId', '==', docSnapshot.id),
        where('status', '==', 'approved')
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);
      
      // Get associated event details from events collection
      let eventData = null;
      if (opportunityData.eventId) {
        try {
          const eventDoc = await getDoc(doc(db, 'events', opportunityData.eventId));
          if (eventDoc.exists()) {
            eventData = eventDoc.data();
          }
        } catch (eventError) {
          console.warn('⚠️ Could not fetch event details for opportunity:', eventError.message);
        }
      }
      
      opportunities.push({
        id: docSnapshot.id,
        ...opportunityData,
        event: eventData, // Include event details
        currentApplications: applicationsSnapshot.size,
        spotsRemaining: (opportunityData.maxVolunteers || 0) - applicationsSnapshot.size
      });
    }
    
    // Sort by createdAt descending on client-side
    const sortedOpportunities = opportunities.sort((a, b) => {
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });
    
    console.log(`✅ Retrieved and sorted ${sortedOpportunities.length} active volunteer opportunities with event details`);
    return sortedOpportunities;
  } catch (error) {
    console.error('💥 Error fetching volunteer opportunities:', error);
    throw new Error(`Failed to fetch volunteer opportunities: ${error.message}`);
  }
};

/**
 * Apply for a volunteer opportunity
 * @param {string} volunteerId - The volunteer opportunity ID
 * @param {Object} memberData - Member application data
 * @returns {Promise<string>} - Returns application ID
 */
export const applyForVolunteer = async (volunteerId, memberData) => {
  try {
    console.log('📝 Applying for volunteer opportunity:', volunteerId);
    
    // Check if already applied
    const existingQuery = query(
      collection(db, COLLECTIONS.VOLUNTEER_APPLICATIONS),
      where('volunteerId', '==', volunteerId),
      where('memberEmail', '==', memberData.memberEmail)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      throw new Error('You have already applied for this volunteer opportunity');
    }
    
    // Create application
    const application = {
      volunteerId,
      memberEmail: memberData.memberEmail,
      memberName: memberData.memberName,
      hiveName: memberData.hiveName,
      phone: memberData.phone || '',
      skills: memberData.skills || [],
      experience: memberData.experience || '',
      availability: memberData.availability || '',
      motivation: memberData.motivation || '',
      status: 'pending', // pending, approved, rejected
      appliedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.VOLUNTEER_APPLICATIONS), application);
    
    console.log('✅ Volunteer application submitted:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('💥 Error applying for volunteer:', error);
    throw error;
  }
};

/**
 * Get member's volunteer applications
 * @param {string} memberEmail - Member's email address
 * @returns {Promise<Array>} - Returns array of member's applications
 */
export const getMemberApplications = async (memberEmail) => {
  try {
    console.log('📋 Fetching volunteer applications for member:', memberEmail);
    
    // Query without orderBy to avoid needing a composite index
    const q = query(
      collection(db, COLLECTIONS.VOLUNTEER_APPLICATIONS),
      where('memberEmail', '==', memberEmail)
    );
    
    const snapshot = await getDocs(q);
    const applications = [];
    
    for (const docSnapshot of snapshot.docs) {
      const applicationData = docSnapshot.data();
      
      // Get volunteer opportunity details
      const volunteerDoc = await getDocs(query(
        collection(db, COLLECTIONS.VOLUNTEERS),
        where('__name__', '==', applicationData.volunteerId)
      ));
      
      let opportunityData = null;
      if (!volunteerDoc.empty) {
        opportunityData = volunteerDoc.docs[0].data();
      }
      
      applications.push({
      id: docSnapshot.id,
      ...applicationData,
      opportunity: opportunityData
    });
  }
  
  // Sort by appliedAt descending on client-side
  const sortedApplications = applications.sort((a, b) => {
    return (b.appliedAt?.seconds || 0) - (a.appliedAt?.seconds || 0);
  });
  
  console.log(`✅ Retrieved and sorted ${sortedApplications.length} applications for member`);
  return sortedApplications;
  } catch (error) {
    console.error('💥 Error fetching member applications:', error);
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }
};

/**
 * Get volunteer notifications for a member
 * @param {string} memberEmail - Member's email address
 * @returns {Promise<Array>} - Returns array of notifications
 */
export const getVolunteerNotifications = async (memberEmail) => {
  try {
    console.log('🔔 Fetching volunteer notifications for member:', memberEmail);
    
    // Simplified query to avoid composite index requirement
    // We'll filter and sort client-side instead
    const q = query(
      collection(db, COLLECTIONS.VOLUNTEER_NOTIFICATIONS),
      where('memberEmail', '==', memberEmail)
    );
    
    const snapshot = await getDocs(q);
    const notifications = [];
    
    snapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Filter and sort client-side
    const unreadNotifications = notifications
      .filter(notification => !notification.isRead)
      .sort((a, b) => {
        // Sort by createdAt in descending order
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      });
    
    console.log(`✅ Retrieved ${unreadNotifications.length} unread notifications for member`);
    return unreadNotifications;
  } catch (error) {
    console.error('💥 Error fetching notifications:', error);
    // Don't throw error for notifications, just return empty array
    return [];
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<void>}
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, COLLECTIONS.VOLUNTEER_NOTIFICATIONS, notificationId), {
      isRead: true,
      readAt: serverTimestamp()
    });
    
    console.log('✅ Notification marked as read:', notificationId);
  } catch (error) {
    console.error('💥 Error marking notification as read:', error);
    // Don't throw error for this action
  }
};

/**
 * Create notifications for all members about new volunteer opportunities
 * @param {Object} opportunityData - Volunteer opportunity data
 * @returns {Promise<void>}
 */
export const createVolunteerNotifications = async (opportunityData) => {
  try {
    console.log('🔔 Creating volunteer notifications for all members');
    
    // Get all approved members
    const membersQuery = query(collection(db, 'members_approved'));
    const membersSnapshot = await getDocs(membersQuery);
    
    const batch = writeBatch(db);
    let notificationCount = 0;
    
    membersSnapshot.forEach((memberDoc) => {
      const memberData = memberDoc.data();
      
      const notification = {
        type: 'volunteer_opportunity',
        title: 'New Volunteer Opportunity Available! 🙋‍♀️',
        message: `A new volunteer opportunity "${opportunityData.title || 'Volunteer Position'}" is now open for applications. Join us and make a difference!`,
        memberEmail: memberData.email || memberData.credentials?.email,
        memberName: memberData.name,
        opportunityId: opportunityData.id,
        opportunityTitle: opportunityData.title,
        isRead: false,
        createdAt: serverTimestamp()
      };
      
      // Add to batch
      const notificationRef = doc(collection(db, COLLECTIONS.VOLUNTEER_NOTIFICATIONS));
      batch.set(notificationRef, notification);
      notificationCount++;
    });
    
    // Commit all notifications
    await batch.commit();
    console.log(`✅ Created ${notificationCount} volunteer notifications`);
  } catch (error) {
    console.error('💥 Error creating volunteer notifications:', error);
    // Don't throw error as this is a background operation
  }
};

/**
 * Get volunteer applications for admin review
 * @param {string} volunteerId - Optional volunteer opportunity ID to filter by
 * @returns {Promise<Array>} - Returns array of applications
 */
export const getVolunteerApplicationsForAdmin = async (volunteerId = null) => {
  try {
    console.log('👨‍💼 Fetching volunteer applications for admin review');
    
    let q;
    if (volunteerId) {
      // Query without orderBy to avoid needing a composite index
      q = query(
        collection(db, COLLECTIONS.VOLUNTEER_APPLICATIONS),
        where('volunteerId', '==', volunteerId)
      );
    } else {
      // Simple collection query without orderBy
      q = collection(db, COLLECTIONS.VOLUNTEER_APPLICATIONS);
    }
    
    const snapshot = await getDocs(q);
    const applications = [];
    
    for (const docSnapshot of snapshot.docs) {
      const applicationData = docSnapshot.data();
      
      // Get volunteer opportunity details
      const volunteerQuery = query(
        collection(db, COLLECTIONS.VOLUNTEERS),
        where('__name__', '==', applicationData.volunteerId)
      );
      const volunteerSnapshot = await getDocs(volunteerQuery);
      
      let opportunityData = null;
      if (!volunteerSnapshot.empty) {
        opportunityData = volunteerSnapshot.docs[0].data();
      }
      
      applications.push({
      id: docSnapshot.id,
      ...applicationData,
      opportunity: opportunityData
    });
  }
  
  // Sort by appliedAt descending on client-side
  const sortedApplications = applications.sort((a, b) => {
    return (b.appliedAt?.seconds || 0) - (a.appliedAt?.seconds || 0);
  });
  
  console.log(`✅ Retrieved and sorted ${sortedApplications.length} applications for admin`);
  return sortedApplications;
  } catch (error) {
    console.error('💥 Error fetching applications for admin:', error);
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }
};

/**
 * Update volunteer application status (admin action)
 * @param {string} applicationId - Application ID
 * @param {string} status - New status (approved, rejected)
 * @param {string} adminNote - Optional admin note
 * @returns {Promise<void>}
 */
export const updateApplicationStatus = async (applicationId, status, adminNote = '') => {
  try {
    console.log('📝 Updating application status:', applicationId, 'to', status);
    
    await updateDoc(doc(db, COLLECTIONS.VOLUNTEER_APPLICATIONS, applicationId), {
      status,
      adminNote,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Application status updated successfully');
  } catch (error) {
    console.error('💥 Error updating application status:', error);
    throw new Error(`Failed to update application status: ${error.message}`);
  }
};

/**
 * Get volunteer statistics for admin
 * @returns {Promise<Object>} - Returns volunteer statistics
 */
export const getVolunteerStatsForAdmin = async () => {
  try {
    console.log('📊 Fetching volunteer statistics for admin');
    
    const [opportunitiesSnapshot, applicationsSnapshot] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.VOLUNTEERS)),
      getDocs(collection(db, COLLECTIONS.VOLUNTEER_APPLICATIONS))
    ]);
    
    const stats = {
      totalOpportunities: opportunitiesSnapshot.size,
      activeOpportunities: 0,
      totalApplications: applicationsSnapshot.size,
      pendingApplications: 0,
      approvedApplications: 0,
      rejectedApplications: 0
    };
    
    // Count active opportunities
    opportunitiesSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isActive) {
        stats.activeOpportunities++;
      }
    });
    
    // Count applications by status
    applicationsSnapshot.forEach((doc) => {
      const data = doc.data();
      switch (data.status) {
        case 'pending':
          stats.pendingApplications++;
          break;
        case 'approved':
          stats.approvedApplications++;
          break;
        case 'rejected':
          stats.rejectedApplications++;
          break;
      }
    });
    
    console.log('✅ Volunteer statistics calculated:', stats);
    return stats;
  } catch (error) {
    console.error('💥 Error fetching volunteer statistics:', error);
    throw new Error(`Failed to fetch volunteer statistics: ${error.message}`);
  }
};

// Export the volunteer service
export const volunteerService = {
  getActiveVolunteerOpportunities,
  applyForVolunteer,
  getMemberApplications,
  getVolunteerNotifications,
  markNotificationAsRead,
  createVolunteerNotifications,
  getVolunteerApplicationsForAdmin,
  updateApplicationStatus,
  getVolunteerStatsForAdmin
};

export default volunteerService;