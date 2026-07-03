import { Invoice } from '../types';

export function getCurrentFY(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth(); // 0 = Jan, 11 = Dec
  const startYear = m >= 3 ? y : y - 1;
  const endYear = (startYear + 1) % 100;
  return `${startYear}-${String(endYear).padStart(2, '0')}`;
}

export function compareInvoiceNumbers(a: string, b: string): number {
  const partsA = (a || '').split('_');
  const partsB = (b || '').split('_');

  if (partsA.length !== 2 || partsB.length !== 2) {
    return (a || '').localeCompare(b || '');
  }

  // Compare financial year first (e.g. "2026-27" vs "2025-26")
  const fyCompare = partsA[1].localeCompare(partsB[1]);
  if (fyCompare !== 0) {
    return fyCompare;
  }

  // Compare serial number numerically
  const serialA = parseInt(partsA[0], 10);
  const serialB = parseInt(partsB[0], 10);
  if (!isNaN(serialA) && !isNaN(serialB)) {
    return serialA - serialB;
  }

  return partsA[0].localeCompare(partsB[0]);
}

export function getNextInvoiceNumber(invoices: Invoice[]): string {
  const currentFY = getCurrentFY();
  let maxSerial = 0;

  (invoices || []).forEach(inv => {
    const parts = (inv.invoiceNumber || '').split('_');
    if (parts.length === 2 && parts[1] === currentFY) {
      const serial = parseInt(parts[0], 10);
      if (!isNaN(serial) && serial > maxSerial) {
        maxSerial = serial;
      }
    }
  });

  const nextSerial = maxSerial + 1;
  return `${nextSerial}_${currentFY}`;
}
