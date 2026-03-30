// ========================================
// API WRAPPER FOR SAMANID TRAVEL ADMIN
// ========================================

// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';

// ========== BOOKINGS API ==========
const BookingsAPI = {
    async getAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/bookings`);
            if (!response.ok) throw new Error('Failed to fetch bookings');
            return await response.json();
        } catch (error) {
            console.error('BookingsAPI.getAll error:', error);
            // Fallback to localStorage
            return JSON.parse(localStorage.getItem('bookings')) || [];
        }
    },

    async create(booking) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(booking)
            });
            if (!response.ok) throw new Error('Failed to create booking');
            return await response.json();
        } catch (error) {
            console.error('BookingsAPI.create error:', error);
            // Fallback to localStorage
            let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
            booking.id = Date.now();
            bookings.unshift(booking);
            localStorage.setItem('bookings', JSON.stringify(bookings));
            return { id: booking.id };
        }
    },

    async update(id, data) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update booking');
            return await response.json();
        } catch (error) {
            console.error('BookingsAPI.update error:', error);
            // Fallback to localStorage
            let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
            const index = bookings.findIndex(b => b.id == id);
            if (index !== -1) {
                bookings[index] = { ...bookings[index], ...data };
                localStorage.setItem('bookings', JSON.stringify(bookings));
            }
            return { message: 'Updated' };
        }
    },

    async delete(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete booking');
            return await response.json();
        } catch (error) {
            console.error('BookingsAPI.delete error:', error);
            // Fallback to localStorage
            let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
            bookings = bookings.filter(b => b.id != id);
            localStorage.setItem('bookings', JSON.stringify(bookings));
            return { message: 'Deleted' };
        }
    }
};

// ========== TOURS API ==========
const ToursAPI = {
    async getAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tours`);
            if (!response.ok) throw new Error('Failed to fetch tours');
            return await response.json();
        } catch (error) {
            console.error('ToursAPI.getAll error:', error);
            return JSON.parse(localStorage.getItem('tours')) || [];
        }
    },

    async create(tour) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tours`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tour)
            });
            if (!response.ok) throw new Error('Failed to create tour');
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('ToursAPI.create error:', error);
            let tours = JSON.parse(localStorage.getItem('tours')) || [];
            tour.id = Math.max(...tours.map(t => t.id), 0) + 1;
            tours.push(tour);
            localStorage.setItem('tours', JSON.stringify(tours));
            return { id: tour.id };
        }
    },

    async update(id, data) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tours/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update tour');
            return await response.json();
        } catch (error) {
            console.error('ToursAPI.update error:', error);
            let tours = JSON.parse(localStorage.getItem('tours')) || [];
            const index = tours.findIndex(t => t.id == id);
            if (index !== -1) {
                tours[index] = { ...tours[index], ...data };
                localStorage.setItem('tours', JSON.stringify(tours));
            }
            return { message: 'Updated' };
        }
    },

    async delete(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tours/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete tour');
            return await response.json();
        } catch (error) {
            console.error('ToursAPI.delete error:', error);
            let tours = JSON.parse(localStorage.getItem('tours')) || [];
            tours = tours.filter(t => t.id != id);
            localStorage.setItem('tours', JSON.stringify(tours));
            return { message: 'Deleted' };
        }
    }
};

// ========== DESTINATIONS API ==========
const DestinationsAPI = {
    async getAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/destinations`);
            if (!response.ok) throw new Error('Failed to fetch destinations');
            return await response.json();
        } catch (error) {
            console.error('DestinationsAPI.getAll error:', error);
            return JSON.parse(localStorage.getItem('destinations')) || [];
        }
    },

    async create(destination) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/destinations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(destination)
            });
            if (!response.ok) throw new Error('Failed to create destination');
            return await response.json();
        } catch (error) {
            console.error('DestinationsAPI.create error:', error);
            let destinations = JSON.parse(localStorage.getItem('destinations')) || [];
            destinations.push(destination);
            localStorage.setItem('destinations', JSON.stringify(destinations));
            return { id: destination.id };
        }
    },

    async update(id, data) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/destinations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update destination');
            return await response.json();
        } catch (error) {
            console.error('DestinationsAPI.update error:', error);
            let destinations = JSON.parse(localStorage.getItem('destinations')) || [];
            const index = destinations.findIndex(d => d.id == id);
            if (index !== -1) {
                destinations[index] = { ...destinations[index], ...data };
                localStorage.setItem('destinations', JSON.stringify(destinations));
            }
            return { message: 'Updated' };
        }
    },

    async delete(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/destinations/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete destination');
            return await response.json();
        } catch (error) {
            console.error('DestinationsAPI.delete error:', error);
            let destinations = JSON.parse(localStorage.getItem('destinations')) || [];
            destinations = destinations.filter(d => d.id != id);
            localStorage.setItem('destinations', JSON.stringify(destinations));
            return { message: 'Deleted' };
        }
    }
};

// ========== REVIEWS API ==========
const ReviewsAPI = {
    async getAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/reviews`);
            if (!response.ok) throw new Error('Failed to fetch reviews');
            return await response.json();
        } catch (error) {
            console.error('ReviewsAPI.getAll error:', error);
            return [];
        }
    },

    async updateStatus(id, status) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/reviews/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!response.ok) throw new Error('Failed to update review');
            return await response.json();
        } catch (error) {
            console.error('ReviewsAPI.updateStatus error:', error);
            return { error: error.message };
        }
    },

    async delete(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/reviews/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete review');
            return await response.json();
        } catch (error) {
            console.error('ReviewsAPI.delete error:', error);
            return { error: error.message };
        }
    }
};

// ========== STATS API ==========
const StatsAPI = {
    async get() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/stats`);
            if (!response.ok) throw new Error('Failed to fetch stats');
            return await response.json();
        } catch (error) {
            console.error('StatsAPI.get error:', error);
            // Fallback to localStorage
            const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
            const tours = JSON.parse(localStorage.getItem('tours')) || [];
            const destinations = JSON.parse(localStorage.getItem('destinations')) || [];
            return {
                totalBookings: bookings.length,
                newBookings: bookings.filter(b => b.status === 'new').length,
                totalTours: tours.length,
                totalDestinations: destinations.length
            };
        }
    }
};

// Export for use in admin.js
window.BookingsAPI = BookingsAPI;
window.ToursAPI = ToursAPI;
window.DestinationsAPI = DestinationsAPI;
window.StatsAPI = StatsAPI;
window.ReviewsAPI = ReviewsAPI;
window.API_BASE_URL = API_BASE_URL;

console.log('API wrapper loaded. Base URL:', API_BASE_URL);
