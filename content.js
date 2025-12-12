/**
 * Rate & Tag
 */

const TITLE_SELECTOR = 'h3';

function getResultUrl(el) {
  const a = el.closest('a') || el.parentElement?.closest('a') || el.querySelector('a');
  return a?.href || null;
}

function parseData(data) {
  if (typeof data === 'number') return { rating: data, tags: [] };
  if (typeof data === 'object' && data !== null) return { rating: data.rating || 0, tags: data.tags || [] };
  return { rating: 0, tags: [] };
}

function saveData(url, data) {
  if (!chrome?.runtime?.id) return;
  try {
    chrome.storage.local.set({ [url]: data });
  } catch (e) {}
}

function createRatingUI(url, currentData) {
  const container = document.createElement('div');
  container.className = 'browse-rating-container';
  
  container.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  [1, 2, 3, 4, 5].forEach(rating => {
    const star = document.createElement('div');
    star.className = 'browse-rating-star';
    star.dataset.rating = rating;
    star.title = `Rate ${rating}`;
    if (currentData.rating === rating) star.classList.add('active');

    star.addEventListener('click', () => {
      const stars = container.querySelectorAll('.browse-rating-star');
      
      // Toggle logic
      if (currentData.rating === rating) {
        // Unrate
        currentData.rating = 0;
        stars.forEach(s => s.classList.remove('active'));
      } else {
        // Rate
        currentData.rating = rating;
        stars.forEach(s => s.classList.remove('active'));
        star.classList.add('active');
      }
      
      saveData(url, currentData);
    });
    container.appendChild(star);
  });

  const tagBtn = document.createElement('div');
  tagBtn.className = 'browse-rating-tag-btn';
  tagBtn.title = 'Add Tags';
  if (currentData.tags.length > 0) tagBtn.classList.add('active');
  
  const tagInput = document.createElement('input');
  tagInput.type = 'text';
  tagInput.className = 'browse-rating-tag-input';
  tagInput.placeholder = 'Tags (comma sep)';
  tagInput.value = currentData.tags.join(', ');

  tagBtn.addEventListener('click', () => {
    tagInput.classList.toggle('visible');
    if (tagInput.classList.contains('visible')) tagInput.focus();
  });

  tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const tags = tagInput.value.split(',').map(t => t.trim()).filter(t => t);
      currentData.tags = tags;
      saveData(url, currentData);
      tagInput.classList.remove('visible');
      if (tags.length > 0) tagBtn.classList.add('active');
      else tagBtn.classList.remove('active');
    }
  });
  
  tagInput.addEventListener('click', (e) => e.stopPropagation());

  container.appendChild(tagBtn);
  container.appendChild(tagInput);

  return container;
}

function injectReadOnlyRating(el, data) {    
    if (data.rating <= 0) return;
    const span = document.createElement('span');
    span.textContent = ` (${data.rating}*)`;
    span.style.marginLeft = '0.5em';
    span.className = `browse-rating-text-${data.rating}`;
    el.appendChild(span);
}

function processTitle(el) {
  if (el.dataset.browseRatingProcessed) return;
  const url = getResultUrl(el);
  if (!url) return;
  
  el.dataset.browseRatingProcessed = 'true';

  if (!chrome?.runtime?.id) return;
  try {
    chrome.storage.local.get([url], (res) => {
      if (chrome.runtime.lastError) return;
      const data = parseData(res?.[url]);
      if (data.rating > 0) injectReadOnlyRating(el, data);
    });
  } catch (e) {}
}

function injectFloatingWidget() {
    if (document.getElementById('browse-rating-floating-widget')) return;
    if (!chrome?.runtime?.id) return;

    const url = window.location.href;
    try {
      chrome.storage.local.get([url], (res) => {
          if (chrome.runtime.lastError) return;
          const data = parseData(res?.[url]);
          const ui = createRatingUI(url, data);
          
          const wrapper = document.createElement('div');
          wrapper.id = 'browse-rating-floating-widget';
          wrapper.textContent = 'Rate: ';
          wrapper.appendChild(ui);
          document.body.appendChild(wrapper);
      });
    } catch (e) {}
}

function runSearchPage() {
  document.querySelectorAll(TITLE_SELECTOR).forEach(processTitle);
}

function init() {
    const isSearch = window.location.hostname.includes('google.com') && window.location.pathname.startsWith('/search');
    
    if (isSearch) {
        runSearchPage();
        const obs = new MutationObserver((mutations) => {
          if (!chrome?.runtime?.id) {
            obs.disconnect();
            return;
          }
          if (mutations.some(m => m.addedNodes.length)) runSearchPage();
        });
        obs.observe(document.body, { childList: true, subtree: true });
    } else {
        injectFloatingWidget();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
window.addEventListener('load', init);
