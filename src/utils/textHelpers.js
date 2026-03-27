export function getInitials(name) {
  if (!name) return "";

  const parts = name
    .trim()
    .split(" ")
    .filter(Boolean); // remove extra spaces

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  const first = parts[0][0].toUpperCase();
  const last = parts[parts.length - 1][0].toUpperCase();

  return first + last;
}


export function limitText(str, limit = 15) {
  if (!str) return "";
  if (str.length <= limit) return str;
  return str.substring(0, limit) + "...";
}
