import type { ISODate } from "./types";

const pad = (value: number) => String(value).padStart(2, "0");

export function toLocalISODate(date: Date = new Date()): ISODate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` as ISODate;
}
