// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import { DEFAULT_WARRANTY_MONTHS } from "./constants.ts";
import { calculateDaysRemaining, getTodayIso } from "./deadlines.ts";
import type { Warranty, WarrantyStatus } from "./types.ts";

export function calculateWarrantyExpiry(purchaseDate: string, durationMonths: number = DEFAULT_WARRANTY_MONTHS): string {
  const [y, m, d] = purchaseDate.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));

  date.setUTCMonth(date.getUTCMonth() + durationMonths);
  return date.toISOString().slice(0, 10);
}

export function computeWarrantyStatus(warranty: Warranty, referenceDate: string = getTodayIso()): WarrantyStatus {
  const days = calculateDaysRemaining(warranty.expiryDate, referenceDate);
  if (days < 0) return "expired";
  if (days <= 30) return "expiring_soon";
  return "active";
}

export function createWarranty(
  input: {
    id?: string;
    item: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    purchaseDate: string;
    durationMonths?: number;
    expiryDate?: string;
    retailer?: string;
    price?: number;
    currency?: string;
    proofOfPurchase?: string;
    notes?: string;
    tags?: string[];
  },
  nowIso: string = new Date().toISOString()
): Warranty {
  const duration = input.durationMonths ?? DEFAULT_WARRANTY_MONTHS;
  const expiry = input.expiryDate ?? calculateWarrantyExpiry(input.purchaseDate, duration);
  const id = input.id ?? `war_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  return {
    id,
    item: input.item,
    brand: input.brand,
    model: input.model,
    serialNumber: input.serialNumber,
    purchaseDate: input.purchaseDate,
    durationMonths: duration,
    expiryDate: expiry,
    retailer: input.retailer,
    price: input.price,
    currency: input.currency ?? "EUR",
    proofOfPurchase: input.proofOfPurchase,
    notes: input.notes,
    tags: input.tags ?? [],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}
