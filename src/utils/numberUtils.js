export const normalizeAmount = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    if (!cleaned) {
      return 0;
    }

    const numeric = Number(cleaned);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  if (value && typeof value.toString === 'function') {
    const cleaned = value.toString().replace(/[^0-9.-]/g, '');
    if (!cleaned) {
      return 0;
    }

    const numeric = Number(cleaned);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  return 0;
};

export const normalizeDetailList = (details) => {
  if (!Array.isArray(details)) {
    return [];
  }

  return details.map((detail) => ({
    ...detail,
    price: normalizeAmount(detail?.price),
  }));
};
