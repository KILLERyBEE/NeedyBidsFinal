// editt.js - fetches profile, populates form, previews image and submits updates

async function fetchProfile() {
  try {
  // include cookie credentials and Authorization header if token stored in localStorage
  const headers = {};
  const localToken = localStorage.getItem('token');
  if (localToken) headers['Authorization'] = 'Bearer ' + localToken;
  const res = await fetch('/api/user/profile', { credentials: 'include', headers });
    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(body.message || 'Failed to load profile');
    const user = body.data.user || {};

  const usernameEl = document.getElementById('username');
  const emailEl = document.getElementById('email');
  const contactEl = document.getElementById('contact');
  const preview = document.getElementById('preview');

  // Only set values when the API actually returns them; don't overwrite server-rendered values with empty strings
  if (usernameEl && user.username) usernameEl.value = user.username;
  if (emailEl && user.email) emailEl.value = user.email;
  if (contactEl && user.contact) contactEl.value = user.contact;
  // Only set about/bio if provided by API (don't overwrite server-rendered value with empty)
  const bioEl = document.getElementById('bio');
  if (bioEl && user.about) bioEl.value = user.about;

    if (user.profilePicture && preview) {
      preview.src = user.profilePicture;
      preview.style.display = 'block';
      const uploadIcon = document.getElementById('upload-icon');
      if (uploadIcon) uploadIcon.style.display = 'none';
    }
  } catch (err) {
    console.error('fetchProfile error:', err);
  }
}

function previewImage(e) {
  const file = e.target.files && e.target.files[0];
  const preview = document.getElementById('preview');
  if (!file || !preview) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    preview.src = ev.target.result;
    preview.style.display = 'block';
    const uploadIcon = document.getElementById('upload-icon');
    if (uploadIcon) uploadIcon.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

async function submitProfile(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.classList.add('loading');
  }

  const username = (document.getElementById('username') || {}).value || '';
  const email = (document.getElementById('email') || {}).value || '';
  const contact = (document.getElementById('contact') || {}).value || '';
  const pfp = (document.getElementById('pfp') && document.getElementById('pfp').files[0]) || null;
  const preview = document.getElementById('preview');

  // basic validation
  let isValid = true;
  if (!username || username.trim().length < 3) {
    showError('username', !username ? 'Username is required' : 'Username must be at least 3 characters');
    isValid = false;
  } else {
    showSuccess('username');
  }

  // contact is optional; only validate if the user provided a value
  if (contact && contact.trim() !== '') {
    if (contact.trim().length < 10) {
      showError('contact', 'Please enter a valid contact number');
      isValid = false;
    } else {
      showSuccess('contact');
    }
  } else {
    clearValidation('contact');
  }

  // Only show pfp recommendation if there is no preview image (no profile picture)
  if (!pfp && preview && (!preview.src || preview.src.endsWith('/null') || preview.style.display === 'none')) {
    showError('pfp', 'Profile picture is recommended');
  } else {
    clearValidation('pfp');
  }

  if (!isValid) {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.classList.remove('loading');
    }
    return;
  }

  const formData = new FormData();
  formData.append('username', username.trim());
  formData.append('email', email.trim());
  formData.append('contact', contact.trim());
  // include about/bio field
  const about = (document.getElementById('bio') || {}).value || '';
  formData.append('about', about.trim());
  // multer on the server expects the field name 'profilePicture'
  if (pfp) formData.append('profilePicture', pfp);

  try {
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      credentials: 'include',
      body: formData
    });
    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(body.message || 'Failed to update');

  // Remove any existing notifications before showing a new one
  document.querySelectorAll('.notification.success').forEach(n => n.remove());
  const note = document.createElement('div');
  note.className = 'notification success show';
  note.textContent = 'Profile updated successfully';
  document.body.appendChild(note);
    setTimeout(() => {
      note.remove();
      window.location.href = '/';
    }, 1500);

    // refresh header/sidebar if available
    if (typeof window.checkAuthAndRenderHeader === 'function') {
      window.checkAuthAndRenderHeader();
    }
  } catch (err) {
    console.error('submitProfile error:', err);
    const note = document.createElement('div');
    note.className = 'notification error show';
    note.textContent = err.message || 'Update failed';
    document.body.appendChild(note);
    setTimeout(() => note.remove(), 3000);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.classList.remove('loading');
    }
  }
}

// expose preview function for inline onchange attribute
window.previewImage = previewImage;

// small validation helpers
function clearValidation(fieldId) {
  const errorElement = document.getElementById(fieldId + 'Error');
  const inputElement = document.getElementById(fieldId);
  if (errorElement) errorElement.classList.remove('show');
  if (inputElement) inputElement.classList.remove('error', 'success');
}

function showError(fieldId, message) {
  const errorElement = document.getElementById(fieldId + 'Error');
  const inputElement = document.getElementById(fieldId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add('show');
  }
  if (inputElement) {
    inputElement.classList.add('error');
    inputElement.classList.remove('success');
  }
}

function showSuccess(fieldId) {
  const errorElement = document.getElementById(fieldId + 'Error');
  const inputElement = document.getElementById(fieldId);
  if (errorElement) errorElement.classList.remove('show');
  if (inputElement) {
    inputElement.classList.remove('error');
    inputElement.classList.add('success');
  }
}

document.addEventListener('DOMContentLoaded', function () {
  fetchProfile();
  const form = document.getElementById('profileForm');
  if (form) form.addEventListener('submit', submitProfile);

  const usernameEl = document.getElementById('username');
  if (usernameEl) usernameEl.addEventListener('input', function () {
    const v = this.value.trim();
    if (!v) showError('username', 'Username is required');
    else if (v.length < 3) showError('username', 'Username must be at least 3 characters');
    else showSuccess('username');
  });

  const contactEl2 = document.getElementById('contact');
  if (contactEl2) contactEl2.addEventListener('input', function () {
    const v = this.value.trim();
    // optional: clear validation when empty, otherwise validate length
    if (!v) {
      clearValidation('contact');
    } else if (v.length < 10) {
      showError('contact', 'Please enter a valid contact number');
    } else {
      showSuccess('contact');
    }
  });
});
