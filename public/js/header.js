// scripts.js

let isLoggedIn = false;
let locationChosen = false;
let currentUser = null; // Will hold user data from backend


async function checkAuthAndRenderHeader() {
  try {
    // Always send cookies with the request
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.data && data.data.user) {
        isLoggedIn = true;
        currentUser = data.data.user;
      } else {
        isLoggedIn = false;
        currentUser = null;
      }
    } else {
      isLoggedIn = false;
      currentUser = null;
    }
  } catch {
    isLoggedIn = false;
    currentUser = null;
  }
  renderHeader();
}

document.addEventListener("DOMContentLoaded", () => {
  checkAuthAndRenderHeader();
  const locationBtn1 = document.getElementById("locationBtn1");
  if (locationBtn1) locationBtn1.addEventListener("click", openPopup);
  const mobileLocationBtn = document.getElementById("mobileLocationBtn");
  if (mobileLocationBtn) mobileLocationBtn.addEventListener("click", openPopup);

  // Sidebar event listeners (ensure elements exist)
  const sidebarClose = document.getElementById('sidebarClose');
  if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', function(e) {
    if (e.target === this) closeSidebar();
  });
  const hamburger = document.querySelector('.fa-bars');
  if (hamburger) hamburger.addEventListener('click', openSidebar);
  // Sell Now button in header
  document.addEventListener('click', function(e) {
    if (e.target.closest('.sell-now')) {
      if (isLoggedIn) {
        window.location.href = '/forms/formss';
      } else {
        // Show custom notification popup
        document.querySelectorAll('.notification.signin').forEach(n => n.remove());
        const note = document.createElement('div');
  note.className = 'signin-popup show';
  note.innerHTML = 'Sign in first to sell the item';
        note.style.position = 'fixed';
        note.style.top = '24px';
        note.style.left = '50%';
        note.style.transform = 'translateX(-50%)';
        note.style.background = '#D41717';
        note.style.color = '#fff';
        note.style.padding = '16px 32px';
        note.style.borderRadius = '8px';
        note.style.fontSize = '1.1rem';
        note.style.zIndex = '9999';
        note.style.boxShadow = '0 2px 8px #0002';
        document.body.appendChild(note);
        setTimeout(() => note.remove(), 2000);
      }
    }
  });

  // Delegate click for sidebar 'Sell an Item' (since sidebar is rendered dynamically)
  document.addEventListener('click', function(e) {
    if (e.target && e.target.textContent && e.target.textContent.trim() === 'Sell an Item') {
      window.location.href = '/forms/formss';
    }
    // Delegate click for sidebar 'My Chats'
    if (e.target && e.target.textContent && e.target.textContent.trim() === 'My Chats') {
      window.location.href = '/chat';
    }
    // Delegate click for sidebar 'My Activity'
    if (e.target && e.target.textContent && e.target.textContent.trim() === 'My Activity') {
      window.location.href = '/activity';
    }
    // Delegate click for sidebar 'Edit Profile'
    if (e.target && e.target.textContent && e.target.textContent.trim() === 'Edit Profile') {
      window.location.href = '/profile/edit';
    }
    // Delegate click for sidebar 'About Us'
    if (e.target && e.target.textContent && e.target.textContent.trim() === 'About Us') {
      window.location.href = '/about';
    }

    // Delegate click for sidebar 'Wishlist'
    if (e.target && e.target.textContent && e.target.textContent.trim() === 'Wishlist') {
      window.location.href = '/wishlist';
    }

    // Delegate click for sidebar 'Auction'
    if (e.target && e.target.textContent && e.target.textContent.trim() === 'Auctions') {
      window.location.href = '/';
    }
    //Delegate click for sidebar 'Exclusive Seller Packages'
    if (e.target && e.target.textContent && e.target.textContent.trim() === 'Exclusive Seller Packages') {
      window.location.href = '/packages';
    }
  });

  const savedDistrict = localStorage.getItem("userDistrict");
  const savedPin = localStorage.getItem("userPincode");
  if (savedDistrict && savedPin) {
    updateLocationDisplay(savedDistrict, savedPin);
    locationChosen = true;
    renderHeader();
  }
});

function updateLocationDisplay(district, pin) {
  document.getElementById("locationMain").textContent = district;
  document.getElementById("locationSub").textContent = pin;
  document.getElementById("mobileLocationMain").textContent = district;
  document.getElementById("mobileLocationSub").textContent = pin;
}

function renderHeader() {
  const authBlock = document.getElementById("authBlock");
  console.log("[header.js] renderHeader called. isLoggedIn:", isLoggedIn, "currentUser:", currentUser);
  if (!authBlock) {
    console.error("[header.js] authBlock element not found in DOM");
    return;
  }
  authBlock.innerHTML = "";

  if (isLoggedIn) {
    console.log("[header.js] Rendering logged-in header actions");
    authBlock.innerHTML = `
      <button class="sell-now">
        <i class="bi bi-shop"></i>
        Sell Now
      </button>
      <i class="fa fa-bell notification"></i>
    `;
  } else {
    console.log("[header.js] Rendering guest header actions");
    authBlock.innerHTML = `
      <button class="sell-now">
        <i class="bi bi-shop"></i>
        Sell Now
      </button>
      <button class="sign-in">Sign In</button>
    `;
    // Add click event to sign-in button
    const signInBtn = document.querySelector('.sign-in');
    if (signInBtn) {
      signInBtn.addEventListener('click', function() {
        window.location.href = '/signup';
      });
    }
  }

  if (!locationChosen) {
    document.getElementById("locationMain").textContent = "Choose location";
    document.getElementById("locationSub").textContent = "Click to set";
    document.getElementById("mobileLocationMain").textContent = "Choose location";
    document.getElementById("mobileLocationSub").textContent = "Click to set";
  }
}

/* POPUP */
function openPopup() { document.getElementById("popupOverlay").style.display = "flex"; }
function closePopup() { document.getElementById("popupOverlay").style.display = "none"; }

/* LOCATION LOGIC */
function isValidPincode(pin) { return /^[1-9][0-9]{5}$/.test(pin); }
function showError(msg) {
  document.getElementById("errorMessage").textContent = msg;
  document.getElementById("errorMessage").style.display = "block";
  document.getElementById("successMessage").style.display = "none";
  document.getElementById("loadingMessage").style.display = "none";
}
function showSuccess(msg) {
  document.getElementById("successMessage").textContent = msg;
  document.getElementById("successMessage").style.display = "block";
  document.getElementById("errorMessage").style.display = "none";
  document.getElementById("loadingMessage").style.display = "none";
}
function showLoading() {
  document.getElementById("loadingMessage").style.display = "block";
  document.getElementById("errorMessage").style.display = "none";
  document.getElementById("successMessage").style.display = "none";
}

async function setPincode() {
  const pincode = document.getElementById("pincodeInput").value.trim();
  if (!pincode) return showError("Please enter a pincode");
  if (!isValidPincode(pincode)) return showError("Enter a valid 6-digit pincode");

  showLoading();
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();
    if (data[0].Status === "Success") {
      const district = data[0].PostOffice[0].District;
      saveLocationAndClose(district, pincode);
    } else showError("Invalid pincode");
  } catch { showError("Error fetching location"); }
}

function useCurrentLocation() {
  if (!navigator.geolocation) return showError("Geolocation not supported");
  showLoading();
  navigator.geolocation.getCurrentPosition(async pos => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
      const data = await res.json();
      const district = data.address.state_district || data.address.county || "Unknown";
      const pincode = data.address.postcode || "NA";
      saveLocationAndClose(district, pincode);
    } catch { showError("Failed to fetch location details"); }
  }, () => showError("Failed to get location"));
}

function saveLocationAndClose(district, pin) {
  updateLocationDisplay(district, pin);
  locationChosen = true;
  // Persist location in localStorage
  localStorage.setItem('userDistrict', district);
  localStorage.setItem('userPincode', pin);
  showSuccess(`Location set to ${district}, ${pin}`);
  setTimeout(() => { closePopup(); renderHeader(); }, 1000);
}

// Sidebar functionality
function openSidebar() {
  const overlay = document.getElementById('sidebarOverlay');
  overlay.style.display = 'block';
  setTimeout(() => {
    overlay.classList.add('active');
    renderSidebarContent();
  }, 10);
}

function closeSidebar() {
  const overlay = document.getElementById('sidebarOverlay');
  overlay.classList.remove('active');
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 300);
}



// Function to render sidebar content based on login state
function renderSidebarContent() {
  const sidebarContent = document.getElementById('sidebarContent');
  if (isLoggedIn && currentUser) {
    const profilePic = currentUser.profilePicture || 'https://via.placeholder.com/80';
    const username = currentUser.username || 'User';
    sidebarContent.innerHTML = `
     <div class="profile-section">
  <img src="${profilePic}" alt="Profile" class="profile-pic">
  <div class="profile-info">
    <span class="username">${username}</span>
    <button class="edit-profile">Edit Profile</button>
  </div>
</div>
<ul class="sidebar-menu">
  <li>
<span class="material-symbols-outlined">
gavel
</span>
    <span>Auctions</span>
  </li>
  <li>
<span class="material-symbols-outlined">
monitoring
</span><!-- Changed to chart-bar (line graph alternative) -->
    <span>Seller Dashboard</span>
  </li>
  <li>
<span class="material-symbols-outlined">
sell
</span>   <span>Sell an Item</span>
  </li>
  <li>
<span class="material-symbols-outlined">
favorite
</span>
    <span>Wishlist</span>
  </li>
  <li>
<span class="material-symbols-outlined">
history
</span>
    <span>My Activity</span>
  </li>
  <li>
<span class="material-symbols-outlined">
chat_bubble
</span>
    <span>My Chats</span>
  </li>
  <li>
  <span class="material-symbols-outlined">
crown
</span>
    <span>Exclusive Seller Packages</span>
  </li>
  <li>
<span class="material-symbols-outlined">
info
</span>
    <span>About Us</span>
  </li>
  <li id="logoutSidebarBtn" style="cursor:pointer;">
    <i class="fas fa-sign-out-alt"></i> <!-- No free outline version -->
    <span>Logout</span>
  </li>
</ul>    `;

    document.getElementById('logoutSidebarBtn').addEventListener('click', async function () {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch { }
  localStorage.clear(); // Clear all local storage
  window.location.href = '/'; // Redirect to auction page after logout
    });
  } else {
    sidebarContent.innerHTML = `
      <div class="guest-welcome">
        <h3>Welcome to Needybids</h3>
        <p>Sign in to access your account and start bidding</p>
        <div class="guest-actions">
          <button class="guest-btn guest-btn-primary" onclick="window.location.href='/signup'">
            <i class="fas fa-sign-in-alt"></i> Sign In
          </button>
          <button class="guest-btn guest-btn-secondary" onclick="window.location.href='/signup'">
            <i class="fas fa-user-plus"></i> Register
          </button>
        </div>
      </div>
      <ul class="sidebar-menu">
        <li>
          <i class="fa-solid fa-gavel" style="color:#02511A; margin-right:12px; font-size:21px;"></i>
          <span>Auctions</span>
        </li>
      </ul>
    `;
  }
}
// fetchUserData removed: now using currentUser from /api/auth/me

function login() {
  window.location.href = '/signup';
}

function register() {
  window.location.href = '/signup';
}

// Notification dropdown support (non-UI-changing)
(function setupNotificationHandlers(){
  // Simple HTML-escape helper
  function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e){
    const dd = document.getElementById('notificationDropdown');
    if (!dd) return;
    if (e.target.closest('.fa-bell') || e.target.closest('.notification') || e.target.closest('#notificationIcon')) return;
    if (!e.target.closest('#notificationDropdown')) dd.style.display = 'none';
  });

  // Delegate clicks on bell icons / notification elements
  document.addEventListener('click', async function(e){
    const bell = e.target.closest('.fa-bell') || e.target.closest('.notification') || e.target.closest('#notificationIcon');
    if (!bell) return; // not a bell click
    e.stopPropagation();
    // ensure id for compatibility with other scripts
    if (!bell.id) bell.id = 'notificationIcon';

    // If dropdown exists, toggle it
    const existing = document.getElementById('notificationDropdown');
    if (existing) {
      existing.style.display = existing.style.display === 'none' ? 'block' : 'none';
      return;
    }

    // Create dropdown container
    const dropdown = document.createElement('div');
    dropdown.id = 'notificationDropdown';
    dropdown.style.position = 'absolute';
    dropdown.style.zIndex = '9999';
    dropdown.style.minWidth = '220px';
    dropdown.style.maxWidth = '420px';
    dropdown.style.background = '#fff';
    dropdown.style.border = '1px solid #e6e6e6';
    dropdown.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
    dropdown.style.borderRadius = '8px';
    dropdown.style.padding = '6px';
    dropdown.style.fontSize = '14px';
    dropdown.style.color = '#222';
    dropdown.innerHTML = '<div style="padding:12px;color:#666">Loading...</div>';

    // Position dropdown below the bell
    try{
      const rect = bell.getBoundingClientRect();
      dropdown.style.top = (window.scrollY + rect.bottom + 8) + 'px';
      // center dropdown relative to bell, but keep it onscreen
      const left = window.scrollX + rect.left - 180 + rect.width / 2;
      dropdown.style.left = Math.max(8, Math.min(left, window.innerWidth - 8 - 300)) + 'px';
    } catch(err) {
      // fallback
      dropdown.style.top = '56px';
      dropdown.style.right = '12px';
    }

    document.body.appendChild(dropdown);

    // Fetch notifications (cookie auth)
    try {
      const res = await fetch('/api/notifications', { credentials: 'include', headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('fetch failed');
      const payload = await res.json();
      const list = (payload && payload.notifications) || [];
      if (!list.length) {
        dropdown.innerHTML = '<div style="padding:12px;color:#666">No notifications</div>';
        return;
      }

      const ul = document.createElement('ul');
      ul.style.listStyle = 'none';
      ul.style.margin = '0';
      ul.style.padding = '0';
      ul.style.maxHeight = '360px';
      ul.style.overflow = 'auto';

      list.forEach(n => {
        const li = document.createElement('li');
        li.style.padding = '10px 12px';
        li.style.borderBottom = '1px solid #f4f4f4';
        li.innerHTML = `
          <div style="font-weight:600;color:#111">${escapeHtml(n.title || 'Notification')}</div>
          <div style="color:#555;margin-top:6px">${escapeHtml(n.message || '')}</div>
          <div style="font-size:12px;color:#888;margin-top:6px">${escapeHtml(n.time || '')}</div>
        `;
        ul.appendChild(li);
      });

      dropdown.innerHTML = '';
      dropdown.appendChild(ul);
    } catch (err) {
      dropdown.innerHTML = '<div style="padding:12px;color:#d00">Unable to load notifications</div>';
    }
  });
})();


window.toggleLogin = function() {
  isLoggedIn = !isLoggedIn;
  renderHeader();
  if (document.getElementById('sidebarOverlay').style.display === 'block') {
    renderSidebarContent();
  }
};