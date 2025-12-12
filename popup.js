document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  // Tab Switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  loadData();
});

function loadData() {
  chrome.storage.local.get(null, (items) => {
    const data = [];
    
    // Normalize data
    for (const [url, value] of Object.entries(items)) {
      let entry = { url, rating: 0, tags: [] };
      
      if (typeof value === 'number') {
        entry.rating = value;
      } else if (typeof value === 'object') {
        entry.rating = value.rating || 0;
        entry.tags = value.tags || [];
      }
      
      if (entry.rating > 0) {
        data.push(entry);
      }
    }

    renderByRating(data);
    renderByTags(data);
  });
}

function renderByRating(data) {
  const container = document.getElementById('rating-view');
  container.innerHTML = '';

  const groups = { 5: [], 4: [], 3: [], 2: [], 1: [] };
  data.forEach(item => {
    if (groups[item.rating]) groups[item.rating].push(item);
  });

  Object.keys(groups).sort((a, b) => b - a).forEach(rating => {
    const items = groups[rating];
    if (items.length === 0) return;

    const header = document.createElement('div');
    header.className = 'group-header';
    header.textContent = `${rating} Stars (${items.length})`;
    container.appendChild(header);

    const list = document.createElement('ul');
    list.className = 'item-list';
    
    items.forEach(item => {
      const li = createItemElement(item);
      list.appendChild(li);
    });
    container.appendChild(list);
  });
}

function renderByTags(data) {
  const container = document.getElementById('tag-view');
  container.innerHTML = '';

  const groups = {};
  const untagged = [];

  data.forEach(item => {
    if (!item.tags || item.tags.length === 0) {
      untagged.push(item);
    } else {
      item.tags.forEach(tag => {
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push(item);
      });
    }
  });

  const sortedTags = Object.keys(groups).sort();

  sortedTags.forEach(tag => {
    const items = groups[tag];
    const header = document.createElement('div');
    header.className = 'group-header';
    header.textContent = `#${tag} (${items.length})`;
    container.appendChild(header);

    const list = document.createElement('ul');
    list.className = 'item-list';
    
    items.forEach(item => {
      const li = createItemElement(item);
      list.appendChild(li);
    });
    container.appendChild(list);
  });

  if (untagged.length > 0) {
    const header = document.createElement('div');
    header.className = 'group-header';
    header.textContent = 'Untagged';
    container.appendChild(header);

    const list = document.createElement('ul');
    list.className = 'item-list';
    
    untagged.forEach(item => {
      const li = createItemElement(item);
      list.appendChild(li);
    });
    container.appendChild(list);
  }
}

function createItemElement(item) {
  const li = document.createElement('li');
  
  const link = document.createElement('a');
  link.href = item.url;
  link.textContent = item.url;
  link.target = '_blank';
  li.appendChild(link);

  const meta = document.createElement('div');
  meta.className = 'item-meta';
  
  const ratingSpan = document.createElement('span');
  ratingSpan.textContent = `${item.rating} ★`;
  meta.appendChild(ratingSpan);

  if (item.tags && item.tags.length > 0) {
    const tagsSpan = document.createElement('span');
    item.tags.forEach(tag => {
      const badge = document.createElement('span');
      badge.className = 'tag-badge';
      badge.textContent = tag;
      tagsSpan.appendChild(badge);
    });
    meta.appendChild(tagsSpan);
  }

  li.appendChild(meta);
  return li;
}
