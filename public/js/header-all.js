// ...existing code...
let isLoggedIn = false;
let currentUser = null; // Will hold user data from backend

async function checkAuthAndRenderHeader() {
  try {
    let headers = { 'Accept': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers
    });
    if (res.ok) {
      const data = await res.json();
      isLoggedIn = data && data.success && data.data && data.data.user;
      currentUser = isLoggedIn ? data.data.user : null;
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
        note.style.background = '#02511A';
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
});

function renderHeader() {
  const authBlock = document.getElementById("authBlock");
  authBlock.innerHTML = "";

  if (isLoggedIn) {
    authBlock.innerHTML = `
      <button class="sell-now">
        <i class="bi bi-shop"></i>
        Sell Now
      </button>
  <i class="fa fa-bell notification" id="notificationIcon"></i>
    `;
  } else {
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
          </span>
          <span>Seller Dashboard</span>
        </li>
        <li>
          <span class="material-symbols-outlined">
            sell
          </span>
          <span>Sell an Item</span>
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
          <i class="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </li>
      </ul>`;

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

function login() {
  window.location.href = '/signup';
}

function register() {
  window.location.href = '/signup';
}

window.toggleLogin = function() {
  isLoggedIn = !isLoggedIn;
  renderHeader();
  if (document.getElementById('sidebarOverlay').style.display === 'block') {
    renderSidebarContent();
  }
};