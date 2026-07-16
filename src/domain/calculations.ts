import type { MoneyInput } from "./types";

export const calculateNet = (values: MoneyInput): number =>
  values.merchandise - values.freight + values.surplus - values.shortage;

export const calculateDifference = (expected: number, actual: number): number =>
  actual - expected;

export const calculateDiscount = (base: number, rate: number): number =>
  base * rate;

export const calculateCommission = (base: number, rate: number): number =>
  base * rate;
