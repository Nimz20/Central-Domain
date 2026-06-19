/* =====================================================
   CENTRAL DOMAIN - interactions
   - Smooth anchor scrolling
   - Scroll reveals
   - Sticky nav state
   - Mobile nav toggle
   ===================================================== */

(() => {
  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Smooth anchor scrolling with fixed-nav offset ---------- */
  const scrollToAnchor = (id, behavior = 'smooth') => {
    if (!id || id === '#' || id.length < 2) return false;
    const el = document.querySelector(id);
    if (!el) return false;
    const navEl = document.getElementById('nav');
    const navOffset = navEl
      ? Math.ceil(navEl.getBoundingClientRect().bottom + 18)
      : 96;
    const targetEl = el.querySelector(
      '.section__head, .outcomes__head, .contact__left, .footer__inner'
    ) || el;
    const top = Math.max(0, window.scrollY + targetEl.getBoundingClientRect().top - navOffset);
    window.scrollTo({ top, behavior });
    return true;
  };

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      e.preventDefault();
      scrollToAnchor(id);
    });
  });

  window.addEventListener('load', () => {
    if (window.location.hash) {
      requestAnimationFrame(() => scrollToAnchor(window.location.hash, 'auto'));
    }
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay || 0;
          entry.target.style.transitionDelay = delay + 'ms';
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Sticky nav visual state ---------- */
  const nav = document.getElementById('nav');
  if (nav) {
    let ticking = false;

    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 30);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    }, { passive: true });
  }

  /* ---------- Mobile nav toggle ---------- */
  const menuBtn = document.getElementById('navMenu');
  const navLinks = document.querySelector('.nav__links');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Contact form handoff ---------- */
  const contactForm = document.getElementById('contactForm');
  if (contactForm && window.fetch) {
    const statusEl = document.getElementById('contactFormStatus');
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const submitLabel = submitButton ? submitButton.querySelector('span') : null;
    const defaultSubmitText = submitLabel ? submitLabel.textContent : '';

    const setStatus = (message, state = '') => {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.hidden = !message;
      statusEl.classList.toggle('is-success', state === 'success');
      statusEl.classList.toggle('is-error', state === 'error');
    };

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setStatus('Sending enquiry...');

      if (submitButton) submitButton.disabled = true;
      if (submitLabel) submitLabel.textContent = 'Sending...';

      const formData = new FormData(contactForm);
      formData.set('page', window.location.href);

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'fetch'
          }
        });
        let data = {};
        try {
          data = await response.json();
        } catch (_error) {
          data = { message: 'The enquiry could not be sent right now.' };
        }

        if (!response.ok || !data.ok) {
          throw new Error(data.message || 'The enquiry could not be sent.');
        }

        contactForm.reset();
        setStatus(data.message || 'Thanks, your enquiry has been sent.', 'success');
      } catch (error) {
        setStatus(error.message || 'The form could not send right now. Please WhatsApp or call us.', 'error');
      } finally {
        if (submitButton) submitButton.disabled = false;
        if (submitLabel) submitLabel.textContent = defaultSubmitText;
      }
    });
  }
})();
