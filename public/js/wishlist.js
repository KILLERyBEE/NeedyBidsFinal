// wishlist.js - Handles adding items to wishlist from auction cards

async function addToWishlist(btn) {
  const itemId = btn.getAttribute('data-id');
  const modelName = btn.getAttribute('data-model');
  const userId = btn.getAttribute('data-user');
  if (!itemId || !modelName || !userId) return showInPageAlert('Missing info');

  try {
    const res = await fetch('/wishlist/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, itemId, modelName }),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success) {
      btn.classList.add('liked');
      // Optionally show a notification
    } else {
  showInPageAlert(data.error || 'Could not add to wishlist');
    }
  } catch (err) {
  showInPageAlert('Error adding to wishlist');
  }
}

async function removeFromWishlist(heart) {
  const itemId = heart.getAttribute('data-item-id');
  const modelName = heart.getAttribute('data-model-name');
  const userId = heart.getAttribute('data-user-id');
  if (!userId || !itemId || !modelName) return showInPageAlert('Missing info');
  const willLike = !heart.classList.contains('liked');
  if (!willLike) {
    heart.classList.remove('liked');
    try {
      const res = await fetch('/wishlist/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, itemId, modelName }),
        credentials: 'include'
      });
      const data = await res.json();
      if (!data.success) {
  showInPageAlert('Failed to remove from wishlist');
        heart.classList.add('liked');
      } else {
        if (typeof fetchWishlist === 'function') fetchWishlist();
      }
    } catch (err) {
  showInPageAlert('Error removing from wishlist');
      heart.classList.add('liked');
    }
  }
}