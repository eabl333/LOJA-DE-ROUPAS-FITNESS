/* ==========================================================================
   Costa Reis Moda Fitness
   Script de produtos (catálogo com Supabase)
   ========================================================================== */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ------------------------------------------------------------------
     1. Configurações
     ------------------------------------------------------------------ */
  const WHATSAPP_NUMBER = "5512991372581";

  const PLACEHOLDER_IMAGE = 'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
        <rect width="600" height="800" fill="#f5f3f0" />
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="28" fill="#b08a7a" text-anchor="middle" dominant-baseline="middle">
          Sem imagem
        </text>
      </svg>
    `);

  /* ------------------------------------------------------------------
     2. Variáveis globais
     ------------------------------------------------------------------ */
  let allProducts = [];
  let currentFilter = 'todos';
  let searchQuery = '';
  let cart = JSON.parse(localStorage.getItem('essenza_cart') || '[]');

  // Elementos do DOM
  const productsContainer = document.getElementById('products-container');
  const productsLoading = document.getElementById('products-loading');
  const productsEmpty = document.getElementById('products-empty');
  const searchInput = document.getElementById('search-input');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const productModal = document.getElementById('product-modal');
  const modalImage = document.getElementById('modal-product-image');
  const modalCategory = document.getElementById('modal-product-category');
  const modalName = document.getElementById('modal-product-name');
  const modalDescription = document.getElementById('modal-product-description');
  const modalOldPrice = document.getElementById('modal-product-old-price');
  const modalPrice = document.getElementById('modal-product-price');
  const modalWhatsappBtn = document.getElementById('modal-whatsapp-btn');
  const cartModal = document.getElementById('cart-modal');
  const cartItemsContainer = document.getElementById('cart-items');
  const cartEmpty = document.getElementById('cart-empty');
  const cartTotalValue = document.getElementById('cart-total-value');
  const cartClearBtn = document.getElementById('cart-clear-btn');
  const cartCheckoutBtn = document.getElementById('cart-checkout-btn');

  /* ------------------------------------------------------------------
     3. Funções utilitárias
     ------------------------------------------------------------------ */
  const formatPrice = (value) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numericValue);
  };

  const getValidImageUrl = (url) => {
    if (url && url.trim() !== '') {
      return url.trim();
    }
    return PLACEHOLDER_IMAGE;
  };

  const toggleLoading = (isLoading) => {
    if (productsLoading) {
      productsLoading.hidden = !isLoading;
      productsLoading.style.display = isLoading ? 'block' : 'none';
    }
    if (productsContainer) {
      productsContainer.style.display = isLoading ? 'none' : 'grid';
    }
    if (productsEmpty) {
      productsEmpty.hidden = true;
      productsEmpty.style.display = 'none';
    }
  };

  const showError = (message) => {
    console.error(message);
    if (productsContainer) {
      productsContainer.innerHTML = '';
      const errorElement = document.createElement('p');
      errorElement.textContent = 'Não foi possível carregar os produtos. Tente novamente.';
      errorElement.style.textAlign = 'center';
      errorElement.style.padding = '2rem';
      errorElement.style.color = '#d9534f';
      productsContainer.appendChild(errorElement);
    }
  };

  const showToast = (message, type = 'success') => {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '2rem';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = type === 'success' ? '#b08a7a' : '#d9534f';
    toast.style.color = '#ffffff';
    toast.style.padding = '0.8rem 2rem';
    toast.style.borderRadius = '50px';
    toast.style.fontSize = '0.95rem';
    toast.style.fontWeight = '500';
    toast.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)';
    toast.style.zIndex = '3000';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  };

  /* ------------------------------------------------------------------
     4. Carregamento dos produtos
     ------------------------------------------------------------------ */
  const loadProducts = async () => {
    toggleLoading(true);

    try {
      if (typeof supabaseClient === 'undefined') {
        throw new Error('Supabase não inicializado.');
      }

      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      allProducts = data || [];
      toggleLoading(false);
      applyFiltersAndSearch();
    } catch (err) {
      toggleLoading(false);
      showError(err.message || 'Erro ao carregar produtos.');
    }
  };

  /* ------------------------------------------------------------------
     5. Renderização dos cards
     ------------------------------------------------------------------ */
  const createProductCard = (product) => {
    const card = document.createElement('article');
    card.className = 'product-card';

    const image = document.createElement('img');
    image.className = 'product-image';
    image.src = getValidImageUrl(product.image_url);
    image.alt = product.name || 'Produto';
    image.loading = 'lazy';

    const info = document.createElement('div');
    info.className = 'product-info';

    const category = document.createElement('span');
    category.className = 'product-category';
    category.textContent = (product.category || 'Categoria').toUpperCase();

    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = product.name || 'Produto sem nome';

    const oldPrice = document.createElement('span');
    oldPrice.className = 'product-old-price';
    if (product.old_price && parseFloat(product.old_price) > 0) {
      oldPrice.textContent = formatPrice(product.old_price);
    }

    const price = document.createElement('span');
    price.className = 'product-price';
    price.textContent = formatPrice(product.price);

    const priceContainer = document.createElement('div');
    priceContainer.className = 'product-price-container';
    priceContainer.appendChild(oldPrice);
    priceContainer.appendChild(price);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'product-actions';

    const viewButton = document.createElement('button');
    viewButton.className = 'product-button';
    viewButton.textContent = 'Ver produto';
    viewButton.addEventListener('click', () => openProductModal(product));

    const cartButton = document.createElement('button');
    cartButton.className = 'product-button product-button-cart';
    cartButton.textContent = 'Adicionar ao carrinho';
    cartButton.addEventListener('click', () => addToCart(product));

    const whatsappButton = document.createElement('a');
    whatsappButton.className = 'product-button product-button-whatsapp';
    whatsappButton.textContent = 'Comprar pelo WhatsApp';
    whatsappButton.href = generateWhatsAppLink(product);
    whatsappButton.target = '_blank';
    whatsappButton.rel = 'noopener';

    buttonsContainer.appendChild(viewButton);
    buttonsContainer.appendChild(cartButton);
    buttonsContainer.appendChild(whatsappButton);

    info.appendChild(category);
    info.appendChild(name);
    info.appendChild(priceContainer);
    info.appendChild(buttonsContainer);

    card.appendChild(image);
    card.appendChild(info);

    return card;
  };

  const renderProducts = (products) => {
    if (!productsContainer) return;

    productsContainer.innerHTML = '';

    if (products.length === 0) {
      if (productsEmpty) {
        productsEmpty.hidden = false;
        productsEmpty.style.display = 'block';
      }
      return;
    }

    if (productsEmpty) {
      productsEmpty.hidden = true;
      productsEmpty.style.display = 'none';
    }

    const fragment = document.createDocumentFragment();
    products.forEach(product => {
      fragment.appendChild(createProductCard(product));
    });
    productsContainer.appendChild(fragment);
  };

  /* ------------------------------------------------------------------
     6. Filtros e Pesquisa
     ------------------------------------------------------------------ */
  const applyFiltersAndSearch = () => {
    let filtered = [...allProducts];

    if (currentFilter !== 'todos') {
      filtered = filtered.filter(product => {
        const category = (product.category || '').toLowerCase();
        return category === currentFilter || 
               category.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === currentFilter ||
               category.includes(currentFilter);
      });
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(product => {
        const name = (product.name || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        return name.includes(query) || category.includes(query) || description.includes(query);
      });
    }

    renderProducts(filtered);
  };

  const setupFilters = () => {
    if (!filterButtons.length) return;

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        filterButtons.forEach(btn => {
          btn.classList.remove('active');
          btn.setAttribute('aria-pressed', 'false');
        });
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
        currentFilter = button.dataset.filter || 'todos';
        applyFiltersAndSearch();
      });
    });
  };

  const setupSearch = () => {
    if (!searchInput) return;
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      applyFiltersAndSearch();
    });
  };

  /* ------------------------------------------------------------------
     7. Modal de produto
     ------------------------------------------------------------------ */
  const openProductModal = (product) => {
    if (!productModal) return;

    if (modalImage) {
      modalImage.src = getValidImageUrl(product.image_url);
      modalImage.alt = product.name || 'Imagem do produto';
    }
    if (modalCategory) modalCategory.textContent = (product.category || '').toUpperCase();
    if (modalName) modalName.textContent = product.name || 'Produto sem nome';
    if (modalDescription) modalDescription.textContent = product.description || 'Descrição não disponível.';
    if (modalOldPrice) {
      if (product.old_price && parseFloat(product.old_price) > 0) {
        modalOldPrice.textContent = formatPrice(product.old_price);
        modalOldPrice.style.display = 'inline';
      } else {
        modalOldPrice.textContent = '';
        modalOldPrice.style.display = 'none';
      }
    }
    if (modalPrice) modalPrice.textContent = formatPrice(product.price);
    if (modalWhatsappBtn) modalWhatsappBtn.href = generateWhatsAppLink(product);

    productModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  };

  const closeProductModal = () => {
    if (!productModal) return;
    productModal.style.display = 'none';
    document.body.style.overflow = '';
  };

  const setupModal = () => {
    if (!productModal) return;

    productModal.addEventListener('click', (event) => {
      if (event.target.hasAttribute('data-close-modal') || event.target.closest('[data-close-modal]')) {
        closeProductModal();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && productModal.style.display === 'block') {
        closeProductModal();
      }
    });
  };

  /* ------------------------------------------------------------------
     8. Carrinho
     ------------------------------------------------------------------ */
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: 1
      });
    }
    
    localStorage.setItem('essenza_cart', JSON.stringify(cart));
    updateCartCount();
    showToast('Produto adicionado ao carrinho!', 'success');
  };

  const updateCartCount = () => {
    const cartButtons = document.querySelectorAll('.cart-button');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    cartButtons.forEach(button => {
      let badge = button.querySelector('.cart-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'cart-badge';
        button.appendChild(badge);
      }
      badge.textContent = totalItems;
      badge.style.display = totalItems > 0 ? 'flex' : 'none';
    });
  };

  const openCartModal = () => {
    if (!cartModal) return;
    renderCartItems();
    cartModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  };

  const closeCartModal = () => {
    if (!cartModal) return;
    cartModal.style.display = 'none';
    document.body.style.overflow = '';
  };

  const renderCartItems = () => {
    if (!cartItemsContainer) return;
    
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
      cartItemsContainer.style.display = 'none';
      if (cartEmpty) cartEmpty.style.display = 'block';
      if (cartTotalValue) cartTotalValue.textContent = 'R$ 0,00';
      return;
    }
    
    cartItemsContainer.style.display = 'block';
    if (cartEmpty) cartEmpty.style.display = 'none';
    
    let total = 0;
    
    cart.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'cart-item';
      
      const image = document.createElement('img');
      image.src = getValidImageUrl(item.image_url);
      image.alt = item.name;
      image.className = 'cart-item-image';
      
      const info = document.createElement('div');
      info.className = 'cart-item-info';
      
      const name = document.createElement('span');
      name.className = 'cart-item-name';
      name.textContent = item.name;
      
      const quantity = document.createElement('span');
      quantity.className = 'cart-item-quantity';
      quantity.textContent = `Qtd: ${item.quantity}`;
      
      const price = document.createElement('span');
      price.className = 'cart-item-price';
      price.textContent = formatPrice(item.price * item.quantity);
      
      info.appendChild(name);
      info.appendChild(quantity);
      info.appendChild(price);
      
      itemElement.appendChild(image);
      itemElement.appendChild(info);
      
      cartItemsContainer.appendChild(itemElement);
      
      total += item.price * item.quantity;
    });
    
    if (cartTotalValue) cartTotalValue.textContent = formatPrice(total);
  };

  const clearCart = () => {
    cart = [];
    localStorage.setItem('essenza_cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
    showToast('Carrinho limpo!', 'success');
  };

  const setupCartModal = () => {
    document.querySelectorAll('.cart-button').forEach(button => {
      button.addEventListener('click', openCartModal);
    });
    
    if (cartModal) {
      cartModal.addEventListener('click', (event) => {
        if (event.target.hasAttribute('data-close-cart') || event.target.closest('[data-close-cart]')) {
          closeCartModal();
        }
      });
    }
    
    if (cartClearBtn) cartClearBtn.addEventListener('click', clearCart);
    
    if (cartCheckoutBtn) {
      cartCheckoutBtn.addEventListener('click', () => {
        if (cart.length === 0) return;
        
        let message = 'Olá! Gostaria de comprar os seguintes produtos:\n\n';
        cart.forEach(item => {
          message += `- ${item.name} (Qtd: ${item.quantity}) - ${formatPrice(item.price * item.quantity)}\n`;
        });
        message += `\nTotal: ${formatPrice(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}`;
        
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
      });
    }
  };

  /* ------------------------------------------------------------------
     9. WhatsApp
     ------------------------------------------------------------------ */
  const generateWhatsAppLink = (product) => {
    const productName = product.name || 'Produto';
    const message = `Olá! Tenho interesse no produto: ${productName}. Gostaria de saber mais informações.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  /* ------------------------------------------------------------------
     10. Inicialização
     ------------------------------------------------------------------ */
  const init = () => {
    setupFilters();
    setupSearch();
    setupModal();
    setupCartModal();
    updateCartCount();
    loadProducts();
  };

  init();
});