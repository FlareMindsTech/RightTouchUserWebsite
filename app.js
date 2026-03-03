/* ============================================================
   app.js – RightTouch Website Logic
   ============================================================ */

// ─── State ────────────────────────────────────────────────
let currentPage = 'home';

// ─── Navigation ───────────────────────────────────────────
function navigate(page, triggerEl) {
  if (currentPage === page) return;

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));

  // Show target page
  const target = document.getElementById('page-' + page);
  if (target) {
    target.classList.remove('hidden');
    target.scrollTop = 0;
  }

  // Scroll page-wrapper to top
  const wrapper = document.getElementById('pageWrapper');
  if (wrapper) wrapper.scrollTo({ top: 0 });

  // Update desktop navbar active state
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  // Update bottom navbar active state
  document.querySelectorAll('.bottom-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.page === page);
  });

  currentPage = page;
}

// ─── Service search filter ─────────────────────────────────
function filterServices() {
  const query = document.getElementById('serviceSearch').value.toLowerCase().trim();
  document.querySelectorAll('#serviceGrid .service-card').forEach(card => {
    const name = card.dataset.service.toLowerCase();
    card.style.display = name.includes(query) ? '' : 'none';
  });
}

// ─── Service data map ─────────────────────────────────────
const SERVICE_DATA = {
  'Appliance Repair': {
    rating: '4.7', bookings: '1.2M bookings',
    subcats: [
      { icon: '❄️', name: 'AC Repair' },
      { icon: '🫧', name: 'Washing Machine' },
      { icon: '📺', name: 'Television' },
      { icon: '🧊', name: 'Refrigerator' },
      { icon: '💧', name: 'Water Purifier' }
    ],
    sections: [
      {
        title: 'AC Repair & Service',
        items: [
          { name: 'AC Gas Refill', rating: '4.8', reviews: '200K reviews', price: '₹1,499', duration: '60 mins', img: '❄️', bullets: ['Refrigerant top-up for optimal cooling', 'Pressure check & leak detection'] },
          { name: 'AC Deep Clean', rating: '4.7', reviews: '95K reviews', price: '₹799', duration: '45 mins', img: '🧊', bullets: ['Foam-jet cleaning of indoor unit', 'Wash of filters, coil & chassis'] }
        ]
      },
      {
        title: 'Washing Machine',
        items: [
          { name: 'Drum Cleaning', rating: '4.6', reviews: '60K reviews', price: '₹499', duration: '30 mins', img: '🫧', bullets: ['Deep clean of drum & gasket', 'Removable parts washed separately'] }
        ]
      }
    ]
  },
  'Electricians': {
    rating: '4.6', bookings: '980K bookings',
    subcats: [
      { icon: '🔌', name: 'Wiring' },
      { icon: '💡', name: 'Lighting' },
      { icon: '🔧', name: 'Switchboard' },
      { icon: '⚡', name: 'MCB / Fuse' },
      { icon: '🖥️', name: 'Appliance' }
    ],
    sections: [
      {
        title: 'Wiring & Switchboard',
        items: [
          { name: 'Switchboard repair', rating: '4.6', reviews: '100K reviews', price: '₹299', duration: '30 mins', img: '🔌', bullets: ['Replace faulty switches & sockets', 'Inspect wiring for hazards'] },
          { name: 'Fan installation', rating: '4.7', reviews: '80K reviews', price: '₹199', duration: '20 mins', img: '💡', bullets: ['Ceiling/wall fan wiring & fitting', 'Includes balancing & speed test'] }
        ]
      }
    ]
  },
  'House Cleaning': {
    rating: '4.5', bookings: '640K bookings',
    subcats: [
      { icon: '🛋️', name: 'Sofa' },
      { icon: '🪟', name: 'Windows' },
      { icon: '🚪', name: 'Full Home' },
      { icon: '🧴', name: 'Bathroom' },
      { icon: '🍽️', name: 'Kitchen' }
    ],
    sections: [
      {
        title: 'Full Home Cleaning',
        items: [
          { name: '2BHK Deep Clean', rating: '4.5', reviews: '50K reviews', price: '₹1,199', duration: '3 hrs', img: '🛋️', bullets: ['All rooms, kitchen & bathrooms', 'Floor scrub, surface wipe & dusting'] },
          { name: 'Sofa & carpet shampooing', rating: '4.4', reviews: '30K reviews', price: '₹799', duration: '1.5 hrs', img: '🪟', bullets: ['Steam extracton method used', 'Removes stains and odour'] }
        ]
      }
    ]
  },
  'Carpenter': {
    rating: '4.5', bookings: '340K bookings',
    subcats: [
      { icon: '🚪', name: 'Door Repair' },
      { icon: '🛏️', name: 'Furniture' },
      { icon: '🪚', name: 'Drilling' },
      { icon: '🖼️', name: 'Wall Mount' },
      { icon: '🔩', name: 'Assembly' }
    ],
    sections: [
      {
        title: 'Furniture & Fixtures',
        items: [
          { name: 'Door hinge repair', rating: '4.5', reviews: '40K reviews', price: '₹249', duration: '30 mins', img: '🚪', bullets: ['Tighten or replace broken hinges', 'Door alignment adjustment'] },
          { name: 'Furniture assembly', rating: '4.6', reviews: '55K reviews', price: '₹399', duration: '45 mins', img: '🛏️', bullets: ['Flat-pack assembly for any brand', 'Includes hardware & anchoring'] }
        ]
      }
    ]
  },
  'Plumber': {
    rating: '4.6', bookings: '820K bookings',
    subcats: [
      { icon: '🚿', name: 'Shower' },
      { icon: '🚰', name: 'Tap/Pipe' },
      { icon: '🪠', name: 'Drain' },
      { icon: '🚽', name: 'Toilet' },
      { icon: '🔩', name: 'Fitting' }
    ],
    sections: [
      {
        title: 'Pipe & Drain',
        items: [
          { name: 'Leaking tap repair', rating: '4.6', reviews: '120K reviews', price: '₹199', duration: '20 mins', img: '🚰', bullets: ['Washer or valve replacement', 'Works on all tap types'] },
          { name: 'Drain unblocking', rating: '4.5', reviews: '75K reviews', price: '₹349', duration: '30 mins', img: '🪠', bullets: ['High-pressure jet cleaning', 'Works on kitchen & bathroom drains'] }
        ]
      }
    ]
  },
  'Kitchen Cleaning': {
    rating: '4.8', bookings: '845K bookings',
    subcats: [
      { icon: '🪣', name: 'Chimney cleaning' },
      { icon: '🍳', name: 'Kitchen cleaning' },
      { icon: '🔧', name: 'Appliance cleaning' },
      { icon: '🪵', name: 'Cabinets & tiles' },
      { icon: '🫙', name: 'Mini services' }
    ],
    sections: [
      {
        title: 'Chimney cleaning',
        items: [
          { name: 'Chimney cleaning', rating: '4.8', reviews: '100K reviews', price: '₹399', duration: '45 mins', img: '🪣', bullets: ['Chimney exterior, mesh & filter cleaning with a steam machine', 'Excludes motor cleaning & repair'] },
          { name: 'Chimney & stove cleaning', rating: '4.5', reviews: '24K reviews', price: '₹499', duration: '1 hr 15 mins', img: '🍳', bullets: ['Stovetops, burners, knobs, chimney mesh & filter cleaning with steam', 'Excludes motor cleaning & repair'] }
        ]
      },
      {
        title: 'Kitchen cleaning',
        items: [
          { name: 'Full kitchen deep clean', rating: '4.7', reviews: '38K reviews', price: '₹799', duration: '2 hrs', img: '🍽️', bullets: ['Counter tops, hob, sink, cabinet exteriors', 'Floor scrub & appliance surface wipe'] }
        ]
      }
    ]
  },
  'Bathroom Cleaning': {
    rating: '4.6', bookings: '510K bookings',
    subcats: [
      { icon: '🚿', name: 'Shower area' },
      { icon: '🚽', name: 'Toilet' },
      { icon: '🪟', name: 'Tiles & walls' },
      { icon: '🪥', name: 'Sink & mirror' },
      { icon: '💧', name: 'Drain' }
    ],
    sections: [
      {
        title: 'Complete Bathroom Clean',
        items: [
          { name: 'Standard bathroom clean', rating: '4.6', reviews: '85K reviews', price: '₹449', duration: '45 mins', img: '🚿', bullets: ['Toilet, sink, floors & tiles scrubbed', 'Mirror & fixtures wiped clean'] },
          { name: 'Deep tile & grout clean', rating: '4.5', reviews: '32K reviews', price: '₹649', duration: '1 hr', img: '🪟', bullets: ['Steam scrubbing of tiles & grout lines', 'Anti-bacterial treatment applied'] }
        ]
      }
    ]
  },
  'Pest Control': {
    rating: '4.5', bookings: '290K bookings',
    subcats: [
      { icon: '🐜', name: 'Cockroaches' },
      { icon: '🦟', name: 'Mosquitoes' },
      { icon: '🐭', name: 'Rodents' },
      { icon: '🕷️', name: 'Spiders' },
      { icon: '🐝', name: 'Bees/Wasps' }
    ],
    sections: [
      {
        title: 'General Pest Treatment',
        items: [
          { name: 'Cockroach control (1BHK)', rating: '4.5', reviews: '65K reviews', price: '₹599', duration: '45 mins', img: '🐜', bullets: ['Gel-bait method – no smell, no residue', 'Safe for children & pets'] },
          { name: 'General pest spray (2BHK)', rating: '4.4', reviews: '40K reviews', price: '₹999', duration: '1 hr', img: '🦟', bullets: ['Covers cockroaches, ants & spiders', 'WHO-approved chemicals used'] }
        ]
      }
    ]
  }
};

// ─── Cart state ───────────────────────────────────────────
let cart = {}; // { itemName: { qty, price } }

// ─── Open service detail bottom sheet ─────────────────────
function openServiceDetail(name) {
  const data = SERVICE_DATA[name];
  if (!data) return;

  // Reset cart for new sheet open
  cart = {};

  // Set header text
  document.getElementById('sheetTitle').textContent = name;
  document.getElementById('sheetRatingVal').textContent = data.rating;
  document.getElementById('sheetRatingCount').textContent = '(' + data.bookings + ')';

  // Build sub-category pills
  const subcatEl = document.getElementById('sheetSubcats');
  subcatEl.innerHTML = data.subcats.map((s, i) =>
    `<div class="subcat-pill ${i === 0 ? 'active' : ''}" onclick="selectSubcat(this, '${s.name}')">
       <div class="subcat-img-wrap">${s.icon}</div>
       <span class="subcat-name">${s.name}</span>
     </div>`
  ).join('');

  // Build service item sections
  renderSheetSections(data.sections);

  // Hide cart bar
  document.getElementById('sheetCartBar').classList.add('hidden');

  // Open
  document.getElementById('sheetBackdrop').classList.add('open');
  document.getElementById('serviceSheet').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function renderSheetSections(sections) {
  const body = document.getElementById('sheetBody');
  let html = '';
  sections.forEach((sec, si) => {
    if (si > 0) html += '<div class="sheet-divider"></div>';
    html += `<div class="sheet-section-title">${sec.title}</div>`;
    sec.items.forEach(item => {
      const safeId = 'item_' + item.name.replace(/[^a-z0-9]/gi, '_');
      html += `
        <div class="sheet-item" id="${safeId}_row">
          <div class="sheet-item-info">
            <div class="sheet-item-name">${item.name}</div>
            <div class="sheet-item-meta">
              <span class="item-star">★</span>
              <span class="item-rating">${item.rating}</span>
              <span class="item-reviews">${item.reviews}</span>
              <span class="item-dot">·</span>
              <span class="item-duration">⏱ ${item.duration}</span>
            </div>
            <div class="sheet-item-price">${item.price}</div>
            <div class="sheet-item-bullets">
              ${item.bullets.map(b => `<div class="sheet-item-bullet"><span class="bullet-plus">+</span>${b}</div>`).join('')}
            </div>
            <button class="view-details-btn" onclick="showToast('📋 Full details for: ${item.name}')">
              View details ›
            </button>
          </div>
          <div class="sheet-item-right">
            <div class="sheet-item-img">${item.img}</div>
            <div id="${safeId}_ctrl">
              <button class="add-btn" onclick="addToCart('${item.name}', '${item.price}', '${safeId}')">Add</button>
            </div>
          </div>
        </div>`;
    });
  });
  body.innerHTML = html;
}

// ─── Sub-cat pill selection ───────────────────────────────
function selectSubcat(el, name) {
  document.querySelectorAll('.subcat-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  // Scroll to section with matching title (fuzzy)
  const body = document.getElementById('sheetBody');
  const allTitles = body.querySelectorAll('.sheet-section-title');
  allTitles.forEach(t => {
    if (t.textContent.toLowerCase().includes(name.toLowerCase().split(' ')[0])) {
      t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

// ─── Add to cart ─────────────────────────────────────────
function addToCart(itemName, priceStr, safeId) {
  const priceNum = parseInt(priceStr.replace(/[^\d]/g, '')) || 0;
  if (!cart[itemName]) {
    cart[itemName] = { qty: 1, price: priceNum };
  } else {
    cart[itemName].qty++;
  }
  renderCtrl(safeId, itemName, priceNum);
  updateCartBar();
}

function changeQty(safeId, itemName, priceNum, delta) {
  if (!cart[itemName]) return;
  cart[itemName].qty += delta;
  if (cart[itemName].qty <= 0) {
    delete cart[itemName];
    // Restore Add button
    document.getElementById(safeId + '_ctrl').innerHTML =
      `<button class="add-btn" onclick="addToCart('${itemName}', '₹${priceNum}', '${safeId}')">Add</button>`;
  } else {
    renderCtrl(safeId, itemName, priceNum);
  }
  updateCartBar();
}

function renderCtrl(safeId, itemName, priceNum) {
  const qty = cart[itemName] ? cart[itemName].qty : 0;
  document.getElementById(safeId + '_ctrl').innerHTML = `
    <div class="qty-stepper">
      <button class="qty-btn" onclick="changeQty('${safeId}','${itemName}',${priceNum},-1)">−</button>
      <span class="qty-val">${qty}</span>
      <button class="qty-btn" onclick="changeQty('${safeId}','${itemName}',${priceNum},1)">+</button>
    </div>`;
}

function updateCartBar() {
  const bar = document.getElementById('sheetCartBar');
  const keys = Object.keys(cart);
  if (keys.length === 0) {
    bar.classList.add('hidden');
    return;
  }
  bar.classList.remove('hidden');
  const totalItems = keys.reduce((s, k) => s + cart[k].qty, 0);
  const totalPrice = keys.reduce((s, k) => s + cart[k].qty * cart[k].price, 0);
  document.getElementById('cartCount').textContent = totalItems + (totalItems === 1 ? ' item' : ' items');
  document.getElementById('cartTotal').textContent = '₹' + totalPrice.toLocaleString('en-IN');
}

// ─── Close service sheet ──────────────────────────────────
function closeServiceSheet() {
  document.getElementById('sheetBackdrop').classList.remove('open');
  document.getElementById('serviceSheet').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── Keep openService (home page category click) ──────────
function openService(name) {
  // Navigate to services first, then open the sheet
  if (currentPage !== 'services') {
    currentPage = '';
    navigate('services', null);
  }
  // Map home category names → service keys
  const map = { 'Television': 'Appliance Repair', 'Washing Machine': 'Appliance Repair', 'Refrigerator': 'Appliance Repair', 'AC': 'Appliance Repair' };
  const key = map[name] || name;
  setTimeout(() => openServiceDetail(key), 150);
}

// ─── Bottom-sheet swipe-to-dismiss ───────────────────────
function initSheetSwipe() {
  const sheet = document.getElementById('serviceSheet');
  if (!sheet) return;
  let startY = 0, currentY = 0, dragging = false;

  const handle = sheet.querySelector('.sheet-handle');

  function onStart(e) {
    startY = (e.touches ? e.touches[0].clientY : e.clientY);
    currentY = startY;
    dragging = true;
  }

  function onMove(e) {
    if (!dragging) return;
    currentY = (e.touches ? e.touches[0].clientY : e.clientY);
    const diff = Math.max(0, currentY - startY);
    sheet.style.transition = 'none';
    sheet.style.transform = `translateY(${diff}px)`;
    if (window.innerWidth >= 540) {
      sheet.style.transform = `translateX(-50%) translateY(${diff}px)`;
    }
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;
    sheet.style.transition = '';
    const diff = currentY - startY;
    if (diff > 100) {
      closeServiceSheet();
    } else {
      sheet.style.transform = '';
      if (window.innerWidth >= 540) {
        sheet.style.transform = 'translateX(-50%) translateY(0)';
      }
    }
  }

  handle.addEventListener('touchstart', onStart, { passive: true });
  handle.addEventListener('touchmove', onMove, { passive: true });
  handle.addEventListener('touchend', onEnd);
  handle.addEventListener('mousedown', onStart);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);
}



// ─── Chat window ──────────────────────────────────────────
function openChat(name) {
  const win = document.getElementById('chatWindow');
  const nameEl = document.getElementById('chatWinName');
  const avatarEl = document.getElementById('chatWinAvatar');
  if (!win) return;

  nameEl.textContent = name;
  // Simple color mapping
  const colors = { 'Rajesh Kumar': '#22c55e', 'Support Team': '#3b82f6', 'Plumber Pro': '#f59e0b', 'House Cleaner': '#8b5cf6' };
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  avatarEl.style.background = colors[name] || '#22c55e';
  avatarEl.textContent = initials;
  avatarEl.style.display = 'grid';
  avatarEl.style.placeItems = 'center';
  avatarEl.style.color = '#fff';
  avatarEl.style.fontWeight = '700';
  avatarEl.style.fontSize = '14px';

  win.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeChat() {
  const win = document.getElementById('chatWindow');
  if (win) win.classList.add('hidden');
  document.body.style.overflow = '';
}

function sendMsg(e) {
  if (e.key === 'Enter') sendMsgBtn();
}

function sendMsgBtn() {
  const input = document.getElementById('chatInput');
  const msgs = document.getElementById('chatMessages');
  const text = input.value.trim();
  if (!text) return;

  const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const msgEl = document.createElement('div');
  msgEl.className = 'msg msg-sent';
  msgEl.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div><div class="msg-time">${now}</div>`;
  msgs.appendChild(msgEl);
  input.value = '';
  msgs.scrollTop = msgs.scrollHeight;

  // Auto reply after delay
  setTimeout(() => {
    const replies = [
      'Thank you for your message! Our team will get back to you shortly.',
      'Got it! We\'ll send a technician to your location soon. 😊',
      'Your request has been noted. Is there anything else I can help you with?',
      'We\'re on it! Expected arrival time is within 30–45 minutes.'
    ];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    const replyEl = document.createElement('div');
    replyEl.className = 'msg msg-received';
    const replyTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    replyEl.innerHTML = `<div class="msg-bubble">${reply}</div><div class="msg-time">${replyTime}</div>`;
    msgs.appendChild(replyEl);
    msgs.scrollTop = msgs.scrollHeight;
  }, 1200 + Math.random() * 800);
}

// ─── Dark Mode ────────────────────────────────────────────
function toggleDark() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('rt-dark', isDark);
}

// ─── Toast ────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ─── HTML escape ──────────────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Drag-to-scroll carousels ─────────────────────────────
function initCarousels() {
  document.querySelectorAll('.carousel-track').forEach(track => {
    let isDown = false, startX, scrollLeft;

    track.addEventListener('mousedown', e => {
      isDown = true;
      track.classList.add('grabbing');
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });

    document.addEventListener('mouseup', () => {
      isDown = false;
      track.classList.remove('grabbing');
    });

    track.addEventListener('mouseleave', () => {
      isDown = false;
      track.classList.remove('grabbing');
    });

    track.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.4;
      track.scrollLeft = scrollLeft - walk;
    });

    // Touch support
    let touchStartX, touchScrollLeft;
    track.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].pageX - track.offsetLeft;
      touchScrollLeft = track.scrollLeft;
    }, { passive: true });

    track.addEventListener('touchmove', e => {
      const x = e.touches[0].pageX - track.offsetLeft;
      const walk = (x - touchStartX) * 1.2;
      track.scrollLeft = touchScrollLeft - walk;
    }, { passive: true });
  });
}

// ─── Chat tabs ────────────────────────────────────────────
function initChatTabs() {
  document.querySelectorAll('.chat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}

// ─── Scroll-based navbar shadow ───────────────────────────
function initScrollEffects() {
  const navbar = document.getElementById('topNavbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)';
    } else {
      navbar.style.boxShadow = '';
    }
  }, { passive: true });
}

// ─── Bottom nav click animation ───────────────────────────
function initBottomNavEffects() {
  document.querySelectorAll('.bottom-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      this.style.transform = 'scale(0.9)';
      setTimeout(() => { this.style.transform = ''; }, 150);
    });
  });
}

// ─── Persisted preferences ────────────────────────────────
function loadPreferences() {
  const isDark = localStorage.getItem('rt-dark') === 'true';
  if (isDark) {
    document.body.classList.add('dark');
    const toggleEl = document.getElementById('darkToggle');
    if (toggleEl) toggleEl.checked = true;
  }
}

// ─── Ripple effect on cards ───────────────────────────────
function initRipple() {
  document.querySelectorAll('.service-card, .category-card, .appliance-card, .offer-card').forEach(el => {
    el.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.cssText = `
        position:absolute;
        width:${size}px;height:${size}px;
        left:${e.clientX - rect.left - size/2}px;
        top:${e.clientY - rect.top - size/2}px;
        background:rgba(34,197,94,0.2);
        border-radius:50%;
        transform:scale(0);
        animation:rippleAnim 0.5s ease-out forwards;
        pointer-events:none;
      `;
      const prevPos = this.style.position;
      if (!prevPos || prevPos === 'static') this.style.position = 'relative';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Add ripple keyframes
  if (!document.getElementById('rippleStyle')) {
    const style = document.createElement('style');
    style.id = 'rippleStyle';
    style.textContent = '@keyframes rippleAnim { to { transform:scale(3); opacity:0; } }';
    document.head.appendChild(style);
  }
}

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadPreferences();
  initCarousels();
  initChatTabs();
  initScrollEffects();
  initBottomNavEffects();
  initSheetSwipe();
  // Short delay for ripple (wait for all cards to render)
  setTimeout(initRipple, 200);

  // Show home page initially
  navigate('home', null);
  // Re-set currentPage since navigate guards same page
  currentPage = '';
  navigate('home', null);
});

