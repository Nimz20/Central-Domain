/* =====================================================
   CENTRAL DOMAIN — interactions
   - Smooth scroll (Lenis-style, lightweight)
   - Scroll reveals
   - Tilt-on-hover for cards (with mouse-following glow)
   - Cursor glow
   - Sticky nav state
   - Mobile nav toggle
   - Animated orbs that drift with scroll
   ===================================================== */

(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Smooth anchor scrolling (native, GPU-composited) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
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

  /* ---------- Cursor glow + card mouse-follow ---------- */
  const glow = document.querySelector('.cursor-glow');
  const tiltCards = document.querySelectorAll('[data-tilt]');

  if (!isCoarse) {
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let gx = mx, gy = my;

    const moveGlow = () => {
      gx += (mx - gx) * 0.15;
      gy += (my - gy) * 0.15;
      if (glow) glow.style.transform = `translate3d(${gx}px, ${gy}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(moveGlow);
    };
    if (glow && !prefersReducedMotion) requestAnimationFrame(moveGlow);

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
    }, { passive: true });

    // Tilt cards: update --mx/--my for the radial gradient + transform
    tiltCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const rx = ((py / rect.height) - 0.5) * -6;
        const ry = ((px / rect.width)  - 0.5) *  6;
        card.style.setProperty('--mx', px + 'px');
        card.style.setProperty('--my', py + 'px');
        if (!prefersReducedMotion) {
          card.style.transform = `translateY(-3px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        }
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
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

  /* ---------- Process timeline ---------- */
  const tlFill   = document.getElementById('tl-fill');
  const tlSteps  = Array.from(document.querySelectorAll('.tl-step'));
  const tlNodes  = Array.from(document.querySelectorAll('.tl-node'));
  const tlWrap   = document.querySelector('.timeline-wrap');

  if (tlFill && tlWrap && tlSteps.length) {
    const updateTimeline = () => {
      const wrapRect  = tlWrap.getBoundingClientRect();
      const wrapH     = tlWrap.offsetHeight;
      const trigger   = window.innerHeight * 0.72;
      // how far the section has scrolled through the viewport
      const progress  = Math.min(Math.max((-wrapRect.top + trigger) / (wrapH + trigger), 0), 1);
      tlFill.style.height = (progress * 100) + '%';

      tlSteps.forEach((step, i) => {
        const stepRect = step.getBoundingClientRect();
        const active   = stepRect.top < trigger;
        step.classList.toggle('active', active);
        if (tlNodes[i]) tlNodes[i].classList.toggle('active', active);
      });
    };

    window.addEventListener('scroll', updateTimeline, { passive: true });
    updateTimeline();
  }

  /* ---------- Estimate and invoice request builder ---------- */
  const checkoutButtons = Array.from(document.querySelectorAll('[data-checkout-item]'));
  const checkoutList = document.getElementById('checkoutList');
  const checkoutEmpty = document.getElementById('checkoutEmpty');
  const checkoutAmount = document.getElementById('checkoutAmount');
  const checkoutNote = document.getElementById('checkoutNote');
  const whatsappLink = document.getElementById('checkoutWhatsApp');
  const emailLink = document.getElementById('checkoutEmail');
  const checkoutFields = [
    'checkoutName',
    'checkoutBusiness',
    'checkoutEmailField',
    'checkoutPhone',
    'checkoutMessage',
  ]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const selectedCheckoutItems = new Map();

  const normaliseCurrency = (value) => `R${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const getDueAmount = (item) => {
    if (!Number.isFinite(item.price)) return null;
    if (item.due === 'deposit') return item.price * 0.5;
    return item.price;
  };

  const getItemLabel = (item) => {
    const amount = getDueAmount(item);
    if (amount === null) return 'Scope quote';
    const prefix = item.prefix === 'from' ? 'From ' : '';
    const suffix = item.due === 'deposit'
      ? ' deposit'
      : item.frequency === 'monthly'
        ? ' first month'
        : item.frequency === 'hourly'
          ? ' first hour'
          : '';
    return `${prefix}${normaliseCurrency(amount)}${suffix}`;
  };

  const getFieldValue = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };

  const buildCheckoutMessage = () => {
    const items = Array.from(selectedCheckoutItems.values());
    const lines = [
      'Project estimate request - Central Domain',
      '',
      `Name: ${getFieldValue('checkoutName') || 'Not provided'}`,
      `Business: ${getFieldValue('checkoutBusiness') || 'Not provided'}`,
      `Email: ${getFieldValue('checkoutEmailField') || 'Not provided'}`,
      `Phone / WhatsApp: ${getFieldValue('checkoutPhone') || 'Not provided'}`,
      '',
      'Selected services:',
    ];

    if (items.length) {
      items.forEach((item) => {
        lines.push(`- ${item.title}: ${getItemLabel(item)}`);
      });
    } else {
      lines.push('- No services selected yet');
    }

    const pricedTotal = items.reduce((sum, item) => {
      const due = getDueAmount(item);
      return sum + (due || 0);
    }, 0);
    const hasScope = items.some((item) => getDueAmount(item) === null);
    const totalText = pricedTotal > 0
      ? `${normaliseCurrency(pricedTotal)}${hasScope ? ' + scope quote' : ''}`
      : hasScope
        ? 'Scope quote required'
        : 'R0.00';

    lines.push('', `Estimated starting amount: ${totalText}`);
    lines.push('Payment method: EFT only');
    lines.push('Please confirm scope and send the EFT invoice for payment.');

    const note = getFieldValue('checkoutMessage');
    if (note) lines.push('', `Notes: ${note}`);

    return lines.join('\n');
  };

  const updateCheckoutLinks = () => {
    const message = buildCheckoutMessage();
    const encoded = encodeURIComponent(message);
    if (whatsappLink) whatsappLink.href = `https://wa.me/27725533660?text=${encoded}`;
    if (emailLink) {
      emailLink.href = `mailto:info@centraldomain.co.za?subject=${encodeURIComponent('Project estimate request - Central Domain')}&body=${encoded}`;
    }
  };

  const renderCheckout = () => {
    if (!checkoutList || !checkoutAmount) return;

    const items = Array.from(selectedCheckoutItems.values());
    checkoutList.innerHTML = '';
    if (checkoutEmpty) checkoutEmpty.hidden = items.length > 0;

    let total = 0;
    let hasScope = false;
    let hasDeposit = false;

    items.forEach((item) => {
      const due = getDueAmount(item);
      if (due === null) hasScope = true;
      else total += due;
      if (item.due === 'deposit') hasDeposit = true;

      const li = document.createElement('li');
      li.className = 'checkout-summary__item';
      const body = document.createElement('div');
      const title = document.createElement('strong');
      const detail = document.createElement('span');
      const remove = document.createElement('button');

      title.textContent = item.title;
      detail.textContent = `${getItemLabel(item)}${item.note ? ` - ${item.note}` : ''}`;
      remove.type = 'button';
      remove.textContent = 'x';
      remove.setAttribute('aria-label', `Remove ${item.title}`);
      remove.dataset.removeCheckout = item.id;

      body.append(title, detail);
      li.append(body, remove);
      checkoutList.appendChild(li);
    });

    checkoutAmount.textContent = total > 0
      ? `${normaliseCurrency(total)}${hasScope ? ' + quote' : ''}`
      : hasScope
        ? 'Scope quote'
        : 'R0.00';

    if (checkoutNote) {
      checkoutNote.textContent = hasDeposit
        ? 'Project items show the 50% upfront deposit. The remaining 50% is due after sign-off and before go-live.'
        : hasScope
          ? 'Scoped work is confirmed on invoice after discovery.'
          : 'Final billing is confirmed on invoice before payment.';
    }

    checkoutButtons.forEach((button) => {
      const card = button.closest('.rate-card');
      const id = button.dataset.title;
      const selected = selectedCheckoutItems.has(id);
      if (card) card.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      button.querySelector('span').textContent = selected ? 'Selected for estimate' : 'Add to estimate';
    });

    updateCheckoutLinks();
  };

  checkoutButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const rawPrice = button.dataset.price;
      const item = {
        id: button.dataset.title,
        title: button.dataset.title,
        price: rawPrice ? Number(rawPrice) : NaN,
        prefix: button.dataset.prefix || '',
        frequency: button.dataset.frequency || '',
        due: button.dataset.due || 'full',
        note: button.dataset.note || '',
      };

      if (selectedCheckoutItems.has(item.id)) {
        selectedCheckoutItems.delete(item.id);
      } else {
        selectedCheckoutItems.set(item.id, item);
      }
      renderCheckout();
    });
  });

  if (checkoutList) {
    checkoutList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove-checkout]');
      if (!button) return;
      selectedCheckoutItems.delete(button.dataset.removeCheckout);
      renderCheckout();
    });
  }

  checkoutFields.forEach((field) => {
    field.addEventListener('input', updateCheckoutLinks);
  });

  renderCheckout();

  /* ---------- Orbs: CSS-var parallax (no layout thrash) ---------- */
  const orbs = document.querySelectorAll('.orb');
  const bgEl = document.querySelector('.bg');
  if (orbs.length && bgEl && !prefersReducedMotion) {
    let ticking2 = false;
    const onScrollOrbs = () => {
      const y = window.scrollY;
      orbs.forEach((o, i) => {
        const dy = y * (i + 1) * -0.04;
        o.style.transform = `translate3d(0, ${dy}px, 0)`;
      });
      ticking2 = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking2) { ticking2 = true; requestAnimationFrame(onScrollOrbs); }
    }, { passive: true });
  }

  /* ---------- Hero panel: subtle mouse tilt ---------- */
  const heroPanel = document.querySelector('.hero__panel');
  const heroGlass = document.querySelector('.glass--hero');
  if (heroPanel && heroGlass && !isCoarse && !prefersReducedMotion) {
    heroPanel.addEventListener('mousemove', (e) => {
      const rect = heroPanel.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width  - 0.5;
      const py = (e.clientY - rect.top)  / rect.height - 0.5;
      heroGlass.style.transform = `rotateX(${8 - py * 14}deg) rotateY(${-10 + px * 14}deg) translateZ(0)`;
    });
    heroPanel.addEventListener('mouseleave', () => {
      heroGlass.style.transform = '';
    });
  }
})();
