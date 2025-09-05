// Helper to either redirect (for regular form submissions) or return JSON (for AJAX/API)
function sendResultOrRedirect(req, res, data, redirectPath = '/') {
  try {
    const acceptsHtml = req.headers && typeof req.headers.accept === 'string' && req.headers.accept.indexOf('text/html') !== -1;
    const isAjax = req.xhr || (req.headers['x-requested-with'] === 'XMLHttpRequest');
    if (acceptsHtml && !isAjax) {
      return res.redirect(redirectPath);
    }
  } catch (e) {
    // ignore and fallback to JSON
  }
  return res.json(data);
}

module.exports = { sendResultOrRedirect };
