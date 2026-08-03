function parseId(value) {
  const rawValue = String(value ?? "");
  if (!/^[1-9]\d*$/.test(rawValue)) return null;

  const id = Number(rawValue);
  if (!Number.isSafeInteger(id)) return null;
  return id;
}

module.exports = { parseId };
