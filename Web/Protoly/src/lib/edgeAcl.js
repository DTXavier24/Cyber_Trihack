function edgeAcl(req, res, next) {
  const rawPath = req.url.split('?')[0];
  if (rawPath.startsWith('/api/v2/admin')) {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
}

module.exports = { edgeAcl };
