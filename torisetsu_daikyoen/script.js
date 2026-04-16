/* ============================================
   ライブトリセツ 2026 — script.js
   ============================================ */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- DOM refs ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const scrollProgress = document.querySelector('.scroll-progress');
  const toastEl = document.getElementById('toast');
  const tabIndicator = document.getElementById('tab-indicator');

  // --- Tab indicator ---
  function updateTabIndicator(animate) {
    const activeBtn = document.querySelector('.tab-btn.active');
    if (!activeBtn || !tabIndicator) return;
    var parent = activeBtn.parentElement;
    var parentRect = parent.getBoundingClientRect();
    var btnRect = activeBtn.getBoundingClientRect();
    var left = btnRect.left - parentRect.left + parent.scrollLeft;

    if (animate === false) {
      tabIndicator.style.transition = 'none';
    } else {
      tabIndicator.style.transition = '';
    }
    tabIndicator.style.width = btnRect.width + 'px';
    tabIndicator.style.transform = 'translateX(' + left + 'px)';
  }

  // --- Tab ripple ---
  function createRipple(e, btn) {
    if (prefersReducedMotion) return;
    var ripple = document.createElement('span');
    ripple.className = 'tab-ripple';
    var rect = btn.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height) * 1.5;
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', function () { ripple.remove(); });
  }

  // --- Tab switching ---
  function switchTab(tabId, updateHash) {
    tabBtns.forEach(function (btn) { btn.classList.remove('active'); });
    tabPanels.forEach(function (panel) { panel.classList.remove('active'); });

    var targetBtn = document.querySelector('.tab-btn[data-tab="' + tabId + '"]');
    var targetPanel = document.getElementById(tabId);

    if (targetBtn) targetBtn.classList.add('active');
    if (targetPanel) {
      targetPanel.classList.add('active');
      targetPanel.style.animation = 'none';
      targetPanel.offsetHeight;
      targetPanel.style.animation = '';
    }

    if (targetBtn) {
      targetBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    window.scrollTo({ top: 0, behavior: 'instant' });

    if (updateHash) {
      history.replaceState(null, '', '#' + tabId);
    }

    updateTabIndicator(true);

    var searchInput = document.getElementById('search-input');
    if (searchInput && searchInput.value.trim()) {
      highlightCurrentPanel(searchInput.value.trim());
    }
  }

  // Tab click handlers
  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      createRipple(e, btn);
      var tabId = btn.dataset.tab;
      if (document.startViewTransition && !prefersReducedMotion) {
        document.startViewTransition(function () { switchTab(tabId, true); });
      } else {
        switchTab(tabId, true);
      }
    });
  });

  // --- Hash navigation ---
  function handleHash() {
    var hash = window.location.hash.slice(1);
    if (hash) {
      var valid = Array.from(tabBtns).some(function (btn) { return btn.dataset.tab === hash; });
      if (valid) { switchTab(hash, false); return; }
    }
    switchTab('principles', false);
  }

  // --- Scroll progress ---
  function updateScrollProgress() {
    if (!scrollProgress) return;
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
    scrollProgress.style.transform = 'scaleX(' + progress + ')';
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      updateScrollProgress();
      ticking = false;
    });
  }

  // --- Swipe between tabs ---
  var touchStartX = 0;
  var touchStartY = 0;
  var isSwiping = false;

  function getActiveTabIndex() {
    return Array.from(tabBtns).findIndex(function (btn) { return btn.classList.contains('active'); });
  }

  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwiping = false;
  }

  function handleTouchEnd(e) {
    if (!isSwiping) return;
    var touchEndX = e.changedTouches[0].clientX;
    var diffX = touchStartX - touchEndX;
    if (Math.abs(diffX) < 60) return;

    var currentIndex = getActiveTabIndex();
    var nextIndex;
    if (diffX > 0) {
      nextIndex = Math.min(currentIndex + 1, tabBtns.length - 1);
    } else {
      nextIndex = Math.max(currentIndex - 1, 0);
    }

    if (nextIndex !== currentIndex) {
      var tabId = tabBtns[nextIndex].dataset.tab;
      if (document.startViewTransition && !prefersReducedMotion) {
        document.startViewTransition(function () { switchTab(tabId, true); });
      } else {
        switchTab(tabId, true);
      }
    }
  }

  function handleTouchMove(e) {
    var diffX = Math.abs(e.touches[0].clientX - touchStartX);
    var diffY = Math.abs(e.touches[0].clientY - touchStartY);
    if (diffX > 20 && diffX > diffY * 1.5) {
      isSwiping = true;
    }
  }

  // --- Toast ---
  var toastTimer;
  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2500);
  }

  // --- Card tilt (desktop) ---
  function initCardTilt() {
    if (prefersReducedMotion) return;
    if (!window.matchMedia('(hover: hover)').matches) return;

    document.querySelectorAll('.principle-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = 'perspective(600px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg) scale(1.01)';
      });

      card.addEventListener('mouseleave', function () {
        card.style.transition = 'transform 0.5s ease';
        card.style.transform = '';
        setTimeout(function () { card.style.transition = ''; }, 500);
      });
    });
  }

  // --- Search ---
  function initSearch() {
    var searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    tabBtns.forEach(function (btn) {
      var badge = document.createElement('span');
      badge.className = 'search-badge';
      btn.appendChild(badge);
    });

    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        searchInput.value = '';
        searchInput.blur();
        clearAllSearch();
      }
    });

    var searchTimer;
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        var query = searchInput.value.trim();
        if (query.length === 0) { clearAllSearch(); return; }
        searchAllTabs(query);
      }, 250);
    });
  }

  function searchAllTabs(query) {
    var lowerQuery = query.toLowerCase();
    tabBtns.forEach(function (btn) { btn.classList.remove('has-results'); });

    tabPanels.forEach(function (panel) {
      var panelId = panel.id;
      var tabBtn = document.querySelector('.tab-btn[data-tab="' + panelId + '"]');
      var accordions = panel.querySelectorAll('.accordion');
      var hasMatch = false;

      accordions.forEach(function (acc) {
        if (acc.textContent.toLowerCase().includes(lowerQuery)) hasMatch = true;
      });

      if (tabBtn && hasMatch) tabBtn.classList.add('has-results');
    });

    var principlesPanel = document.getElementById('principles');
    if (principlesPanel) {
      var principleText = principlesPanel.textContent.toLowerCase();
      var principlesBtn = document.querySelector('.tab-btn[data-tab="principles"]');
      if (principleText.includes(lowerQuery) && principlesBtn) {
        principlesBtn.classList.add('has-results');
      }
    }

    highlightCurrentPanel(query);
  }

  function highlightCurrentPanel(query) {
    var lowerQuery = query.toLowerCase();
    var activePanel = document.querySelector('.tab-panel.active');
    if (!activePanel) return;

    clearPanelHighlights(activePanel);

    var accordions = activePanel.querySelectorAll('.accordion');
    if (accordions.length === 0) return;

    var anyMatch = false;
    accordions.forEach(function (acc) {
      if (acc.textContent.toLowerCase().includes(lowerQuery)) {
        acc.classList.remove('search-hidden');
        acc.classList.add('search-match');
        anyMatch = true;
        highlightTextInElement(acc.querySelector('.accordion-q span'), query);
        highlightTextInElement(acc.querySelector('.accordion-a'), query);
        acc.open = true;
      } else {
        acc.classList.add('search-hidden');
        acc.classList.remove('search-match');
      }
    });

    if (!anyMatch) {
      var cards = activePanel.querySelectorAll('.principle-card');
      cards.forEach(function (card) {
        if (card.textContent.toLowerCase().includes(lowerQuery)) {
          highlightTextInElement(card.querySelector('.principle-body'), query);
          highlightTextInElement(card.querySelector('.principle-title'), query);
        }
      });
    }
  }

  function highlightTextInElement(el, query) {
    if (!el) return;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    var lowerQuery = query.toLowerCase();
    textNodes.forEach(function (node) {
      var text = node.textContent;
      var idx = text.toLowerCase().indexOf(lowerQuery);
      if (idx === -1) return;

      var before = text.slice(0, idx);
      var match = text.slice(idx, idx + query.length);
      var after = text.slice(idx + query.length);

      var span = document.createElement('span');
      span.className = 'search-highlight';
      span.textContent = match;

      var parent = node.parentNode;
      if (parent) {
        var frag = document.createDocumentFragment();
        if (before) frag.appendChild(document.createTextNode(before));
        frag.appendChild(span);
        if (after) frag.appendChild(document.createTextNode(after));
        parent.replaceChild(frag, node);
      }
    });
  }

  function clearPanelHighlights(panel) {
    if (!panel) return;
    panel.querySelectorAll('.search-highlight').forEach(function (el) {
      var parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
    panel.querySelectorAll('.accordion').forEach(function (acc) {
      acc.classList.remove('search-hidden', 'search-match');
    });
  }

  function clearAllSearch() {
    tabBtns.forEach(function (btn) { btn.classList.remove('has-results'); });
    tabPanels.forEach(function (panel) { clearPanelHighlights(panel); });
  }

  // --- GSAP hero animation ---
  function initHeroAnimation() {
    if (prefersReducedMotion) return;
    if (typeof gsap === 'undefined') return;

    gsap.from('.principle-card', {
      y: 40, opacity: 0, duration: 0.7,
      stagger: 0.15, ease: 'power2.out',
      delay: 0.6, clearProps: 'all'
    });
  }

  // --- Init ---
  function init() {
    handleHash();
    updateTabIndicator(false);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('resize', function () { updateTabIndicator(false); });

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    initSearch();
    initCardTilt();

    if (typeof gsap !== 'undefined') {
      initHeroAnimation();
    } else {
      window.addEventListener('load', initHeroAnimation);
    }

    updateScrollProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
