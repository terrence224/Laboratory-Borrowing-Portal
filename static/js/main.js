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





// items_display.html

// Global variables for the items display page
let borrowingCart = [];
let isCartVisible = true;

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

// Try different image formats based on item category
function tryNextImageFormat(imgElement, basename, category) {
  // Try these extensions in order
  const extensions = ['jpg', 'jpeg', 'png', 'jfif', 'gif'];
  
  // Extract current extension from src
  const currentSrc = imgElement.src;
  const currentExt = currentSrc.split('.').pop().toLowerCase();
  
  // Find index of current extension
  let currentExtIndex = extensions.indexOf(currentExt);
  if (currentExtIndex === -1) currentExtIndex = -1; // If not found, start from beginning
  
  // Get the appropriate folder
  let folder = category.toLowerCase();
  
  // Try each extension systematically
  let attempted = 0;
  const tryNextExt = function() {
    attempted++;
    if (attempted >= extensions.length) {
      // We've tried all extensions, show placeholder
      const container = imgElement.parentElement;
      container.innerHTML = `<div class="image-placeholder">
        <i>📷</i>
      </div>`;
      console.log(`Failed to load image ${basename} with any extension`);
      return;
    }
    
    // Calculate next extension index
    const nextIndex = (currentExtIndex + attempted) % extensions.length;
    const nextExt = extensions[nextIndex];
    
    // Try loading with this extension
    console.log(`Trying ${basename}.${nextExt}`);
    imgElement.src = `/static/img/${folder}/${basename}.${nextExt}`;
    imgElement.onerror = function() {
      this.onerror = null;
      tryNextExt();
    };
  };
  
  // Start trying extensions
  tryNextExt();
}

// Quantity selector functions
function decrementQuantity(itemId) {
  const inputElement = document.getElementById(`quantity-${itemId}`);
  let value = parseInt(inputElement.value);
  if (value > 1) {
    inputElement.value = value - 1;
  }
}

function incrementQuantity(itemId, maxQuantity) {
  const inputElement = document.getElementById(`quantity-${itemId}`);
  let value = parseInt(inputElement.value);
  if (value < maxQuantity) {
    inputElement.value = value + 1;
  }
}

// Add item to cart
function addToCart(itemId, itemName, availableQuantity) {
  const quantityInput = document.getElementById(`quantity-${itemId}`);
  const quantity = parseInt(quantityInput.value);
  
  if (quantity < 1 || quantity > availableQuantity) {
    showNotification('Invalid quantity selected', 'error');
    return;
  }
  
  // Check if item already exists in cart
  const existingItemIndex = borrowingCart.findIndex(item => item.id === itemId);
  
  if (existingItemIndex >= 0) {
    // Update quantity if item exists
    borrowingCart[existingItemIndex].quantity += quantity;
    showNotification(`Updated quantity for ${itemName}`, 'success');
  } else {
    // Add new item to cart
    borrowingCart.push({
      id: itemId,
      name: itemName,
      quantity: quantity
    });
    showNotification(`Added ${itemName} to cart`, 'success');
  }
  
  // Reset quantity input to 1
  quantityInput.value = 1;
  
  // Update cart UI and save to session storage
  updateCartUI();
  saveCartToSession();
}

// Remove item from cart
function removeFromCart(itemId) {
  borrowingCart = borrowingCart.filter(item => item.id !== itemId);
  updateCartUI();
  saveCartToSession();
  showNotification('Item removed from cart', 'info');
}

// Empty the cart
function emptyCart() {
  if (borrowingCart.length === 0) return;
  
  if (confirm('Are you sure you want to empty your borrowing cart?')) {
    borrowingCart = [];
    updateCartUI();
    saveCartToSession();
    showNotification('Cart emptied', 'info');
  }
}

// Update cart UI
function updateCartUI() {
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartCount = document.getElementById('cart-count');
  const proceedButton = document.getElementById('proceed-button');
  
  // Update cart count
  cartCount.textContent = borrowingCart.length;
  
  // Update proceed button state
  proceedButton.disabled = borrowingCart.length === 0;
  
  // Clear container
  cartItemsContainer.innerHTML = '';
  
  if (borrowingCart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="no-items-message">Your cart is empty</p>';
    return;
  }
  
  // Add items to container
  borrowingCart.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'cart-item';
    itemElement.innerHTML = `
      <div class="cart-item-name">${item.name}</div>
      <div class="cart-item-quantity">x${item.quantity}</div>
      <button class="remove-item" onclick="removeFromCart('${item.id}')">✕</button>
    `;
    cartItemsContainer.appendChild(itemElement);
  });
}

// Save cart to session storage
function saveCartToSession() {
  sessionStorage.setItem('borrowingCart', JSON.stringify(borrowingCart));
}

// Proceed to borrow
function proceedToBorrow() {
  if (borrowingCart.length === 0) {
    showNotification('Your cart is empty', 'error');
    return;
  }
  
  // Redirect to borrowing form page with cart data
  const cartData = encodeURIComponent(JSON.stringify(borrowingCart));
  window.location.href = `/borrower/request?cart=${cartData}`;
}

// Search functionality
function searchItems() {
  const searchInput = document.getElementById('search-input');
  const searchTerm = searchInput.value.toLowerCase().trim();
  
  const itemCards = document.querySelectorAll('.item-card');
  const categorySections = document.querySelectorAll('.category-section');
  
  // Reset visibility
  categorySections.forEach(section => {
    section.style.display = 'block';
  });
  
  if (searchTerm === '') {
    // Show all items if search is empty
    itemCards.forEach(card => {
      card.style.display = 'block';
    });
    return;
  }
  
  // Hide/show items based on search
  let visibleItemsCount = {};
  
  itemCards.forEach(card => {
    const itemName = card.getAttribute('data-item-name').toLowerCase();
    const categoryId = card.closest('.category-section').getAttribute('data-category-id');
    
    if (itemName.includes(searchTerm)) {
      card.style.display = 'block';
      visibleItemsCount[categoryId] = (visibleItemsCount[categoryId] || 0) + 1;
    } else {
      card.style.display = 'none';
    }
  });
  
  // Hide categories with no visible items
  categorySections.forEach(section => {
    const categoryId = section.getAttribute('data-category-id');
    if (!visibleItemsCount[categoryId] || visibleItemsCount[categoryId] === 0) {
      section.style.display = 'none';
    }
  });
}

// Clear search
function clearSearch() {
  const searchInput = document.getElementById('search-input');
  searchInput.value = '';
  searchItems(); // This will reset visibility
}

// Initialize items display page
function initItemsDisplay() {
  // Load cart from session storage if available
  const savedCart = sessionStorage.getItem('borrowingCart');
  if (savedCart) {
    borrowingCart = JSON.parse(savedCart);
    updateCartUI();
  }

  // Set up cart toggle
  const toggleCartBtn = document.getElementById('toggle-cart');
  const cartContent = document.getElementById('cart-content');
  
  if (toggleCartBtn && cartContent) {
    toggleCartBtn.addEventListener('click', function() {
      isCartVisible = !isCartVisible;
      cartContent.style.display = isCartVisible ? 'block' : 'none';
      toggleCartBtn.textContent = isCartVisible ? '▲' : '▼';
    });
  }
}

// Add event listeners when the document loads
document.addEventListener('DOMContentLoaded', function() {
  // Any global event listeners can be added here
  console.log('Laboratory Equipment Borrowing System loaded');
  
  // Initialize items display page if we're on that page
  if (document.getElementById('items-container')) {
    initItemsDisplay();
  }
});






