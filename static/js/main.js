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


// Try different image formats based on item category
function tryNextImageFormat(imgElement, basename, category) {
  // Try these extensions in order
  const extensions = ['jpg', 'jpeg', 'png', 'jfif'];
  
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
  
  // Populate Date Filed with current date
  const currentDate = new Date();
  document.getElementById('date_filed').value = formatDate(currentDate);
  
  // Set minimum for Date Needed
  const dateNeededInput = document.getElementById('date_needed');
  dateNeededInput.min = currentDate.toISOString().slice(0, 16);
  
  // Display cart items in the table
  displayCartInModal();
}

// Render cart items inside the items table in the modal
function displayCartInModal() {
  const tableBody = document.getElementById('items-table-body');
  tableBody.innerHTML = '';
  
  if (borrowingCart.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="11">No items in cart</td>';
    tableBody.appendChild(row);
    return;
  }
  
  // Create rows for each item in the cart
  borrowingCart.forEach(item => {
    const row = document.createElement('tr');
    
    // Create cells according to the table structure in the HTML
    // Item | Quantity | Student | Faculty | Custodian | Date | Time | Broken | Lost | Quantity | Remarks
    row.innerHTML = `
      <td style="text-align: left; padding-left: 10px;">${item.name}</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
    `;
    
    tableBody.appendChild(row);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const modal     = document.getElementById('borrower-form-modal');
  const cancelBtn = document.getElementById('cancel-form');
  const submitBtn = document.getElementById('submit-form');
  const form      = document.getElementById('borrower-form');

  
  if (!form || !submitBtn) {
    console.warn('Form or submit button not found.');
    return;
  }

  // Close modal handler
  cancelBtn?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.addEventListener('click', e => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Form submission handler
  submitBtn.addEventListener('click', async (e) => {
    e.preventDefault(); // 🔐 Prevent form from reloading the page

    // Basic form validation
    const laboratory  = document.querySelector('input[name="laboratory"]:checked');
    const studentName = document.getElementById('student_name').value;
    const subject     = document.getElementById('subject').value;
    const section     = document.getElementById('section').value;
    const dateNeeded  = document.getElementById('date_needed').value;

    if (!laboratory) {
      showNotification('Please select a laboratory', 'error');
      return;
    }

    if (!studentName) {
      showNotification('Please enter student name', 'error');
      return;
    }

    if (!subject) {
      showNotification('Please enter subject', 'error');
      return;
    }

    if (!section) {
      showNotification('Please enter section', 'error');
      return;
    }

    if (!dateNeeded) {
      showNotification('Please enter date/time needed', 'error');
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;

    try {
      const formData = new FormData(form);
      formData.append('borrower_name', studentName);
      formData.append('items', JSON.stringify(borrowingCart));

      const resp = await fetch('/submit_borrowing_request', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' },
        body: formData
      });

      let result;
      try {
        result = await resp.json();
      } catch {
        throw new Error('Server returned invalid JSON.');
      }

      if (!resp.ok) {
        throw new Error(result.message || 'Server error occurred');
      }

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












// Edit item function
function editItem(itemId) {
  // Fetch item data
  fetch(`/api/items/${itemId}`)
    .then(response => response.json())
    .then(item => {
      // Populate edit form
      document.getElementById('edit_item_id').value = item.id;
      document.getElementById('edit_item_name').value = item.name;
      document.getElementById('edit_category_id').value = item.category_id;
      document.getElementById('edit_total_quantity').value = item.total_quantity;
      document.getElementById('edit_available_quantity').value = item.available_quantity;
      document.getElementById('edit_status').value = item.status;
      
      // Show modal
      document.getElementById('edit-item-modal').style.display = 'block';
    })
    .catch(error => {
      console.error('Error fetching item data:', error);
      showNotification('Error loading item data', 'error');
    });
}

// Close edit item modal
function closeEditItemModal() {
  const modal = document.getElementById('edit-item-modal');
  modal.style.display = 'none';
}


// Get CSRF token for secure form submissions
function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}

// Validate quantity relationship
function validateQuantities(totalQuantity, availableQuantity) {
  const total = parseInt(totalQuantity);
  const available = parseInt(availableQuantity);
  
  if (isNaN(total) || isNaN(available)) {
    return false;
  }
  
  if (available > total) {
    showNotification('Available quantity cannot exceed total quantity', 'error');
    return false;
  }
  
  return true;
}


document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('edit-item-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Read values
    const itemId = document.getElementById('edit_item_id').value;
    const name = document.getElementById('edit_item_name').value.trim();
    const categoryId = parseInt(document.getElementById('edit_category_id').value, 10);
    const totalQty = parseInt(document.getElementById('edit_total_quantity').value, 10);
    const availQty = parseInt(document.getElementById('edit_available_quantity').value, 10);
    const status = document.getElementById('edit_status').value;

    // Validate quantities
    if (!validateQuantities(totalQty, availQty)) {
      return;
    }

    // Build payload
    const payload = {
      item_name: name,
      category_id: categoryId,
      total_quantity: totalQty,
      available_quantity: availQty,
      status: status
    };

    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify(payload)
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.message || 'Unknown error');
      }

      showNotification('Item updated successfully!', 'success');

      setTimeout(() => {
        window.location.reload();
      }, 2000); // 3000 milliseconds = 3 seconds
      
      closeEditItemModal();
    } catch (err) {
      console.error('Error updating item:', err);
      showNotification(`Update failed: ${err.message}`, 'error');
    }
  });
});

// Close modal .modal-content
window.onclick = function(event) {
  const modal = document.getElementById('edit-item-modal');
  // if the clicked element *is* the overlay (modal) itself, not its inner content
  if (event.target === modal) {
    closeEditItemModal();
  }
};















// Modal state management for edit mode
let isEditMode = false;
let selectedCell = null;
let isDragging = false;
let isResizing = false;
let isRotating = false;
let dragStartX, dragStartY, elementStartX, elementStartY;
let startAngle = 0;
let currentAngle = 0;
let resizeStartWidth, resizeStartHeight;

// Function to initialize the signature edit mode
function initializeSignatureEditMode() {
  // Create the signature editor controls
  const editorControls = document.createElement('div');
  editorControls.id = 'signature-editor-controls';
  editorControls.className = 'signature-editor-controls';
  editorControls.innerHTML = `
    <div class="editor-toolbar">
      <button id="toggle-edit-mode" class="btn btn-primary" type="button">Enable Signature Mode</button>
      <div id="editing-tools" style="display: none;">
        <button id="add-signature" class="btn btn-secondary" type="button">Add Signature</button>
        <button id="capture-signature" class="btn btn-secondary" type="button">Draw Signature</button>
        <button id="exit-edit-mode" class="btn btn-danger" type="button">Exit Signature Mode</button>
      </div>
    </div>
    <div id="signature-editor-modal" class="signature-modal">
      <div class="signature-modal-content">
        <span class="close-signature-modal">&times;</span>
        <h3>Create Your Signature</h3>
        <div class="signature-tabs">
          <button class="signature-tab-btn active" data-tab="draw" type="button">Draw</button>
          <button class="signature-tab-btn" data-tab="upload" type="button">Upload</button>
        </div>
        <div id="draw-tab" class="signature-tab-content">
          <canvas id="signature-pad" width="400" height="200"></canvas>
          <div class="signature-pad-controls">
            <button id="clear-pad" class="btn btn-secondary" type="button">Clear</button>
            <button id="save-signature" class="btn btn-primary" type="button">Save Signature</button>
          </div>
        </div>
        <div id="upload-tab" class="signature-tab-content" style="display: none;">
          <div class="upload-area">
            <input type="file" id="signature-file" accept="image/*">
            <p>or drag and drop an image here</p>
          </div>
          <div class="signature-upload-preview">
            <img id="uploaded-signature-preview" style="display: none;">
          </div>
          <button id="use-uploaded-signature" class="btn btn-primary" type="button" disabled>Use This Signature</button>
        </div>
      </div>
    </div>
  `;
  
  // Insert controls before the action buttons
  const actionButtons = document.querySelector('.action-buttons');
  actionButtons.parentNode.insertBefore(editorControls, actionButtons);
  
  // Initialize signature pad and event listeners
  setupSignatureEditMode();
}

// Setup signature edit mode functionality
function setupSignatureEditMode() {
  const toggleEditModeBtn = document.getElementById('toggle-edit-mode');
  const exitEditModeBtn = document.getElementById('exit-edit-mode');
  const editingTools = document.getElementById('editing-tools');
  const addSignatureBtn = document.getElementById('add-signature');
  const captureSignatureBtn = document.getElementById('capture-signature');
  const signatureModal = document.getElementById('signature-editor-modal');
  const closeModalBtn = document.querySelector('.close-signature-modal');
  const tabButtons = document.querySelectorAll('.signature-tab-btn');
  const clearPadBtn = document.getElementById('clear-pad');
  const saveSignatureBtn = document.getElementById('save-signature');
  const signatureFileInput = document.getElementById('signature-file');
  const uploadedPreview = document.getElementById('uploaded-signature-preview');
  const useUploadedBtn = document.getElementById('use-uploaded-signature');
  
  let currentSignature = null;
  let canvas, ctx;
  
  // Toggle edit mode
  toggleEditModeBtn.addEventListener('click', () => {
    isEditMode = true;
    toggleEditModeBtn.style.display = 'none';
    editingTools.style.display = 'flex';
    
    // Add editable class to signature cells
    const signatureCells = document.querySelectorAll('#items-table-body tr td:nth-child(3), #items-table-body tr td:nth-child(4), #items-table-body tr td:nth-child(5)');
    signatureCells.forEach(cell => {
      cell.classList.add('editable-cell');
      cell.addEventListener('click', selectCell);
    });
  });
  
  // Exit edit mode
  exitEditModeBtn.addEventListener('click', () => {
    isEditMode = false;
    toggleEditModeBtn.style.display = 'block';
    editingTools.style.display = 'none';
    
    // Remove editable class from cells
    const editableCells = document.querySelectorAll('.editable-cell');
    editableCells.forEach(cell => {
      cell.classList.remove('editable-cell');
      cell.classList.remove('selected-cell');
      cell.removeEventListener('click', selectCell);
    });
    
    selectedCell = null;
  });
  
  // Select a cell for editing
  function selectCell(e) {
    if (!isEditMode) return;
    
    // Clear previous selection
    const previousSelected = document.querySelector('.selected-cell');
    if (previousSelected) {
      previousSelected.classList.remove('selected-cell');
    }
    
    selectedCell = e.currentTarget;
    selectedCell.classList.add('selected-cell');
  }
  
  // Show signature modal
  addSignatureBtn.addEventListener('click', () => {
    if (!selectedCell) {
      alert('Please select a signature cell first');
      return;
    }
    
    signatureModal.style.display = 'block';
    // Initialize tabs
    document.querySelector('.signature-tab-btn[data-tab="draw"]').click();
  });
  
  // Capture signature directly
  captureSignatureBtn.addEventListener('click', () => {
    if (!selectedCell) {
      alert('Please select a signature cell first');
      return;
    }
    
    signatureModal.style.display = 'block';
    document.querySelector('.signature-tab-btn[data-tab="draw"]').click();
  });
  
  // Close modal
  closeModalBtn.addEventListener('click', () => {
    signatureModal.style.display = 'none';
  });
  
  // Tab switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all tabs
      tabButtons.forEach(b => b.classList.remove('active'));
      
      // Hide all tab content
      document.querySelectorAll('.signature-tab-content').forEach(content => {
        content.style.display = 'none';
      });
      
      // Show the selected tab
      const tabId = btn.getAttribute('data-tab');
      btn.classList.add('active');
      document.getElementById(`${tabId}-tab`).style.display = 'block';
      
      // Initialize canvas if this is the draw tab
      if (tabId === 'draw') {
        initializeSignaturePad();
      }
    });
  });
  
  // Initialize signature pad
  function initializeSignaturePad() {
    canvas = document.getElementById('signature-pad');
    ctx = canvas.getContext('2d');
    let isDrawing = false;
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';
    
    // Drawing events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch support
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
    
    function startDrawing(e) {
      isDrawing = true;
      const pos = getPosition(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
    
    function draw(e) {
      if (!isDrawing) return;
      const pos = getPosition(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    
    function stopDrawing() {
      isDrawing = false;
    }
    
    function handleTouch(e) {
      e.preventDefault();
      const touch = e.touches[0];
      const type = e.type;
      
      if (type === 'touchstart') {
        startDrawing({ clientX: touch.clientX, clientY: touch.clientY });
      } else if (type === 'touchmove') {
        draw({ clientX: touch.clientX, clientY: touch.clientY });
      }
    }
    
    function getPosition(e) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  }
  
  // Clear signature pad
  clearPadBtn.addEventListener('click', () => {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });
  
  // Save drawn signature
  saveSignatureBtn.addEventListener('click', () => {
    currentSignature = canvas.toDataURL('image/png');
    insertSignatureIntoCell(currentSignature);
    signatureModal.style.display = 'none';
  });
  
  // Handle file input
  signatureFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
      uploadedPreview.src = event.target.result;
      uploadedPreview.style.display = 'block';
      useUploadedBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  });
  
  // Use uploaded signature
  useUploadedBtn.addEventListener('click', () => {
    currentSignature = uploadedPreview.src;
    insertSignatureIntoCell(currentSignature);
    signatureModal.style.display = 'none';
  });
  
  // Insert signature into selected cell
  function insertSignatureIntoCell(signatureData) {
    if (!selectedCell) return;
    
    // Create container div to allow dragging, resizing and rotating
    const container = document.createElement('div');
    container.className = 'signature-container';
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '100%';
    
    // Create signature wrapper for transformations
    const wrapper = document.createElement('div');
    wrapper.className = 'signature-wrapper';
    wrapper.style.position = 'absolute';
    wrapper.style.top = '50%';
    wrapper.style.left = '50%';
    wrapper.style.transform = 'translate(-50%, -50%)';
    wrapper.style.transformOrigin = 'center';
    
    // Create signature image
    const img = document.createElement('img');
    img.src = signatureData;
    img.className = 'signature-image';
    img.style.Width = '90%';
    img.style.Height = '50px';
    img.style.display = 'block';
    
    // Create controls for the signature
    const controls = document.createElement('div');
    controls.className = 'signature-controls';
    controls.style.display = isEditMode ? 'block' : 'none';
    
    // Create rotate handle
    const rotateHandle = document.createElement('div');
    rotateHandle.className = 'rotate-handle';
    rotateHandle.innerHTML = '↻';
    
    // Create resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    resizeHandle.innerHTML = '⤡';
    
    // Add event listeners for drag
    wrapper.addEventListener('mousedown', startDrag);
    
    // Add event listeners for rotate
    rotateHandle.addEventListener('mousedown', startRotate);
    
    // Add event listeners for resize
    resizeHandle.addEventListener('mousedown', startResize);
    
    // Add elements to the DOM
    controls.appendChild(rotateHandle);
    controls.appendChild(resizeHandle);
    wrapper.appendChild(img);
    wrapper.appendChild(controls);
    container.appendChild(wrapper);
    
    // Clear any previous content and add new signature
    selectedCell.innerHTML = '';
    selectedCell.appendChild(container);
  }
  
  // Start drag function
  function startDrag(e) {
    if (!isEditMode) return;
    if (e.target.classList.contains('rotate-handle') || e.target.classList.contains('resize-handle')) return;
    
    e.preventDefault();
    
    // Get the signature wrapper
    const wrapper = e.currentTarget;
    
    // Get initial positions
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    // Get current transforms
    const transform = window.getComputedStyle(wrapper).getPropertyValue('transform');
    const matrix = new DOMMatrix(transform);
    
    // Extract translation values from the matrix
    const transformValues = calculateTransformValues(wrapper);
    elementStartX = transformValues.translateX;
    elementStartY = transformValues.translateY;
    
    // Add document-level event listeners
    document.addEventListener('mousemove', dragElement);
    document.addEventListener('mouseup', stopDrag);
    
    // Add dragging class
    wrapper.classList.add('dragging');
    
    function dragElement(e) {
      if (!isDragging) return;
      
      // Calculate new position
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      
      // Apply new position while preserving rotation
      updateElementTransform(wrapper, {
        translateX: elementStartX + dx,
        translateY: elementStartY + dy,
        rotate: currentAngle,
        scaleX: transformValues.scaleX,
        scaleY: transformValues.scaleY
      });
    }
    
    function stopDrag() {
      if (!isDragging) return;
      
      isDragging = false;
      wrapper.classList.remove('dragging');
      document.removeEventListener('mousemove', dragElement);
      document.removeEventListener('mouseup', stopDrag);
    }
  }
  
  // Start rotate function
  function startRotate(e) {
    if (!isEditMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Get the signature wrapper
    const wrapper = e.currentTarget.closest('.signature-wrapper');
    
    // Initialize rotation
    isRotating = true;
    
    // Get the center of the wrapper
    const rect = wrapper.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate the starting angle
    startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    
    // Get current transform values
    const transformValues = calculateTransformValues(wrapper);
    currentAngle = transformValues.rotate || 0;
    
    // Add document-level event listeners
    document.addEventListener('mousemove', rotateElement);
    document.addEventListener('mouseup', stopRotate);
    
    // Add rotating class
    wrapper.classList.add('rotating');
    
    function rotateElement(e) {
      if (!isRotating) return;
      
      // Calculate the new angle
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const newAngle = currentAngle + (angle - startAngle) * (180 / Math.PI);
      
      // Apply the new rotation while preserving position and scale
      updateElementTransform(wrapper, {
        translateX: transformValues.translateX,
        translateY: transformValues.translateY,
        rotate: newAngle,
        scaleX: transformValues.scaleX,
        scaleY: transformValues.scaleY
      });
    }
    
    function stopRotate() {
      if (!isRotating) return;
      
      // Update the current angle for future rotations
      const transformValues = calculateTransformValues(wrapper);
      currentAngle = transformValues.rotate;
      
      isRotating = false;
      wrapper.classList.remove('rotating');
      document.removeEventListener('mousemove', rotateElement);
      document.removeEventListener('mouseup', stopRotate);
    }
  }
  
  // Start resize function
  function startResize(e) {
    if (!isEditMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Get the signature wrapper
    const wrapper = e.currentTarget.closest('.signature-wrapper');
    const img = wrapper.querySelector('.signature-image');
    
    // Initialize resizing
    isResizing = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    // Get current transform values
    const transformValues = calculateTransformValues(wrapper);
    resizeStartWidth = img.offsetWidth;
    resizeStartHeight = img.offsetHeight;
    
    // Add document-level event listeners
    document.addEventListener('mousemove', resizeElement);
    document.addEventListener('mouseup', stopResize);
    
    // Add resizing class
    wrapper.classList.add('resizing');
    
    function resizeElement(e) {
      if (!isResizing) return;
      
      // Calculate the scale based on mouse movement
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      
      // Determine the larger change for proportional scaling
      const scaleFactor = 1 + Math.max(dx, dy) / 100;
      
      // Apply the new width and height directly to the image
      img.style.width = `${resizeStartWidth * scaleFactor}px`;
      img.style.height = 'auto'; // Maintain aspect ratio
      
      // Apply transformation to maintain position and rotation
      updateElementTransform(wrapper, {
        translateX: transformValues.translateX,
        translateY: transformValues.translateY,
        rotate: transformValues.rotate,
        scaleX: transformValues.scaleX,
        scaleY: transformValues.scaleY
      });
    }
    
    function stopResize() {
      if (!isResizing) return;
      
      isResizing = false;
      wrapper.classList.remove('resizing');
      document.removeEventListener('mousemove', resizeElement);
      document.removeEventListener('mouseup', stopResize);
    }
  }
  
  // Helper function to calculate transform values
  function calculateTransformValues(element) {
    const style = window.getComputedStyle(element);
    const matrix = new DOMMatrix(style.transform);
    
    // Calculate rotation angle from the matrix
    const angleRad = Math.atan2(matrix.b, matrix.a);
    const angleDeg = angleRad * (180 / Math.PI);
    
    // Calculate scale factors
    const scaleX = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b);
    const scaleY = Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d);
    
    return {
      translateX: matrix.e,
      translateY: matrix.f,
      rotate: angleDeg,
      scaleX: scaleX,
      scaleY: scaleY
    };
  }
  
  // Helper function to update transform with specific values
  function updateElementTransform(element, values) {
    const transform = `translate(${values.translateX}px, ${values.translateY}px) rotate(${values.rotate}deg)`;
    element.style.transform = transform;
  }
}

// Adding drag and drop for the upload area
function setupDragAndDrop() {
  const uploadArea = document.querySelector('.upload-area');
  const fileInput = document.getElementById('signature-file');
  
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, unhighlight, false);
  });
  
  function highlight() {
    uploadArea.classList.add('highlight');
  }
  
  function unhighlight() {
    uploadArea.classList.remove('highlight');
  }
  
  uploadArea.addEventListener('drop', handleDrop, false);
  
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
      fileInput.files = files;
      // Trigger the change event
      const event = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(event);
    }
  }
}

// Add CSS for the signature editor
function addSignatureEditorStyles() {
  // Check if styles are already added
  if (document.getElementById('signature-editor-styles')) {
    return;
  }
  const styleSheet = document.createElement('style');
  styleSheet.id = 'signature-editor-styles';
  styleSheet.textContent = `
    .signature-editor-controls {
      margin-top: 20px;
      border-top: 1px solid #ddd;
      padding-top: 15px;
    }
    
    .editor-toolbar {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    #editing-tools {
      display: flex;
      gap: 10px;
    }
    
    .editable-cell {
      cursor: pointer;
      background-color: rgba(76, 175, 80, 0.05);
      transition: background-color 0.2s;
    }
    
    .editable-cell:hover {
      background-color: rgba(76, 175, 80, 0.1);
    }
    
    .selected-cell {
      background-color: rgba(76, 175, 80, 0.2) !important;
      box-shadow: inset 0 0 0 2px #4CAF50;
    }
    
    .signature-modal {
      display: none;
      position: fixed;
      z-index: 1100;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0,0,0,0.6);
    }
    
    .signature-modal-content {
      background-color: #fff;
      margin: 10% auto;
      width: 500px;
      max-width: 90%;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 0 20px rgba(0,0,0,0.3);
      position: relative;
    }
    
    .close-signature-modal {
      position: absolute;
      top: 10px;
      right: 15px;
      font-size: 24px;
      font-weight: bold;
      cursor: pointer;
    }
    
    .signature-tabs {
      display: flex;
      border-bottom: 1px solid #ddd;
      margin-bottom: 15px;
    }
    
    .signature-tab-btn {
      background: none;
      border: none;
      padding: 10px 15px;
      cursor: pointer;
      opacity: 0.6;
    }
    
    .signature-tab-btn.active {
      border-bottom: 2px solid #4CAF50;
      opacity: 1;
    }
    
    #signature-pad {
      width: 100%;
      height: 200px;
      border: 1px solid #ddd;
      background-color: white;
      margin-bottom: 10px;
    }
    
    .signature-pad-controls {
      display: flex;
      justify-content: space-between;
    }
    
    .upload-area {
      border: 2px dashed #ddd;
      padding: 20px;
      text-align: center;
      margin-bottom: 15px;
      cursor: pointer;
    }
    
    .upload-area.highlight {
      border-color: #4CAF50;
      background-color: rgba(76, 175, 80, 0.05);
    }
    
    .signature-upload-preview {
      display: flex;
      justify-content: center;
      margin: 15px 0;
      min-height: 100px;
    }
    
    #uploaded-signature-preview {
      max-width: 100%;
      max-height: 150px;
      border: 1px solid #ddd;
    }
    
    .signature-container {
      position: relative;
      width: 100%;
      height: 100%;
    }
    
    .signature-wrapper {
      position: absolute;
      cursor: move;
      transition: box-shadow 0.2s;
    }
    
    .signature-wrapper.dragging,
    .signature-wrapper.rotating,
    .signature-wrapper.resizing {
      z-index: 10;
      box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
    }
    
    .signature-controls {
      position: absolute;
      top: -20px;
      right: -20px;
      display: flex;
      gap: 5px;
    }
    
    .rotate-handle,
    .resize-handle {
      width: 20px;
      height: 20px;
      background-color: #4CAF50;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 12px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      transition: background-color 0.2s;
    }
    
    .rotate-handle:hover,
    .resize-handle:hover {
      background-color: #45a049;
      transform: scale(1.1);
    }
    
    /* Cursor styles */
    .rotate-handle {
      cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/></svg>'), auto;
    }
    
    .resize-handle {
      cursor: nwse-resize;
    }
  `;
  document.head.appendChild(styleSheet);
}

// Conditionally initialize the signature editor on specific Flask routes
function conditionallyInitializeSignatureEditor() {
  // 1. Grab the pathname (e.g. "/borrower/items_display")
  const currentPath = window.location.pathname.replace(/^\/|\/$/g, ''); 
  //    → "borrower/items_display"
  
  // 2. Derive both the full path and just the filename
  const fullPath = currentPath;                       
  const filename = fullPath.substring(fullPath.lastIndexOf('/') + 1);
  //    → "items_display"
  
  // 3. Define the routes/pages where the editor should load
  const targetFullPaths = [
    'borrower/items_display',        // your Flask route
    'custodian/approval'            // if you ever need a literal .html match
  ];
  const targetFileNames = [
    'items_display.html',            // in case you have static HTML
    'borrower_approval.html'
  ];
  
  // 4. Check if we're on a target page
  if (targetFullPaths.includes(fullPath) || targetFileNames.includes(filename)) {
    console.log('Initializing signature editor on target page:', fullPath || filename);
    initializeSignatureEditMode();
    addSignatureEditorStyles();
    
    // 5. Wait for the upload-area element to appear, then hook up drag-and-drop
    const observer = new MutationObserver((mutations, obs) => {
      if (document.querySelector('.upload-area')) {
        setupDragAndDrop();
        obs.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
  } else {
    console.log('Signature editor not loaded (not a target page):', fullPath);
  }
}

// 6. Run on DOM ready
document.addEventListener('DOMContentLoaded', conditionallyInitializeSignatureEditor);
