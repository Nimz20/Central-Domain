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

  /* ---------- Contact form mailto handoff ---------- */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const value = (name) => String(formData.get(name) || '').trim();
      const service = value('service');
      const lines = [
        ['Name', value('name')],
        ['Email or phone', value('contact')],
        ['Website', value('website')],
        ['Need', service],
        ['Message', value('message')]
      ].filter(([, content]) => content);

      const subject = service
        ? `Project enquiry - ${service}`
        : 'Project enquiry - Central Domain';
      const body = lines.map(([label, content]) => `${label}: ${content}`).join('\n');
      window.location.href = `mailto:info@centraldomain.co.za?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }
})();
