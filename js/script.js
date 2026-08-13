/* ==========================================================================
   ESSENZA - Moda Feminina Premium
   Script principal (interações gerais do site)
   ========================================================================== */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ------------------------------------------------------------------
     1. Inicialização
     ------------------------------------------------------------------ */
  const header = document.querySelector('.site-header');
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const newsletterForm = document.querySelector('.newsletter-form');
  const newsletterInput = document.getElementById('newsletter-email');
  const cartButton = document.querySelector('.cart-button');

  /* ------------------------------------------------------------------
     2. Menu mobile (hambúrguer)
     ------------------------------------------------------------------ */
  const initMobileMenu = () => {
    if (!hamburgerBtn || !mobileMenu) return;

    const closeMenu = () => {
      mobileMenu.classList.remove('open');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
    };

    hamburgerBtn.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
    });

    // Fechar menu ao clicar em qualquer link dentro do menu mobile
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Fechar menu com a tecla ESC
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && mobileMenu.classList.contains('open')) {
        closeMenu();
      }
    });
  };

  /* ------------------------------------------------------------------
     3. Navegação suave para links internos
     ------------------------------------------------------------------ */
  const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (event) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return; // Ignorar links vazios

        const targetElement = document.querySelector(targetId);
        if (!targetElement) return;

        event.preventDefault();

        // Cálculo da posição considerando a altura do header fixo
        const headerHeight = header ? header.offsetHeight : 0;
        const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      });
    });
  };

  /* ------------------------------------------------------------------
     4. Comportamento do header ao rolar
     ------------------------------------------------------------------ */
  const initHeaderScroll = () => {
    if (!header) return;

    const toggleHeaderClass = () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', toggleHeaderClass, { passive: true });
    toggleHeaderClass(); // estado inicial
  };

  /* ------------------------------------------------------------------
     5. Animações suaves ao rolar (IntersectionObserver)
     ------------------------------------------------------------------ */
  const initScrollAnimations = () => {
    const animatedElements = document.querySelectorAll(
      '.category-card, .benefit-card, .testimonial-card, .about-content, .about-media, .section-heading'
    );

    if (!animatedElements.length) return;

    // Verifica se o usuário prefere menos movimento
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Sem animações: mostra tudo imediatamente
      animatedElements.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.transition = 'none';
      });
      return;
    }

    // Aplica estado inicial (escondido) e transição
    animatedElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'none';
          observer.unobserve(entry.target); // Para de observar após aparecer
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px' // Dispara um pouco antes de entrar totalmente
    });

    animatedElements.forEach(el => observer.observe(el));
  };

  /* ------------------------------------------------------------------
     6. Newsletter (validação e feedback)
     ------------------------------------------------------------------ */
  const initNewsletter = () => {
    if (!newsletterForm || !newsletterInput) return;

    newsletterForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const email = newsletterInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email) {
        showToast('Por favor, digite seu e-mail.', 'error');
        return;
      }

      if (!emailRegex.test(email)) {
        showToast('E-mail inválido. Verifique e tente novamente.', 'error');
        return;
      }

      // Simulação de sucesso (sem integração com Supabase por enquanto)
      showToast('Cadastro realizado com sucesso! Você receberá nossas novidades.', 'success');
      newsletterInput.value = '';
    });
  };

  /* ------------------------------------------------------------------
     7. Botão do carrinho (feedback provisório)
     ------------------------------------------------------------------ */
  const initCartButton = () => {
    if (!cartButton) return;

    cartButton.addEventListener('click', () => {
      showToast('Seu carrinho estará disponível em breve.', 'info');
    });
  };

  /* ------------------------------------------------------------------
     8. Função utilitária: showToast(message, type)
     ------------------------------------------------------------------ */
  /**
   * Exibe uma notificação temporária na tela.
   * @param {string} message - Texto da mensagem.
   * @param {string} type - Tipo: 'success', 'error', 'info' (opcional).
   */
  const showToast = (message, type = 'info') => {
    // Remove toasts existentes para não acumular
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message; // Seguro contra XSS

    // Estilos básicos inline (sem depender de CSS externo)
    toast.style.position = 'fixed';
    toast.style.bottom = '2rem';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = type === 'success' ? '#b08a7a' : 
                                 type === 'error' ? '#d9534f' : '#2c2c2c';
    toast.style.color = '#ffffff';
    toast.style.padding = '0.8rem 2rem';
    toast.style.borderRadius = '50px';
    toast.style.fontSize = '0.95rem';
    toast.style.fontWeight = '500';
    toast.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)';
    toast.style.zIndex = '2000';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.transform = 'translateX(-50%) translateY(20px)';

    document.body.appendChild(toast);

    // Anima entrada
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);

    // Remove após 3 segundos
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  };

  /* ------------------------------------------------------------------
     9. Botão "Voltar ao topo" dinâmico
     ------------------------------------------------------------------ */
  const initBackToTop = () => {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.type = 'button';
    backToTopBtn.setAttribute('aria-label', 'Voltar ao topo');
    backToTopBtn.textContent = '↑';
    backToTopBtn.style.position = 'fixed';
    backToTopBtn.style.bottom = '2rem';
    backToTopBtn.style.right = '2rem';
    backToTopBtn.style.width = '48px';
    backToTopBtn.style.height = '48px';
    backToTopBtn.style.borderRadius = '50%';
    backToTopBtn.style.border = 'none';
    backToTopBtn.style.backgroundColor = '#b08a7a';
    backToTopBtn.style.color = '#ffffff';
    backToTopBtn.style.fontSize = '1.6rem';
    backToTopBtn.style.cursor = 'pointer';
    backToTopBtn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    backToTopBtn.style.zIndex = '1000';
    backToTopBtn.style.opacity = '0';
    backToTopBtn.style.transform = 'translateY(20px)';
    backToTopBtn.style.transition = 'opacity 0.3s ease, transform 0.3s ease, background-color 0.2s ease';
    backToTopBtn.style.display = 'flex';
    backToTopBtn.style.alignItems = 'center';
    backToTopBtn.style.justifyContent = 'center';
    backToTopBtn.style.padding = '0';

    // Efeito hover (opcional, via JS)
    backToTopBtn.addEventListener('mouseenter', () => {
      backToTopBtn.style.backgroundColor = '#9c7565';
    });
    backToTopBtn.addEventListener('mouseleave', () => {
      backToTopBtn.style.backgroundColor = '#b08a7a';
    });

    document.body.appendChild(backToTopBtn);

    const toggleBackToTop = () => {
      if (window.scrollY > 300) {
        backToTopBtn.style.opacity = '1';
        backToTopBtn.style.transform = 'translateY(0)';
      } else {
        backToTopBtn.style.opacity = '0';
        backToTopBtn.style.transform = 'translateY(20px)';
      }
    };

    window.addEventListener('scroll', toggleBackToTop, { passive: true });
    toggleBackToTop();

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  /* ------------------------------------------------------------------
     10. Inicialização de todos os módulos
     ------------------------------------------------------------------ */
  const init = () => {
    initMobileMenu();
    initSmoothScroll();
    initHeaderScroll();
    initScrollAnimations();
    initNewsletter();
    initCartButton();
    initBackToTop();
  };

  init();
});