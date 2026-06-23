const API_BASE = "https://5tawzbvqwf.execute-api.us-east-1.amazonaws.com/SrsPottuh";

document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart from localStorage or empty array
    let cart = JSON.parse(localStorage.getItem('ticketCart')) || [];
    let countdownSeconds = 300;
    
    console.log('DOM Loaded. Initial cart from localStorage:', cart);
    console.log('Cart length:', cart.length);
    
    // Ticket inventory
    const ticketInventory = {
        general: 0,
        vip: 0,
        student: 0
    };
    
    const ticketPrices = {
        general: 299,
        vip: 599,
        student: 149
    };
    
    const maxTickets = {
        general: 4,
        vip: 2,
        student: 2
    };
    
    const countdownEl = document.getElementById('countdown');
    let countdownTimer;
    
    // Store removeFromCart globally BEFORE initPage
    window.removeFromCart = async function(index) {
        console.log('REMOVEFROMCART CALLED - Index:', index);
        console.log('Current cart before removal:', cart);
        
        if (index >= 0 && index < cart.length) {
            const item = cart[index];
            const userId = localStorage.getItem('userId');
            
            console.log('Removing item:', item);
            
            // Call API to release tickets
            try {
                await fetch(`${API_BASE}/cartRelease`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ticketType: item.type,
                        quantity: item.quantity,
                        userId: userId,
                        reservationId: item.reservationId
                    })
                });
            } catch (error) {
                console.error('Error releasing tickets:', error);
            }
            
            // Return tickets to inventory
            ticketInventory[item.type] += item.quantity;
            
            // Remove from cart
            cart.splice(index, 1);
            
            // Save updated cart
            localStorage.setItem('ticketCart', JSON.stringify(cart));
            console.log('Cart after removal:', cart);
            
            // Update UI
            updateAvailability();
            loadCart();
        } else {
            console.error('Invalid index for removeFromCart:', index);
        }
    };
    
    initPage();
    
    async function initPage() {
        console.log('=== INIT PAGE STARTED ===');
        console.log('Cart at init:', cart);
        console.log('Cart stringified:', JSON.stringify(cart));
        
        // Start countdown
        startCountdown();
        
        // Load inventory from API
        await loadInventoryFromBackend();
        
        // Set up event listeners
        setupEventListeners();
        
        // Check if user still has access
        const userId = localStorage.getItem('userId');
        if (!userId) {
            alert('Your access has expired. Please rejoin the queue.');
            window.location.href = 'index.html';
        }
        
        // Display cart immediately
        console.log('Calling loadCart() from initPage...');
        loadCart();
        console.log('=== INIT PAGE COMPLETED ===');
    }
    
    async function loadInventoryFromBackend() {
        try {
            const response = await fetch(`${API_BASE}/ticketInventory`);
            const data = await response.json();
            
            Object.assign(ticketInventory, data);
            updateAvailability();
        } catch (err) {
            alert("Failed to load ticket inventory");
            console.error(err);
        }
    }
    
    function startCountdown() {
        if (countdownTimer) {
            clearInterval(countdownTimer);
        }
        
        updateCountdownDisplay();
        
        countdownTimer = setInterval(() => {
            countdownSeconds--;
            updateCountdownDisplay();
            
            if (countdownSeconds <= 0) {
                clearInterval(countdownTimer);
                handleTimeExpired();
            }
        }, 1000);
    }
    
    function updateCountdownDisplay() {
        if (countdownEl) {
            const minutes = Math.floor(countdownSeconds / 60);
            const seconds = countdownSeconds % 60;
            countdownEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (countdownSeconds < 60) {
                countdownEl.style.color = '#e74c3c';
                countdownEl.style.animation = countdownSeconds % 2 === 0 ? 'none' : 'pulse 1s infinite';
            }
        }
    }
    
    async function handleTimeExpired() {
        const userId = localStorage.getItem('userId');
      if (userId) {
        try {
            // Fire and forget - don't wait for response
            fetch(`${API_BASE}/leaveQueue`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ userId })
            })
            .then(response => {
                if (!response.ok) {
                    console.log('leaveQueue returned error (user may already be removed):', response.status);
                } else {
                    console.log('Successfully left queue');
                }
            })
            .catch(error => {
                console.log('Network error calling leaveQueue (likely user already TTL-ed):', error);
            });
        } catch (error) {
            console.log('Error in leaveQueue call:', error);
        }
    }
    
        // Try to release tickets if cart has items
        if (cart.length > 0 && userId) {
            try {
                cart.forEach(item => {
                    fetch(`${API_BASE}/cartRelease`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            ticketType: item.type,
                            quantity: item.quantity,
                            userId: userId
                        })
                    }).catch(err => console.log('Auto-release failed:', err));
                });
            } catch (error) {
                console.log('Error in auto-release:', error);
            }
        }
        
        localStorage.removeItem('userId');
        localStorage.removeItem('ticketCart');
        alert('Your time to purchase has expired. Any reserved tickets have been released.');
        window.location.href = 'index.html';
    }
    
    async function updateAvailability() {
        try {
            const response = await fetch(`${API_BASE}/ticketInventory`);
            const data = await response.json();
            
            ticketInventory.general = data.general || 0;
            ticketInventory.vip = data.vip || 0;
            ticketInventory.student = data.student || 0;
            
            for (const [type, available] of Object.entries(ticketInventory)) {
                const availableEl = document.getElementById(`${type}-availability`);
                if (availableEl) {
                    availableEl.textContent = `${available} tickets remaining`;
                }
                
                const addBtn = document.querySelector(`[data-ticket="${type}"]`);
                const qtyBtns = document.querySelectorAll(`[data-ticket="${type}"].qty-btn`);
                
                if (available <= 0) {
                    if (addBtn) {
                        addBtn.disabled = true;
                        addBtn.innerHTML = '<i class="fas fa-times-circle"></i> Sold Out';
                        addBtn.classList.add('disabled');
                    }
                    
                    qtyBtns.forEach(btn => btn.disabled = true);
                } else {
                    if (addBtn) {
                        addBtn.disabled = false;
                        addBtn.innerHTML = `Add to Cart`;
                        addBtn.classList.remove('disabled');
                    }
                    qtyBtns.forEach(btn => btn.disabled = false);
                    
                    const cartQty = cart
                        .filter(item => item.type === type)
                        .reduce((sum, item) => sum + item.quantity, 0);
                    
                    qtyBtns.forEach(btn => {
                       // In the updateAvailability function, update this part:
if (btn.classList.contains('plus')) {
    const currentInputQty = parseInt(document.getElementById(`${type}-qty`).value) || 1;
    const wouldExceedLimit = (cartQty + currentInputQty + 1) > maxTickets[type];
    btn.disabled = wouldExceedLimit;
    
    // Visual feedback
    if (btn.disabled) {
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
    } else {
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
    }
}
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching ticket availability:', error);
        }
    }
    
    function setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Quantity buttons
        document.querySelectorAll('.qty-btn').forEach(button => {
            button.addEventListener('click', function() {
                const ticketType = this.getAttribute('data-ticket');
                const isPlus = this.classList.contains('plus');
                updateQuantity(ticketType, isPlus);
            });
        });
        
        // Add to cart buttons
        document.querySelectorAll('.btn-add-cart').forEach(button => {
            button.addEventListener('click', function() {
                if (this.disabled) return;
                const ticketType = this.getAttribute('data-ticket');
                addToCart(ticketType);
            });
        });
        
        // Clear cart button
        const clearCartBtn = document.getElementById('clear-cart');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', clearCart);
        }
        
        // Proceed to checkout button
        const checkoutBtn = document.getElementById('proceed-checkout');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', function() {
                console.log('Proceed to checkout clicked. Cart:', cart);
                if (cart.length === 0) {
                    alert('Your cart is empty. Please add tickets first.');
                    return;
                }
                document.querySelector('.checkout-section').scrollIntoView({ behavior: 'smooth' });
            });
        }
        
        // Complete purchase button
        const purchaseBtn = document.getElementById('complete-purchase');
        if (purchaseBtn) {
            purchaseBtn.addEventListener('click', completePurchase);
        }
        
        // Close modal button
        const closeModalBtn = document.getElementById('close-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', function() {
                document.getElementById('success-modal').style.display = 'none';
                localStorage.removeItem('userId');
                localStorage.removeItem('ticketCart');
                window.location.href = 'index.html';
            });
        }
        
        // Warn user if they try to leave the page
        window.addEventListener('beforeunload', function(e) {
            if (cart.length > 0) {
                e.preventDefault();
                e.returnValue = 'You have items in your cart. If you leave, your progress may be lost.';
                return e.returnValue;
            }
        });
    }
    
    function updateQuantity(ticketType, isIncrease) {
        const qtyInput = document.getElementById(`${ticketType}-qty`);
        if (!qtyInput) return;
        
        let currentQty = parseInt(qtyInput.value);
        const maxQty = maxTickets[ticketType];
        
        if (isIncrease) {
            const cartQty = cart.filter(item => item.type === ticketType)
                               .reduce((sum, item) => sum + item.quantity, 0);
            
            if (currentQty < maxQty && (cartQty + currentQty) < maxQty) {
                qtyInput.value = currentQty + 1;
            }
        } else {
            if (currentQty > 1) {
                qtyInput.value = currentQty - 1;
            }
        }
        
        updateQtyButtons(ticketType);
    }
    
    function updateQtyButtons(ticketType) {
        const qtyInput = document.getElementById(`${ticketType}-qty`);
        if (!qtyInput) return;
        
        const currentQty = parseInt(qtyInput.value);
        const maxQty = maxTickets[ticketType];
        
        const minusBtn = document.querySelector(`[data-ticket="${ticketType}"].minus`);
        const plusBtn = document.querySelector(`[data-ticket="${ticketType}"].plus`);
        
        if (minusBtn) {
        minusBtn.disabled = currentQty <= 1;
        
        // Update visual state
        if (minusBtn.disabled) {
            minusBtn.style.opacity = "0.5";
            minusBtn.style.cursor = "not-allowed";
        } else {
            minusBtn.style.opacity = "1";
            minusBtn.style.cursor = "pointer";
        }
    }
       if (plusBtn) {
        const cartQty = cart.filter(item => item.type === ticketType)
                           .reduce((sum, item) => sum + item.quantity, 0);
        
        // Check if adding one more would exceed the limit
        const wouldExceedLimit = (cartQty + currentQty + 1) > maxQty;
        const atMaxInput = currentQty >= maxQty;
        
        plusBtn.disabled = wouldExceedLimit || atMaxInput;
        
        // Update visual state
        if (plusBtn.disabled) {
            plusBtn.style.opacity = "0.5";
            plusBtn.style.cursor = "not-allowed";
        } else {
            plusBtn.style.opacity = "1";
            plusBtn.style.cursor = "pointer";
        }
    }
}
    
    async function addToCart(ticketType) {
    console.log('=== ADD TO CART STARTED ===');
    console.log('Ticket type:', ticketType);
    
    const qtyInput = document.getElementById(`${ticketType}-qty`);
    if (!qtyInput) {
        console.error('Quantity input not found for:', ticketType);
        return;
    }
    
    const quantity = parseInt(qtyInput.value);
    const available = ticketInventory[ticketType];
    const maxPerOrder = maxTickets[ticketType];
    
    console.log('Quantity:', quantity, 'Available:', available, 'Max per order:', maxPerOrder);
    console.log('Current cart before adding:', cart);
    
    // Quantity already in cart
    const existingQty = cart
        .filter(item => item.type === ticketType)
        .reduce((sum, item) => sum + item.quantity, 0);
    
    console.log('Existing quantity in cart:', existingQty);
    
    // Inventory check
    if (existingQty + quantity > available) {
        alert(`Only ${available} ${getTicketName(ticketType)} tickets are available.`);
        return;
    }
    
    // Max per order check
    if (existingQty + quantity > maxPerOrder) {
        alert(`You can only purchase ${maxPerOrder} ${getTicketName(ticketType)} tickets per order.`);
        return;
    }
    
    // Call backend to reserve tickets
    const userId = localStorage.getItem('userId');
    try {
        console.log('Calling backend addToCart API...');
        const response = await fetch(`${API_BASE}/addToCart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                ticketType,
                quantity
            })
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        const data = await response.json();
        console.log('Backend response data:', data);
        console.log('Backend response stringified:', JSON.stringify(data));
        
        // Check if backend call was successful
        if (!response.ok) {
            const errorMsg = data.message || `Server error: ${response.status}`;
            alert(errorMsg);
            console.error('Backend error:', errorMsg);
            return;
        }
        
        // SIMPLIFIED: JUST ADD TO CART REGARDLESS OF BACKEND RESPONSE
        const ticketName = getTicketName(ticketType);
        const price = ticketPrices[ticketType];
        const totalPrice = price * quantity;
        
        // Check if this ticket type already exists in cart
        const existingIndex = cart.findIndex(item => item.type === ticketType);
        
        if (existingIndex > -1) {
            // Update existing item
            cart[existingIndex].quantity += quantity;
            cart[existingIndex].totalPrice = cart[existingIndex].price * cart[existingIndex].quantity;
            console.log('Updated existing cart item:', cart[existingIndex]);
        } else {
            // Add new item
            const newItem = {
                type: ticketType,
                name: ticketName,
                price: price,
                quantity: quantity,
                totalPrice: totalPrice,
                reservationId: `frontend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            };
            cart.push(newItem);
            console.log('Added new cart item:', newItem);
        }
        
        console.log('Cart after adding:', cart);
        console.log('Cart array length after adding:', cart.length);
        
        // Reduce local inventory
        ticketInventory[ticketType] -= quantity;
        
        // Save to localStorage IMMEDIATELY
        localStorage.setItem('ticketCart', JSON.stringify(cart));
        const savedCart = JSON.parse(localStorage.getItem('ticketCart'));
        console.log('Saved to localStorage. Cart in localStorage:', savedCart);
        console.log('LocalStorage cart length:', savedCart ? savedCart.length : 0);
        
        // Update UI
        updateAvailability();
        updateQtyButtons(ticketType);
        
        // CRITICAL: Make sure loadCart is called
        console.log('Calling loadCart()...');
        loadCart();
        
        alert(`${quantity} ${ticketName} ${quantity > 1 ? 'tickets' : 'ticket'} added to cart!`);
        qtyInput.value = 1;
        updateQtyButtons(ticketType);
        
        // Scroll to cart section
        const cartSection = document.querySelector('.cart-summary');
        if (cartSection) {
            cartSection.scrollIntoView({ behavior: 'smooth' });
        }
        
    } catch (err) {
        console.error('Error in addToCart:', err);
        alert('Failed to add to cart. Please try again.');
    }
    console.log('=== ADD TO CART COMPLETED ===');
}
    
    function getTicketName(type) {
        const names = {
            general: 'General Admission',
            vip: 'VIP Pass',
            student: 'Student Pass'
        };
        return names[type] || type;
    }
    
    function loadCart() {
        console.log('=== LOAD CART STARTED ===');
        console.log('Current cart array:', cart);
        console.log('Cart array length:', cart.length);
        console.log('Cart stringified:', JSON.stringify(cart));
        
        const cartItemsEl = document.getElementById('cart-items');
        const emptyCartEl = document.getElementById('empty-cart-message');
        const cartTotalSection = document.getElementById('cart-total-section');
        
        console.log('Cart elements found:');
        console.log('- cart-items:', cartItemsEl);
        console.log('- empty-cart-message:', emptyCartEl);
        console.log('- cart-total-section:', cartTotalSection);
        
        if (!cartItemsEl || !emptyCartEl || !cartTotalSection) {
            console.error('One or more cart elements are missing!');
            return;
        }
        
        if (cart.length === 0) {
            console.log('Cart is empty - showing empty message');
            cartItemsEl.innerHTML = '';
            emptyCartEl.style.display = 'block';
            cartTotalSection.style.display = 'none';
            console.log('=== LOAD CART COMPLETED (EMPTY) ===');
            return;
        }
        
        console.log('Cart has items - building display');
        emptyCartEl.style.display = 'none';
        
        let cartHTML = '';
        let subtotal = 0;
        
        cart.forEach((item, index) => {
            console.log(`Processing item ${index}:`, item);
            cartHTML += `
                <div class="cart-item" data-index="${index}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>${item.quantity} x $${item.price.toFixed(2)} each</p>
                        ${item.reservationId ? `<p class="reservation-id"><small>Res: ${item.reservationId.substring(0, 8)}...</small></p>` : ''}
                    </div>
                    <div class="cart-item-price">
                        $${item.totalPrice.toFixed(2)}
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            subtotal += item.totalPrice;
        });
        
        console.log('Generated cart HTML:', cartHTML);
        cartItemsEl.innerHTML = cartHTML;
        console.log('Cart HTML inserted into DOM');
        
        // Calculate fees and total
        const fee = subtotal * 0.05;
        const total = subtotal + fee;
        
        console.log('Calculated totals - Subtotal:', subtotal, 'Fee:', fee, 'Total:', total);
        
        const subtotalEl = document.getElementById('cart-subtotal');
        const feeEl = document.getElementById('cart-fee');
        const totalEl = document.getElementById('cart-total');
        
        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (feeEl) feeEl.textContent = `$${fee.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
        
        cartTotalSection.style.display = 'block';
        console.log('Cart display updated successfully');
        console.log('=== LOAD CART COMPLETED ===');
    }
    
    async function clearCart() {
        if (cart.length === 0) return;
        
        if (!confirm('Are you sure you want to clear your cart? All selected tickets will be removed.')) {
            return;
        }
        
        const userId = localStorage.getItem('userId');
        
        try {
            const releasePromises = cart.map(item => {
                return fetch(`${API_BASE}/cartRelease`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ticketType: item.type,
                        quantity: item.quantity,
                        userId: userId,
                        reservationId: item.reservationId || null
                    })
                });
            });
            
            await Promise.all(releasePromises);
            
            cart = [];
            localStorage.setItem('ticketCart', JSON.stringify(cart));
            
            updateAvailability();
            loadCart();
            
            alert('Cart cleared successfully! All tickets have been released.');
            
        } catch (error) {
            console.error('Error clearing cart:', error);
            alert('Error clearing cart, but local cart has been cleared.');
            
            cart = [];
            localStorage.setItem('ticketCart', JSON.stringify(cart));
            loadCart();
        }
    }
    
    async function completePurchase() {
        console.log('=== COMPLETE PURCHASE STARTED ===');
        console.log('Cart at purchase time:', cart);
        console.log('Cart length:', cart.length);
        
        if (cart.length === 0) {
            alert('Your cart is empty. Please add tickets before purchasing.');
            return;
        }
        
        const userId = localStorage.getItem('userId');
        
        try {
            const purchaseData = {
                userId: userId,
                tickets: cart,
                total: parseFloat(document.getElementById('cart-total').textContent.replace('$', ''))
            };
            
            console.log('Sending purchase data:', purchaseData);
            
            const response = await fetch(`${API_BASE}/purchaseTickets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(purchaseData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
  const orderId = result.orderId;

if (!orderId) {
    console.error('Backend did not return orderId!');
    alert('Purchase completed but no order ID received.');
    return;
}

// SAVE DATA FOR THANK YOU PAGE (USE sessionStorage)
sessionStorage.setItem('purchaseCompleted', 'true');
sessionStorage.setItem('orderId', orderId);
sessionStorage.setItem(
    'orderTotal',
    purchaseData.total.toFixed(2)
);
sessionStorage.setItem('userId', userId);

                document.getElementById('success-modal').style.display = 'flex';
        
                clearInterval(countdownTimer);
                
                localStorage.removeItem('ticketCart');
                cart = [];
                setTimeout(() => {
        window.location.href = 'thankyou.html';
    }, 3000);
                
                try {
                    await fetch(`${API_BASE}/leaveQueue`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId })
                    });
                } catch (error) {
                    console.error('Failed to leave queue automatically:', error);
                }
                
            } else {
                alert(`Purchase failed: ${result.message || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.error('Purchase error:', error);
            alert('Error processing purchase. Please try again.');
        }
        console.log('=== COMPLETE PURCHASE COMPLETED ===');
    }
    
    // Initialize quantity buttons
    document.querySelectorAll('.qty-input').forEach(input => {
        const ticketType = input.id.replace('-qty', '');
        updateQtyButtons(ticketType);
    });
});