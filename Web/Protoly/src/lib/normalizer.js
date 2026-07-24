function removeDotSegments(path) {
  const out = [];
  for (const seg of path.split('/')) {
    if (seg === '..') {
      if (out.length > 1) out.pop(); 
    } else if (seg === '.') {
      continue;
    } else {
      out.push(seg);
    }
  }
  return out.join('/');
}

function normalizer(req, res, next) {
  const qIndex = req.url.indexOf('?');
  const rawPath = qIndex === -1 ? req.url : req.url.slice(0, qIndex);
  const query = qIndex === -1 ? '' : req.url.slice(qIndex);
  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    decoded = rawPath;
  }
  const canon = removeDotSegments(decoded.normalize('NFKC'));
  req.url = canon + query;
  next();
}

module.exports = { normalizer, removeDotSegments };
