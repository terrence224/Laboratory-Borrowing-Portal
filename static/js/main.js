// This file will contain common JavaScript functions used across the application

// Function to show a toast notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show the notification
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    // Hide and remove the notification after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
  
  // Add event listeners when the document loads
  document.addEventListener('DOMContentLoaded', function() {
    // Any global event listeners can be added here
    console.log('Laboratory Equipment Borrowing System loaded');
  });