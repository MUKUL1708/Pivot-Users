import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export const eventService = {
  // Create a new event
  async createEvent(eventData) {
    try {
      console.log('🎉 Creating new event:', eventData.eventName);
      
      const eventPayload = {
        ...eventData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Ensure all required fields have default values
        status: eventData.status || 'draft',
        registrationFees: eventData.registrationFees || 0,
        numberOfVolunteers: eventData.numberOfVolunteers || 0,
        sponsorshipNeeded: eventData.sponsorshipNeeded || false
      };
      
      const docRef = await addDoc(collection(db, 'events'), eventPayload);
      console.log('✅ Event created successfully with ID:', docRef.id);
      
      return {
        id: docRef.id,
        ...eventPayload
      };
    } catch (error) {
      console.error('💥 Error creating event:', error);
      throw new Error(`Failed to create event: ${error.message}`);
    }
  },

  // Get all events
  async getAllEvents() {
    try {
      console.log('📋 Fetching all events...');
      const eventsQuery = query(
        collection(db, 'events'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(eventsQuery);
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`✅ Retrieved ${events.length} events`);
      return events;
    } catch (error) {
      console.error('💥 Error fetching events:', error);
      throw new Error(`Failed to fetch events: ${error.message}`);
    }
  },

  // Get events by hive
  async getEventsByHive(hiveName) {
    try {
      console.log('🏠 Fetching events for hive:', hiveName);
      const eventsQuery = query(
        collection(db, 'events'),
        where('hiveName', '==', hiveName)
      );
      
      const snapshot = await getDocs(eventsQuery);
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by createdAt in JavaScript to avoid needing a composite index
      const sortedEvents = events.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime - aTime; // Descending order (newest first)
      });
      
      console.log(`✅ Retrieved ${sortedEvents.length} events for ${hiveName}`);
      return sortedEvents;
    } catch (error) {
      console.error('💥 Error fetching hive events:', error);
      throw new Error(`Failed to fetch hive events: ${error.message}`);
    }
  },

  // Get events by hive (simple version without composite index)
  async getEventsByHiveSimple(hiveName) {
    try {
      console.log('🏠 Fetching events for hive (simple):', hiveName);
      
      // Get all events first, then filter
      const snapshot = await getDocs(collection(db, 'events'));
      const allEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter by hiveName
      const hiveEvents = allEvents.filter(event => event.hiveName === hiveName);
      
      // Sort by createdAt
      const sortedEvents = hiveEvents.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime - aTime; // Descending order (newest first)
      });
      
      console.log(`✅ Retrieved ${sortedEvents.length} events for ${hiveName} (simple)`);
      return sortedEvents;
    } catch (error) {
      console.error('💥 Error fetching hive events (simple):', error);
      throw new Error(`Failed to fetch hive events (simple): ${error.message}`);
    }
  },

  // Get events by status
  async getEventsByStatus(status) {
    try {
      console.log('📊 Fetching events with status:', status);
      const eventsQuery = query(
        collection(db, 'events'),
        where('status', '==', status)
      );
      
      const snapshot = await getDocs(eventsQuery);
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by createdAt in JavaScript to avoid needing a composite index
      const sortedEvents = events.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime - aTime; // Descending order (newest first)
      });
      
      console.log(`✅ Retrieved ${sortedEvents.length} ${status} events`);
      return sortedEvents;
    } catch (error) {
      console.error('💥 Error fetching events by status:', error);
      throw new Error(`Failed to fetch events by status: ${error.message}`);
    }
  },

  // Get upcoming events (events that haven't started yet)
  async getUpcomingEvents() {
    try {
      console.log('🔮 Fetching upcoming events...');
      const today = new Date().toISOString().split('T')[0];
      
      const eventsQuery = query(
        collection(db, 'events'),
        where('startDate', '>=', today),
        orderBy('startDate', 'asc')
      );
      
      const snapshot = await getDocs(eventsQuery);
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`✅ Retrieved ${events.length} upcoming events`);
      return events;
    } catch (error) {
      console.error('💥 Error fetching upcoming events:', error);
      throw new Error(`Failed to fetch upcoming events: ${error.message}`);
    }
  },

  // Update an event
  async updateEvent(eventId, updateData) {
    try {
      console.log('✏️ Updating event:', eventId);
      
      const eventRef = doc(db, 'events', eventId);
      const updatePayload = {
        ...updateData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(eventRef, updatePayload);
      console.log('✅ Event updated successfully');
      
      return true;
    } catch (error) {
      console.error('💥 Error updating event:', error);
      throw new Error(`Failed to update event: ${error.message}`);
    }
  },

  // Delete an event
  async deleteEvent(eventId) {
    try {
      console.log('🗑️ Deleting event:', eventId);
      
      const eventRef = doc(db, 'events', eventId);
      await deleteDoc(eventRef);
      
      console.log('✅ Event deleted successfully');
      return true;
    } catch (error) {
      console.error('💥 Error deleting event:', error);
      throw new Error(`Failed to delete event: ${error.message}`);
    }
  },

  // Update event status
  async updateEventStatus(eventId, status) {
    try {
      console.log('🔄 Updating event status:', eventId, 'to', status);
      
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        status: status,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Event status updated successfully');
      return true;
    } catch (error) {
      console.error('💥 Error updating event status:', error);
      throw new Error(`Failed to update event status: ${error.message}`);
    }
  },

  // Get events for members (includes hive events + admin events)
  async getEventsForMember(hiveName) {
    try {
      console.log('👥 Fetching events for member of hive:', hiveName);
      
      // Get all events first, then filter
      const snapshot = await getDocs(collection(db, 'events'));
      const allEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter events: include hive events + admin events
      const relevantEvents = allEvents.filter(event => {
        // Include events organized by the member's hive
        const isHiveEvent = event.hiveName === hiveName;
        
        // Include events organized by admin (assuming admin events have hiveName as 'admin' or no hiveName)
        const isAdminEvent = !event.hiveName || event.hiveName === 'admin' || event.organizerType === 'admin';
        
        return isHiveEvent || isAdminEvent;
      });
      
      // Sort by createdAt
      const sortedEvents = relevantEvents.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime - aTime; // Descending order (newest first)
      });
      
      console.log(`✅ Retrieved ${sortedEvents.length} events for member (${hiveName} hive + admin events)`);
      return sortedEvents;
    } catch (error) {
      console.error('💥 Error fetching member events:', error);
      throw new Error(`Failed to fetch member events: ${error.message}`);
    }
  },

  // Get upcoming events for members (includes hive + admin events)
  async getUpcomingEventsForMember(hiveName) {
    try {
      console.log('🔮 Fetching upcoming events for member of hive:', hiveName);
      const today = new Date().toISOString().split('T')[0];
      
      // Get all events for this member
      const allEvents = await this.getEventsForMember(hiveName);
      
      // Filter for upcoming events
      const upcomingEvents = allEvents.filter(event => {
        return event.startDate >= today && 
               (event.status === 'active' || event.status === 'approved');
      });
      
      // Sort by start date (earliest first for upcoming events)
      const sortedUpcoming = upcomingEvents.sort((a, b) => {
        const aDate = new Date(a.startDate);
        const bDate = new Date(b.startDate);
        return aDate - bDate; // Ascending order (earliest first)
      });
      
      console.log(`✅ Retrieved ${sortedUpcoming.length} upcoming events for member`);
      return sortedUpcoming;
    } catch (error) {
      console.error('💥 Error fetching upcoming member events:', error);
      throw new Error(`Failed to fetch upcoming member events: ${error.message}`);
    }
  },

  // Get event statistics
  async getEventStatistics(hiveName = null) {
    try {
      console.log('📊 Fetching event statistics...');
      
      let eventsQuery;
      if (hiveName) {
        eventsQuery = query(collection(db, 'events'), where('hiveName', '==', hiveName));
      } else {
        eventsQuery = collection(db, 'events');
      }
      
      const snapshot = await getDocs(eventsQuery);
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const stats = {
        total: events.length,
        draft: events.filter(e => e.status === 'draft').length,
        active: events.filter(e => e.status === 'active').length,
        completed: events.filter(e => e.status === 'completed').length,
        cancelled: events.filter(e => e.status === 'cancelled').length,
        upcoming: events.filter(e => {
          const today = new Date().toISOString().split('T')[0];
          return e.startDate >= today;
        }).length
      };
      
      console.log('✅ Event statistics calculated:', stats);
      return stats;
    } catch (error) {
      console.error('💥 Error fetching event statistics:', error);
      throw new Error(`Failed to fetch event statistics: ${error.message}`);
    }
  }
};

export default eventService;
