function toDoc(doc) {
  if (!doc) return null;
  const raw = typeof doc.toObject === 'function' ? doc.toObject({ virtuals: true }) : { ...doc };
  const out = { ...raw };
  out.id = String(out._id);
  return out;
}

function toDocs(docs = []) {
  return docs.map(toDoc).filter(Boolean);
}

module.exports = { toDoc, toDocs };
