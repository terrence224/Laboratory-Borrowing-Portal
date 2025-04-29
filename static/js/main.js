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

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.category-section').forEach(function(section) {
    var title = section.querySelector('.category-title');
    var content = section.querySelector('.items-grid') || section.querySelector('.no-items-message');
    title.addEventListener('click', function() {
      if (content.style.display === 'none') {
        content.style.display = '';
        title.querySelector('.toggle-icon').textContent = '▼';
      } else {
        content.style.display = 'none';
        title.querySelector('.toggle-icon').textContent = '►';
      }
    });
  });
});





// Function to format a Date object as YYYY-MM-DD
function formatDate(date) {
  const day   = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year  = date.getFullYear();
  return `${year}-${month}-${day}`;
}

// Open modal, set dates, and show cart items
function proceedToBorrow() {
  if (borrowingCart.length === 0) {
    showNotification('Your cart is empty', 'error');
    return;
  }

  const modal = document.getElementById('borrower-form-modal');
  modal.style.display = 'block';

  // Populate Date Filed
  const currentDate = new Date();
  document.getElementById('date_filed').value = formatDate(currentDate);

  // Set minimum for Date Needed
  const dateNeededInput = document.getElementById('date_needed');
  dateNeededInput.min = currentDate.toISOString().slice(0, 16);

  displayCartInModal();
}

// Render cart items inside the modal
function displayCartInModal() {
  const container = document.getElementById('modal-cart-items');
  container.innerHTML = '';

  if (borrowingCart.length === 0) {
    container.innerHTML = '<p>No items in cart</p>';
    return;
  }

  borrowingCart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'modal-cart-item';
    div.innerHTML = `
      <div>${item.name}</div>
      <div>Quantity: ${item.quantity}</div>
    `;
    container.appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const modal    = document.getElementById('borrower-form-modal');
  const closeBtn = document.querySelector('.close-modal');
  const cancelBtn= document.getElementById('cancel-form');
  const form     = document.getElementById('borrower-form');

  // Close modal handlers
  closeBtn?.addEventListener('click', () => modal.style.display = 'none');
  cancelBtn?.addEventListener('click', () => modal.style.display = 'none');
  window.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // Form submission
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;

    try {
      const formData = new FormData(form);
      formData.append('items', JSON.stringify(borrowingCart));

      // include session cookie & ask explicitly for JSON
      const resp = await fetch('/submit_borrowing_request', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' },
        body: formData
       });

      // parse JSON (and catch if server accidentally sent HTML)
      let result;
      try {
        result = await resp.json();
      } catch {
        throw new Error('Server returned invalid JSON.');
      }

       // check for HTTP errors
      if (!resp.ok) {
        throw new Error(result.message || 'Server error occurred');
      }
       // check for application‐level errors
      if (!result.success) {
        throw new Error(result.message);
      }
      showNotification(result.message, 'success');
      borrowingCart = [];
      updateCartUI();
      saveCartToSession();
      modal.style.display = 'none';

    } catch (err) {
      console.error('Error:', err);
      showNotification(err.message, 'error');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
});