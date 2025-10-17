
let cart = [];

function addToCart(productName, price,) {
    const existingItem = cart.find(item => item.name === productName);

    if (existingItem) {
        existingItem.quantity += 1; 
    } else {
        cart.push({ name: productName, price: price, quantity: 1}); 
    }

    updateCart(); 
}

function updateCart() {
    const cartItems = document.getElementById('cart-items');
    const totalPrice = document.getElementById('total-price');
    cartItems.innerHTML = "";
    
    let total = 0;
    cart.forEach((item, index) => {
        let itemTotal = item.price * item.quantity;
        total += itemTotal;

        const li = document.createElement('li');
        li.classList.add('cart-item');
        
        const itemInfo = document.createElement('div');
        itemInfo.classList.add('item-info');
        itemInfo.textContent = `${item.name} - $${itemTotal.toFixed(2)}`;
        
        const quantityControls = document.createElement('div');
        quantityControls.classList.add('quantity-controls');
        
        const decrementBtn = document.createElement('button');
        decrementBtn.textContent = "-";
        decrementBtn.onclick = () => updateQuantity(index, -1);
        
        const quantitySpan = document.createElement('span');
        quantitySpan.textContent = item.quantity;
        quantitySpan.classList.add('quantity');
        
        const incrementBtn = document.createElement('button');
        incrementBtn.textContent = "+";
        incrementBtn.onclick = () => updateQuantity(index, 1);
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
        removeBtn.classList.add('remove-btn');
        removeBtn.onclick = () => removeFromCart(index);

        quantityControls.appendChild(decrementBtn);
        quantityControls.appendChild(quantitySpan);
        quantityControls.appendChild(incrementBtn);
        
        li.appendChild(itemInfo);
        li.appendChild(quantityControls);
        li.appendChild(removeBtn);
        cartItems.appendChild(li);
    });

    totalPrice.textContent = `$${total.toFixed(2)}`;
}


function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

function clearCart() {
    cart = [];
    updateCart();
}

function updateQuantity(index, change) {
    if (cart[index]) {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            removeFromCart(index);
        } else {
            updateCart();
        }
    }
}

function showConfirmModal() {
    const orderSummary = document.getElementById("order-summary");
    const modalTotalPrice = document.getElementById("modal-total-price");

    orderSummary.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        orderSummary.innerHTML = "<p>Your cart is empty!</p>";
        return;
    }

    const ul = document.createElement("ul");

       cart.forEach(item => {
        let itemTotal = item.price * item.quantity;
        total += itemTotal;

        const orderItem = document.createElement("p");
        orderItem.classList.add("order-item");
        orderItem.innerHTML = `
            <span class="order-name">${item.name} (x${item.quantity})</span>
            <span class="order-price">$${itemTotal.toFixed(2)}</span>
        `;
        orderSummary.appendChild(orderItem);
    });


    orderSummary.appendChild(ul);
    modalTotalPrice.innerHTML = `<strong>Total:</strong> $${total.toFixed(2)}`;

    document.getElementById("confirm-modal").style.display = "block";
    document.getElementById("modal-overlay").style.display = "block";
}

function closeModal() {
    document.getElementById("confirm-modal").style.display = "none";
    document.getElementById("modal-overlay").style.display = "none";
}

function confirmOrder() {
    alert("Order confirmed! Thank you for your purchase.");
    closeModal();
    clearCart();
}