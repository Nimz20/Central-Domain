(() => {
  const measurementId = 'G-HKYRSPZ5WD';

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };

  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  const loadAnalytics = () => {
    if (document.querySelector('script[data-ga4-loader]')) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.dataset.ga4Loader = 'true';
    document.head.appendChild(script);
  };

  const queueLoad = () => {
    window.setTimeout(() => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(loadAnalytics, { timeout: 2000 });
        return;
      }
      loadAnalytics();
    }, 4500);
  };

  if (document.readyState === 'complete') {
    queueLoad();
  } else {
    window.addEventListener('load', queueLoad, { once: true });
  }
})();
