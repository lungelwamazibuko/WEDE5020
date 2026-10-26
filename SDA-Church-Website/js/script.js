(() => {
  'use strict';

  if (window.dcSimpleEffectsLoaded) return;
  window.dcSimpleEffectsLoaded = true;

  const style = document.createElement('style');
  style.textContent = `
    img {
      transition: filter .18s ease, box-shadow .18s ease;
    }
    img:not([alt="Church Logo"]):hover {
      filter: brightness(1.04);
      box-shadow: 0 5px 16px rgba(31, 58, 95, .16);
    }
    .dc-back-to-top {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 999;
      display: none;
      width: 44px;
      height: 44px;
      border: 0;
      border-radius: 50%;
      background: #1F3A5F;
      color: #fff;
      font: 700 22px/1 sans-serif;
      cursor: pointer;
      box-shadow: 0 3px 12px rgba(0, 0, 0, .2);
    }
    .dc-back-to-top.is-visible { display: block; }
    .dc-back-to-top:hover { background: #C9A227; color: #1F3A5F; }
    .dc-image-viewer {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(15, 30, 48, .92);
      cursor: zoom-out;
    }
    .dc-image-viewer.is-open { display: flex; }
    .dc-image-viewer img {
      display: block;
      max-width: min(100%, 1100px);
      max-height: 85vh;
      width: auto;
      height: auto;
      object-fit: contain;
      box-shadow: none;
    }
    .dc-image-viewer img:hover { box-shadow: none; filter: none; }
    .dc-image-viewer button {
      position: absolute;
      top: 16px;
      right: 18px;
      width: 42px;
      height: 42px;
      border: 1px solid rgba(255,255,255,.65);
      border-radius: 50%;
      background: #1F3A5F;
      color: #fff;
      font-size: 26px;
      cursor: pointer;
    }
    @media (prefers-reduced-motion: reduce) {
      img { transition: none; }
    }
  `;
  document.head.appendChild(style);

  const topButton = document.createElement('button');
  topButton.className = 'dc-back-to-top';
  topButton.type = 'button';
  topButton.setAttribute('aria-label', 'Back to top');
  topButton.title = 'Back to top';
  topButton.textContent = '↑';
  document.body.appendChild(topButton);

  const updateTopButton = () => {
    topButton.classList.toggle('is-visible', window.scrollY > 300);
  };

  window.addEventListener('scroll', updateTopButton, { passive: true });
  updateTopButton();
  topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'auto' }));

  const viewer = document.createElement('div');
  viewer.className = 'dc-image-viewer';
  viewer.setAttribute('role', 'dialog');
  viewer.setAttribute('aria-modal', 'true');
  viewer.setAttribute('aria-label', 'Image preview');
  viewer.innerHTML = '<button type="button" aria-label="Close image preview">×</button><img alt="">';
  document.body.appendChild(viewer);

  const viewerImage = viewer.querySelector('img');
  const closeButton = viewer.querySelector('button');
  let previousFocus = null;

  const closeViewer = () => {
    viewer.classList.remove('is-open');
    document.body.style.overflow = '';
    viewerImage.removeAttribute('src');
    if (previousFocus) previousFocus.focus();
  };

  document.querySelectorAll('img').forEach(img => {
    if (img.closest('.dc-image-viewer')) return;
    if (img.alt === 'Church Logo' || img.alt.toLowerCase().includes('qr code')) return;
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      previousFocus = img;
      viewerImage.src = img.currentSrc || img.src;
      viewerImage.alt = img.alt || 'Expanded image';
      viewer.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      closeButton.focus();
    });
  });

  closeButton.addEventListener('click', closeViewer);
  viewer.addEventListener('click', event => {
    if (event.target === viewer) closeViewer();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && viewer.classList.contains('is-open')) closeViewer();
  });
})();
