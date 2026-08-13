/* ==========================================================================
   ESSENZA - Moda Feminina Premium
   Script de administração (login + painel)
   ========================================================================== */

'use strict';

/* --------------------------------------------------------------------------
   1. Login (código existente mantido)
   -------------------------------------------------------------------------- */
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        loginMessage.textContent = "Entrando...";

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error("Erro no login:", error);
            loginMessage.textContent = "E-mail ou senha incorretos.";
            return;
        }

        console.log("Login realizado:", data);

        window.location.href = "painel.html";
    });
}

/* --------------------------------------------------------------------------
   2. Autenticação do painel (painel.html)
   -------------------------------------------------------------------------- */
const isAdminPage = window.location.pathname.includes('painel.html');

if (isAdminPage) {
    const checkAuth = async () => {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error || !user) {
            // Redireciona para a página de login se não estiver autenticado
            window.location.href = 'login.html';
        }
    };
    checkAuth();
}

/* --------------------------------------------------------------------------
   3. Variáveis globais (apenas no painel)
   -------------------------------------------------------------------------- */
let products = [];               // Armazena produtos carregados
let currentEditingId = null;     // ID do produto em edição
let currentDeleteId = null;      // ID do produto a excluir

// Elementos do painel (verificados com segurança)
const productForm = document.getElementById('product-form');
const productNameInput = document.getElementById('product-name');
const productDescriptionInput = document.getElementById('product-description');
const productPriceInput = document.getElementById('product-price');
const productOldPriceInput = document.getElementById('product-old-price');
const productCategorySelect = document.getElementById('product-category');
const productImageInput = document.getElementById('product-image');
const productActiveCheckbox = document.getElementById('product-active');
const imagePreview = document.getElementById('image-preview');
const adminMessage = document.getElementById('admin-message');
const saveProductBtn = document.getElementById('save-product');

const adminProductsContainer = document.getElementById('admin-products');
const totalProductsEl = document.getElementById('total-products');
const activeProductsEl = document.getElementById('active-products');
const inactiveProductsEl = document.getElementById('inactive-products');

const editProductModal = document.getElementById('edit-product-modal');
const editProductForm = document.getElementById('edit-product-form');
const editProductId = document.getElementById('edit-product-id');
const editProductName = document.getElementById('edit-product-name');
const editProductDescription = document.getElementById('edit-product-description');
const editProductPrice = document.getElementById('edit-product-price');
const editProductOldPrice = document.getElementById('edit-product-old-price');
const editProductCategory = document.getElementById('edit-product-category');
const editProductImage = document.getElementById('edit-product-image');
const editProductActive = document.getElementById('edit-product-active');

const deleteProductModal = document.getElementById('delete-product-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

/* --------------------------------------------------------------------------
   4. Upload de imagens (Supabase Storage)
   -------------------------------------------------------------------------- */
const STORAGE_BUCKET = 'product-images';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Gera um nome de arquivo único baseado em timestamp e string aleatória.
 * @param {File} file - Arquivo original.
 * @returns {string} Nome único.
 */
function generateUniqueFileName(file) {
    const extension = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `product-${timestamp}-${randomPart}.${extension}`;
}

/**
 * Valida o tipo do arquivo de imagem.
 * @param {File} file - Arquivo.
 * @returns {boolean} True se válido.
 */
function isValidImageType(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return allowedTypes.includes(file.type);
}

/**
 * Faz upload de uma imagem para o bucket e retorna a URL pública.
 * @param {File} file - Arquivo de imagem.
 * @returns {Promise<string>} URL pública da imagem.
 */
async function uploadProductImage(file) {
    if (!file) return null;

    // Valida tipo
    if (!isValidImageType(file)) {
        throw new Error('Tipo de imagem inválido. Use JPG, PNG ou WEBP.');
    }

    // Valida tamanho
    if (file.size > MAX_IMAGE_SIZE) {
        throw new Error('Imagem muito grande. Máximo permitido: 5 MB.');
    }

    const fileName = generateUniqueFileName(file);
    const filePath = fileName; // Sem subpastas; pode adaptar se necessário

    // Upload para o bucket
    const { data, error } = await supabaseClient.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error('Erro no upload:', error);
        throw new Error('Não foi possível enviar a imagem.');
    }

    // Obtém URL pública
    const { data: publicUrlData } = supabaseClient.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
}

/* --------------------------------------------------------------------------
   5. Preview da imagem
   -------------------------------------------------------------------------- */
function setupImagePreview() {
    if (!productImageInput || !imagePreview) return;

    const fileNameSpan = document.getElementById('file-name');
    const editImageInput = document.getElementById('edit-product-image');
    const editFileNameSpan = document.getElementById('edit-file-name');

    // Atualiza nome do arquivo
    if (fileNameSpan) {
        productImageInput.addEventListener('change', () => {
            const file = productImageInput.files[0];
            fileNameSpan.textContent = file ? file.name : 'Nenhum arquivo selecionado';
        });
    }

    if (editImageInput && editFileNameSpan) {
        editImageInput.addEventListener('change', () => {
            const file = editImageInput.files[0];
            editFileNameSpan.textContent = file ? file.name : 'Nenhum arquivo selecionado';
        });
    }

    // Preview da imagem
    productImageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            imagePreview.innerHTML = '';
            return;
        }

        if (!isValidImageType(file)) {
            imagePreview.textContent = 'Tipo de imagem inválido.';
            productImageInput.value = '';
            if (fileNameSpan) fileNameSpan.textContent = 'Nenhum arquivo selecionado';
            return;
        }
        if (file.size > MAX_IMAGE_SIZE) {
            imagePreview.textContent = 'Imagem muito grande (máx. 5 MB).';
            productImageInput.value = '';
            if (fileNameSpan) fileNameSpan.textContent = 'Nenhum arquivo selecionado';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = 'Prévia da imagem do produto';
            img.style.maxWidth = '100%';
            img.style.maxHeight = '200px';
            imagePreview.innerHTML = '';
            imagePreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}
/* --------------------------------------------------------------------------
   6. Cadastro de produto
   -------------------------------------------------------------------------- */
function setupProductForm() {
    if (!productForm) return;

    productForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Desabilita botão
        if (saveProductBtn) {
            saveProductBtn.disabled = true;
            saveProductBtn.textContent = 'Salvando...';
        }

        // Validação básica
        const name = productNameInput?.value.trim();
        const price = parseFloat(productPriceInput?.value || '0');
        const category = productCategorySelect?.value;
        const description = productDescriptionInput?.value.trim();
        const oldPrice = parseFloat(productOldPriceInput?.value || '0');
        const active = productActiveCheckbox?.checked ?? true;
        const imageFile = productImageInput?.files[0] || null;

        if (!name) {
            showAdminMessage('Por favor, informe o nome do produto.', 'error');
            resetSaveButton();
            return;
        }
        if (isNaN(price) || price <= 0) {
            showAdminMessage('Preço inválido.', 'error');
            resetSaveButton();
            return;
        }
        if (!category) {
            showAdminMessage('Selecione uma categoria.', 'error');
            resetSaveButton();
            return;
        }

        try {
            // Upload da imagem, se houver
            let imageUrl = null;
            if (imageFile) {
                imageUrl = await uploadProductImage(imageFile);
            }

            // Insere no banco
            const { data, error } = await supabaseClient
                .from('products')
                .insert({
                    name: name,
                    description: description,
                    price: price,
                    old_price: oldPrice > 0 ? oldPrice : null,
                    category: category,
                    image_url: imageUrl,
                    active: active
                });

            if (error) {
                throw error;
            }

            showAdminMessage('Produto cadastrado com sucesso!', 'success');
            productForm.reset();
            if (imagePreview) imagePreview.innerHTML = '';
            if (productActiveCheckbox) productActiveCheckbox.checked = true;
            await loadProducts();
            await updateStats();
        } catch (err) {
    console.error('ERRO COMPLETO AO CADASTRAR:', err);

    const mensagem = err?.message || String(err);

    showAdminMessage(
        'Erro: ' + mensagem,
        'error'
    );
} finally {
    resetSaveButton();
}
    });
}

function resetSaveButton() {
    if (saveProductBtn) {
        saveProductBtn.disabled = false;
        saveProductBtn.textContent = 'Adicionar produto';
    }
}

/* --------------------------------------------------------------------------
   7. Listagem de produtos
   -------------------------------------------------------------------------- */
async function loadProducts() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        products = data || [];
        renderAdminProducts(products);
    } catch (err) {
        console.error('Erro ao carregar produtos:', err);
        showAdminMessage('Não foi possível carregar os produtos.', 'error');
    }
}

function renderAdminProducts(productList) {
    if (!adminProductsContainer) return;

    adminProductsContainer.innerHTML = '';

    if (productList.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.textContent = 'Nenhum produto cadastrado ainda.';
        emptyMsg.style.gridColumn = '1 / -1';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.padding = '2rem';
        adminProductsContainer.appendChild(emptyMsg);
        return;
    }

    productList.forEach(product => {
        const card = document.createElement('article');
        card.className = 'admin-product-card';

        // Imagem
        const img = document.createElement('img');
        img.className = 'admin-product-image';
        img.src = product.image_url || 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#eee"/></svg>');
        img.alt = product.name || 'Produto';
        img.loading = 'lazy';

        // Informações
        const info = document.createElement('div');
        info.className = 'admin-product-info';

        const name = document.createElement('h3');
        name.className = 'admin-product-name';
        name.textContent = product.name;

        const category = document.createElement('p');
        category.className = 'admin-product-category';
        category.textContent = product.category || 'Sem categoria';

        const price = document.createElement('p');
        price.className = 'admin-product-price';
        price.textContent = formatPrice(product.price);

        const oldPrice = document.createElement('p');
        oldPrice.className = 'admin-product-old-price';
        if (product.old_price) {
            oldPrice.textContent = 'de ' + formatPrice(product.old_price);
        }

        const status = document.createElement('span');
        status.className = 'admin-product-status ' + (product.active ? 'active' : 'inactive');
        status.textContent = product.active ? 'Ativo' : 'Inativo';

        // Ações
        const actions = document.createElement('div');
        actions.className = 'admin-product-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-outline btn-sm';
        editBtn.textContent = 'Editar';
        editBtn.addEventListener('click', () => openEditModal(product));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-outline btn-sm btn-danger';
        deleteBtn.textContent = 'Excluir';
        deleteBtn.addEventListener('click', () => openDeleteModal(product.id));

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        info.appendChild(name);
        info.appendChild(category);
        info.appendChild(price);
        info.appendChild(oldPrice);
        info.appendChild(status);
        info.appendChild(actions);

        card.appendChild(img);
        card.appendChild(info);
        adminProductsContainer.appendChild(card);
    });
}

/* --------------------------------------------------------------------------
   8. Estatísticas
   -------------------------------------------------------------------------- */
async function updateStats() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*');

        if (error) {
            throw error;
        }

        const total = data.length;
        const active = data.filter(p => p.active).length;
        const inactive = total - active;

        if (totalProductsEl) totalProductsEl.textContent = total;
        if (activeProductsEl) activeProductsEl.textContent = active;
        if (inactiveProductsEl) inactiveProductsEl.textContent = inactive;
    } catch (err) {
        console.error('Erro ao atualizar estatísticas:', err);
    }
}

/* --------------------------------------------------------------------------
   9. Edição de produto
   -------------------------------------------------------------------------- */
function openEditModal(product) {
    if (!editProductModal || !editProductForm) return;

    currentEditingId = product.id;
    if (editProductId) editProductId.value = product.id;
    if (editProductName) editProductName.value = product.name || '';
    if (editProductDescription) editProductDescription.value = product.description || '';
    if (editProductPrice) editProductPrice.value = product.price || '';
    if (editProductOldPrice) editProductOldPrice.value = product.old_price || '';
    if (editProductCategory) editProductCategory.value = product.category || 'Vestidos';
    if (editProductActive) editProductActive.checked = product.active;

    // Limpa input de imagem e preview
    if (editProductImage) editProductImage.value = '';
    // Não mostramos preview da imagem existente, mas poderia ser adicionado.

    editProductModal.hidden = false;
    editProductModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    if (!editProductModal) return;
    editProductModal.hidden = true;
    editProductModal.style.display = 'none';
    document.body.style.overflow = '';
    currentEditingId = null;
}

async function handleEditSubmit(event) {
    event.preventDefault();
    if (!currentEditingId) return;

    const name = editProductName?.value.trim();
    const price = parseFloat(editProductPrice?.value || '0');
    const category = editProductCategory?.value;
    const description = editProductDescription?.value.trim();
    const oldPrice = parseFloat(editProductOldPrice?.value || '0');
    const active = editProductActive?.checked ?? true;
    const imageFile = editProductImage?.files[0] || null;

    if (!name || isNaN(price) || price <= 0 || !category) {
        showAdminMessage('Dados inválidos para atualização.', 'error');
        return;
    }

    try {
        let imageUrl = null;
        // Se novo arquivo de imagem, faz upload
        if (imageFile) {
            imageUrl = await uploadProductImage(imageFile);
        }

        const updateData = {
            name: name,
            description: description,
            price: price,
            old_price: oldPrice > 0 ? oldPrice : null,
            category: category,
            active: active
        };

        // Só atualiza image_url se houve novo upload
        if (imageUrl) {
            updateData.image_url = imageUrl;
        }

        const { error } = await supabaseClient
            .from('products')
            .update(updateData)
            .eq('id', currentEditingId);

        if (error) {
            throw error;
        }

        showAdminMessage('Produto atualizado com sucesso!', 'success');
        closeEditModal();
        await loadProducts();
        await updateStats();
    } catch (err) {
        console.error('Erro ao atualizar produto:', err);
        showAdminMessage('Não foi possível atualizar o produto.', 'error');
    }
}

/* --------------------------------------------------------------------------
   10. Exclusão de produto
   -------------------------------------------------------------------------- */
   /* --------------------------------------------------------------------------
   10. Exclusão de produto
   -------------------------------------------------------------------------- */
function openDeleteModal(productId) {
    if (!deleteProductModal) return;

    currentDeleteId = productId;
    
    // Remove o atributo hidden
    deleteProductModal.removeAttribute('hidden');
    
    // Garante que o modal fique visível
    deleteProductModal.style.display = 'block';
    deleteProductModal.style.zIndex = '2000';
    
    // Força a visibilidade
    deleteProductModal.style.visibility = 'visible';
    deleteProductModal.style.opacity = '1';
    
    document.body.style.overflow = 'hidden';
    
    console.log('Modal de exclusão aberto. ID:', currentDeleteId);
}

function closeDeleteModal() {
    if (!deleteProductModal) return;
    
    deleteProductModal.style.display = 'none';
    deleteProductModal.setAttribute('hidden', 'true');
    deleteProductModal.style.visibility = 'hidden';
    deleteProductModal.style.opacity = '0';
    
    document.body.style.overflow = '';
    currentDeleteId = null;
    
    console.log('Modal de exclusão fechado.');
}

async function handleDeleteConfirm() {
    console.log('Botão Excluir produto clicado. ID atual:', currentDeleteId);
    
    if (!currentDeleteId) {
        console.error('ID não definido!');
        return;
    }

    try {
        console.log('Tentando excluir produto...');
        const { data, error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', currentDeleteId)
            .select(); // Adicione .select() para ver os dados excluídos

        console.log('Resposta da exclusão:', { data, error });

        if (error) {
            console.error('Erro do Supabase:', error);
            throw error;
        }

        showAdminMessage('Produto excluído com sucesso!', 'success');
        closeDeleteModal();
        await loadProducts();
        await updateStats();
    } catch (err) {
        console.error('Erro ao excluir produto:', err);
        showAdminMessage('Não foi possível excluir o produto.', 'error');
        closeDeleteModal();
    }
}

/* --------------------------------------------------------------------------
   11. Ativar/desativar produto
   -------------------------------------------------------------------------- */
// Esta funcionalidade pode ser implementada se houver um botão específico.
// No HTML atual não há botão, mas podemos adicionar um evento genérico.
// Vamos implementar uma função que pode ser usada futuramente.
async function toggleProductActive(productId, currentActive) {
    try {
        const { error } = await supabaseClient
            .from('products')
            .update({ active: !currentActive })
            .eq('id', productId);

        if (error) {
            throw error;
        }
        await loadProducts();
        await updateStats();
        showAdminMessage('Status atualizado!', 'success');
    } catch (err) {
        console.error('Erro ao alterar status:', err);
        showAdminMessage('Não foi possível alterar o status.', 'error');
    }
}

/* --------------------------------------------------------------------------
   12. Modais (eventos de fechamento)
   -------------------------------------------------------------------------- */
function setupModals() {
    // Fechar modais ao clicar no backdrop ou botão com data-close
    document.addEventListener('click', (event) => {
        // Fecha modal de edição se clicar no backdrop ou botão cancelar/fechar
        if (event.target.hasAttribute('data-close-edit-modal')) {
            closeEditModal();
        }
        // Fecha modal de exclusão se clicar no backdrop ou botão cancelar/fechar
        if (event.target.hasAttribute('data-close-delete-modal')) {
            closeDeleteModal();
        }
    });

    // Fechar com ESC
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (editProductModal && !editProductModal.hidden) {
                closeEditModal();
            }
            if (deleteProductModal && !deleteProductModal.hidden) {
                closeDeleteModal();
            }
        }
    });

    // Botão de confirmar exclusão
    if (confirmDeleteBtn) {
        console.log('Configurando botão de exclusão...');
        confirmDeleteBtn.addEventListener('click', function(event) {
            event.stopPropagation(); // Impede que o clique feche o modal
            handleDeleteConfirm();
        });
    } else {
        console.error('Botão confirm-delete-btn não encontrado!');
    }

    // Botão de salvar edição
    if (editProductForm) {
        editProductForm.addEventListener('submit', handleEditSubmit);
    }
}

/* --------------------------------------------------------------------------
   13. Exibição de mensagens no painel
   -------------------------------------------------------------------------- */
function showAdminMessage(message, type = 'info') {
    if (!adminMessage) return;

    adminMessage.textContent = message;
    adminMessage.className = 'admin-message';
    if (type === 'success') {
        adminMessage.classList.add('success');
    } else if (type === 'error') {
        adminMessage.classList.add('error');
    }

    // Limpa a mensagem após alguns segundos
    setTimeout(() => {
        adminMessage.textContent = '';
        adminMessage.className = 'admin-message';
    }, 5000);
}

/* --------------------------------------------------------------------------
   14. Utilidades
   -------------------------------------------------------------------------- */
function formatPrice(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

/* --------------------------------------------------------------------------
   15. Inicialização
   -------------------------------------------------------------------------- */
function initAdminPanel() {
    if (!isAdminPage) return; // Só executa no painel

    setupImagePreview();
    setupProductForm();
    setupModals();

    // Carrega produtos e estatísticas
    loadProducts();
    updateStats();

    // Verifica autenticação novamente após carregar (para garantir que ainda esteja logado)
    // Mas a verificação principal já foi feita acima.
}

// Iniciar conforme a página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (isAdminPage) {
            initAdminPanel();
        }
    });
} else {
    if (isAdminPage) {
        initAdminPanel();
    }
}

// TESTE TEMPORÁRIO - DIAGNÓSTICO DO BOTÃO EXCLUIR
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const btn = document.getElementById('confirm-delete-btn');
        if (btn) {
            console.log('✅ Botão confirm-delete-btn encontrado!');
            btn.addEventListener('click', function() {
                console.log('🖱️ CLIQUE NO BOTÃO EXCLUIR PRODUTO DETECTADO!');
                console.log('ID atual:', currentDeleteId);
            });
        } else {
            console.error('❌ Botão confirm-delete-btn NÃO encontrado!');
        }
    }, 2000);
});