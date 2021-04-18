export default function isDateAfterNow (date: number | Date): boolean {
  if (date instanceof Date) date = date.getTime();

  return date > Date.now();
}
