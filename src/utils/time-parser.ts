export function parseTimeString(timeStr: string): Date {
  const now = new Date();
  
  // Handle relative time formats like "24h", "7d", "1w", "1m"
  const relativeMatch = timeStr.match(/^(\d+)([hdwm])$/);
  if (relativeMatch) {
    const [, num, unit] = relativeMatch;
    const value = parseInt(num);
    
    switch (unit) {
      case 'h': // hours
        return new Date(now.getTime() - value * 60 * 60 * 1000);
      case 'd': // days
        return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
      case 'w': // weeks
        return new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
      case 'm': // months (approximate as 30 days)
        return new Date(now.getTime() - value * 30 * 24 * 60 * 60 * 1000);
    }
  }
  
  // Handle natural language
  const lowerStr = timeStr.toLowerCase();
  switch (lowerStr) {
    case 'today':
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    case 'yesterday':
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      return yesterday;
    case 'this-week':
    case 'this week':
      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay()); // Start of week (Sunday)
      thisWeek.setHours(0, 0, 0, 0);
      return thisWeek;
    case 'last-week':
    case 'last week':
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - lastWeek.getDay() - 7);
      lastWeek.setHours(0, 0, 0, 0);
      return lastWeek;
    case 'this-month':
    case 'this month':
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      return thisMonth;
    case 'last-month':
    case 'last month':
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(1);
      lastMonth.setHours(0, 0, 0, 0);
      return lastMonth;
  }
  
  // Try to parse as ISO date (YYYY-MM-DD)
  const dateMatch = timeStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Try to parse as a full date string
  const parsed = new Date(timeStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  throw new Error(`Invalid time format: "${timeStr}". Use formats like: 24h, 7d, 1w, 2024-01-01, yesterday, today, this-week`);
}