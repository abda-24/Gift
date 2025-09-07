// Gift List Manager JavaScript

class GiftListManager {
    constructor() {
        this.gifts = this.loadGifts();
        this.initializeEventListeners();
        this.renderGifts();
        this.checkReminders();
        
        // Check reminders every hour
        setInterval(() => this.checkReminders(), 3600000);
    }

    initializeEventListeners() {
        const form = document.getElementById('gift-form');
        form.addEventListener('submit', (e) => this.handleAddGift(e));
    }

    handleAddGift(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const gift = {
            id: Date.now(),
            name: formData.get('gift-name'),
            description: formData.get('gift-description'),
            recipient: formData.get('recipient'),
            reminderDate: formData.get('reminder-date'),
            eventType: formData.get('event-type'),
            dateAdded: new Date().toISOString()
        };

        this.gifts.push(gift);
        this.saveGifts();
        this.renderGifts();
        e.target.reset();
        
        // Show success message
        this.showNotification('Gift added successfully!', 'success');
    }

    renderGifts() {
        const giftList = document.getElementById('gift-list');
        const emptyState = document.getElementById('empty-state');
        
        if (this.gifts.length === 0) {
            giftList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        giftList.style.display = 'grid';
        emptyState.style.display = 'none';
        
        giftList.innerHTML = this.gifts.map(gift => this.createGiftHTML(gift)).join('');
        
        // Add event listeners for edit and delete buttons
        this.attachGiftEventListeners();
    }

    createGiftHTML(gift) {
        const reminderIcon = this.getReminderIcon(gift);
        const eventText = gift.eventType && gift.reminderDate ? 
            `${this.capitalizeFirst(gift.eventType)} - ${this.formatDate(gift.reminderDate)}` : 
            gift.eventType ? this.capitalizeFirst(gift.eventType) : 'No event set';

        return `
            <div class="gift-item" data-id="${gift.id}">
                <div class="gift-header">
                    <h3 class="gift-name">${this.escapeHtml(gift.name)}</h3>
                    ${reminderIcon}
                </div>
                <p class="gift-description">${this.escapeHtml(gift.description || 'No description')}</p>
                <p class="gift-recipient"><strong>For:</strong> ${this.escapeHtml(gift.recipient)}</p>
                <p class="gift-date"><strong>Event:</strong> ${eventText}</p>
                <div class="gift-actions">
                    <button class="edit-btn" onclick="giftManager.editGift(${gift.id})">Edit</button>
                    <button class="delete-btn" onclick="giftManager.deleteGift(${gift.id})">Delete</button>
                </div>
            </div>
        `;
    }

    getReminderIcon(gift) {
        if (!gift.reminderDate) return '';
        
        const reminderDate = new Date(gift.reminderDate);
        const today = new Date();
        const daysDiff = Math.ceil((reminderDate - today) / (1000 * 60 * 60 * 24));
        
        // Show reminder icon if event is within 30 days
        if (daysDiff <= 30 && daysDiff >= 0) {
            const iconMap = {
                'birthday': '🎂',
                'anniversary': '💕',
                'holiday': '🎄',
                'other': '⏰'
            };
            
            const icon = iconMap[gift.eventType] || '⏰';
            const urgencyClass = daysDiff <= 7 ? 'urgent' : '';
            const title = `${this.capitalizeFirst(gift.eventType)} reminder - ${daysDiff} days left`;
            
            return `<div class="reminder-icon ${urgencyClass}" title="${title}">${icon}</div>`;
        }
        
        return '';
    }

    editGift(id) {
        const gift = this.gifts.find(g => g.id === id);
        if (!gift) return;
        
        // Populate form with gift data
        document.getElementById('gift-name').value = gift.name;
        document.getElementById('gift-description').value = gift.description || '';
        document.getElementById('recipient').value = gift.recipient;
        document.getElementById('reminder-date').value = gift.reminderDate || '';
        document.getElementById('event-type').value = gift.eventType || '';
        
        // Remove the gift temporarily (will be re-added when form is submitted)
        this.deleteGift(id);
        
        // Scroll to form
        document.querySelector('.add-gift-section').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('gift-name').focus();
        
        this.showNotification('Gift loaded for editing', 'info');
    }

    deleteGift(id) {
        this.gifts = this.gifts.filter(g => g.id !== id);
        this.saveGifts();
        this.renderGifts();
        this.showNotification('Gift deleted successfully', 'success');
    }

    attachGiftEventListeners() {
        // Event listeners are handled via onclick attributes in the HTML
        // This method can be used for additional event listeners if needed
    }

    checkReminders() {
        const today = new Date();
        const upcomingReminders = this.gifts.filter(gift => {
            if (!gift.reminderDate) return false;
            
            const reminderDate = new Date(gift.reminderDate);
            const daysDiff = Math.ceil((reminderDate - today) / (1000 * 60 * 60 * 24));
            
            return daysDiff <= 7 && daysDiff >= 0;
        });

        if (upcomingReminders.length > 0) {
            this.showReminderNotifications(upcomingReminders);
        }
    }

    showReminderNotifications(reminders) {
        reminders.forEach(gift => {
            const reminderDate = new Date(gift.reminderDate);
            const today = new Date();
            const daysDiff = Math.ceil((reminderDate - today) / (1000 * 60 * 60 * 24));
            
            let message = '';
            if (daysDiff === 0) {
                message = `Today is ${gift.recipient}'s ${gift.eventType}! Don't forget: ${gift.name}`;
            } else if (daysDiff === 1) {
                message = `Tomorrow is ${gift.recipient}'s ${gift.eventType}! Remember: ${gift.name}`;
            } else {
                message = `${daysDiff} days until ${gift.recipient}'s ${gift.eventType}! Gift idea: ${gift.name}`;
            }
            
            this.showNotification(message, 'reminder');
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    loadGifts() {
        try {
            const stored = localStorage.getItem('giftList');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading gifts:', error);
            return [];
        }
    }

    saveGifts() {
        try {
            localStorage.setItem('giftList', JSON.stringify(this.gifts));
        } catch (error) {
            console.error('Error saving gifts:', error);
            this.showNotification('Error saving data', 'error');
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Export gifts to JSON
    exportGifts() {
        const dataStr = JSON.stringify(this.gifts, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'gift-list.json';
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Gift list exported successfully', 'success');
    }

    // Import gifts from JSON
    importGifts(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedGifts = JSON.parse(e.target.result);
                if (Array.isArray(importedGifts)) {
                    this.gifts = importedGifts;
                    this.saveGifts();
                    this.renderGifts();
                    this.showNotification('Gift list imported successfully', 'success');
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                this.showNotification('Error importing file', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the gift list manager when the page loads
let giftManager;

document.addEventListener('DOMContentLoaded', () => {
    giftManager = new GiftListManager();
    
    // Add some additional interactive features
    addInteractiveFeatures();
});

function addInteractiveFeatures() {
    // Add search functionality
    addSearchFeature();
    
    // Add sort functionality
    addSortFeature();
    
    // Add keyboard shortcuts
    addKeyboardShortcuts();
}

function addSearchFeature() {
    const searchHTML = `
        <div class="search-container">
            <input type="text" id="search-input" placeholder="Search gifts..." class="search-input">
            <button id="clear-search" class="clear-search">×</button>
        </div>
    `;
    
    const giftListSection = document.querySelector('.gift-list-section h2');
    giftListSection.insertAdjacentHTML('afterend', searchHTML);
    
    const searchInput = document.getElementById('search-input');
    const clearSearch = document.getElementById('clear-search');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        filterGifts(query);
    });
    
    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        filterGifts('');
    });
}

function filterGifts(query) {
    const giftItems = document.querySelectorAll('.gift-item');
    
    giftItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(query)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function addSortFeature() {
    const sortHTML = `
        <div class="sort-container">
            <label for="sort-select">Sort by:</label>
            <select id="sort-select" class="sort-select">
                <option value="name">Name</option>
                <option value="recipient">Recipient</option>
                <option value="date">Date Added</option>
                <option value="reminder">Reminder Date</option>
            </select>
        </div>
    `;
    
    const searchContainer = document.querySelector('.search-container');
    searchContainer.insertAdjacentHTML('afterend', sortHTML);
    
    const sortSelect = document.getElementById('sort-select');
    sortSelect.addEventListener('change', (e) => {
        sortGifts(e.target.value);
    });
}

function sortGifts(criteria) {
    giftManager.gifts.sort((a, b) => {
        switch (criteria) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'recipient':
                return a.recipient.localeCompare(b.recipient);
            case 'date':
                return new Date(b.dateAdded) - new Date(a.dateAdded);
            case 'reminder':
                if (!a.reminderDate && !b.reminderDate) return 0;
                if (!a.reminderDate) return 1;
                if (!b.reminderDate) return -1;
                return new Date(a.reminderDate) - new Date(b.reminderDate);
            default:
                return 0;
        }
    });
    
    giftManager.renderGifts();
}

function addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + N: Focus on gift name input
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            document.getElementById('gift-name').focus();
        }
        
        // Ctrl/Cmd + F: Focus on search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.focus();
        }
    });
}

