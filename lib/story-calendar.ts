export function monthSummary(dates: string[], year: number, month: number) {
  const prefix = `${year}-${String(month).padStart(2, '0')}-`;
  return {
    offset: (new Date(year, month - 1, 1).getDay() + 6) % 7,
    days: Array.from(
      { length: new Date(year, month, 0).getDate() },
      (_, index) => {
        const day = index + 1;
        return {
          day,
          count: dates.filter((date) =>
            date.startsWith(`${prefix}${String(day).padStart(2, '0')}`),
          ).length,
        };
      },
    ),
  };
}
