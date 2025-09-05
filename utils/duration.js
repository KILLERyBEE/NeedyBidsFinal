// Converts a duration string like '1 day', '3 days', '15 days' to a number (days)
function durationStringToDays(duration) {
  if (!duration) return 0;
  const match = duration.match(/(\d+)\s*day/);
  return match ? parseInt(match[1], 10) : 0;
}

module.exports = { durationStringToDays };
