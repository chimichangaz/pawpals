// src/services/events.service.js
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  doc,
  getDoc 
} from 'firebase/firestore';
import { db } from './firebase';

export const eventsService = {
  // Fetch all events from Firestore
  async getAllEvents() {
    try {
      const eventsCollection = collection(db, 'events');
      const querySnapshot = await getDocs(eventsCollection);
      
      const events = [];
      querySnapshot.forEach((doc) => {
        events.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return events;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  // Fetch upcoming events (events after current date)
  async getUpcomingEvents() {
    try {
      const events = await this.getAllEvents();
      const now = new Date();
      
      // Filter events that haven't passed yet
      const upcomingEvents = events.filter(event => {
        if (event.datetime) {
          // Handle Firestore timestamp or date string
          const eventDate = event.datetime.toDate ? event.datetime.toDate() : new Date(event.datetime);
          return eventDate >= now;
        }
        return true; // Include events without dates for now
      });

      // Sort by date (earliest first)
      upcomingEvents.sort((a, b) => {
        const dateA = a.datetime && a.datetime.toDate ? a.datetime.toDate() : new Date(a.datetime || 0);
        const dateB = b.datetime && b.datetime.toDate ? b.datetime.toDate() : new Date(b.datetime || 0);
        return dateA - dateB;
      });
      
      return upcomingEvents;
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw error;
    }
  },

  // Fetch events by location/area
  async getEventsByLocation(location) {
    try {
      const events = await this.getAllEvents();
      const lowerLocation = location.toLowerCase();
      
      return events.filter(event => {
        // Check if location is in the event's location coordinates or description
        if (event.coords && event.coords.address) {
          return event.coords.address.toLowerCase().includes(lowerLocation);
        }
        if (event.description) {
          return event.description.toLowerCase().includes(lowerLocation);
        }
        if (event.name) {
          return event.name.toLowerCase().includes(lowerLocation);
        }
        return false;
      });
    } catch (error) {
      console.error('Error fetching events by location:', error);
      throw error;
    }
  },

  // Get a specific event by ID
  async getEventById(eventId) {
    try {
      const eventDoc = doc(db, 'events', eventId);
      const eventSnapshot = await getDoc(eventDoc);
      
      if (eventSnapshot.exists()) {
        return {
          id: eventSnapshot.id,
          ...eventSnapshot.data()
        };
      } else {
        throw new Error('Event not found');
      }
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      throw error;
    }
  },

  // Search events by name or description
  async searchEvents(searchTerm) {
    try {
      const events = await this.getAllEvents();
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      return events.filter(event => 
        (event.name && event.name.toLowerCase().includes(lowerSearchTerm)) ||
        (event.description && event.description.toLowerCase().includes(lowerSearchTerm)) ||
        (event.createdby && event.createdby.toLowerCase().includes(lowerSearchTerm))
      );
    } catch (error) {
      console.error('Error searching events:', error);
      throw error;
    }
  },

  // Get events created by a specific user
  async getEventsByUser(userEmail) {
    try {
      const eventsCollection = collection(db, 'events');
      const q = query(
        eventsCollection, 
        where('createdby', '==', userEmail)
      );
      const querySnapshot = await getDocs(q);
      
      const events = [];
      querySnapshot.forEach((doc) => {
        events.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return events;
    } catch (error) {
      console.error('Error fetching events by user:', error);
      throw error;
    }
  },

  // Format event date for display
  formatEventDate(event) {
    if (!event.datetime) return 'Date TBD';
    
    try {
      const eventDate = event.datetime.toDate ? event.datetime.toDate() : new Date(event.datetime);
      return eventDate.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date format error';
    }
  },

  // Get event location string
  getEventLocation(event) {
    if (event.coords && event.coords.lat && event.coords.lng) {
      return `${event.coords.lat}, ${event.coords.lng}`;
    }
    return 'Location TBD';
  }
};