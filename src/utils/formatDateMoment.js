import moment from "moment";
import "moment-timezone";

// Get user timezone or default to Kolkata
const userTimezone = moment.tz.guess() || "Asia/Kolkata";

// Helper function to format date using moment (Relative)
export const formatRelativeDate = (date) => {
  const mDate = moment(date).tz(userTimezone);
  const now = moment().tz(userTimezone);

  const diffMinutes = now.diff(mDate, "minutes");
  const diffHours = now.diff(mDate, "hours");

  // Calendar day difference (Today = 0, Yesterday = 1, etc.)
  const dayDiff = now.clone().startOf("day").diff(mDate.clone().startOf("day"), "days");

  // 1. Just now
  if (diffMinutes < 1) return "Just now";

  // 2. Minutes
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? "A minute ago" : `${diffMinutes} minutes ago`;
  }

  // 3. Today (Hours)
  if (dayDiff === 0) {
    return diffHours === 1 ? "An hour ago" : `${diffHours} hours ago`;
  }

  // 4. Yesterday
  if (dayDiff === 1) return "Yesterday";

  // 5. 2 Days ago
  if (dayDiff === 2) return "2 days ago";

  // 6. Otherwise: Exact Date + Time (AM/PM)
  return mDate.format("DD MMM YYYY hh:mm A");
};

// 26 Oct 2024 10:30 AM
export const formatDateWithTime = (date) => {
  return moment(date).tz(userTimezone).format("DD MMM YYYY hh:mm A");
};

// 26 Oct 2024
export const formatDate = (date) => {
  return moment(date).tz(userTimezone).format("DD MMM YYYY");
};
