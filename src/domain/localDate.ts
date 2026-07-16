import type { ISODate } from "./types";

const pad = (value: number) => String(value).padStart(2, "0");

export function toLocalISODate(date: Date = new Date()): ISODate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` as ISODate;
}

export function formatLocalDate(date: ISODate): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function formatLocalPeriod(period: `${number}-${number}`): string {
  const [year, month] = period.split("-");
  return `${monthNames[Number(month) - 1]} de ${year}`;
}
