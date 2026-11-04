// Tidies a website the user typed: "udemy.com/settings" becomes
// "https://udemy.com/settings". Returns null if it isn't a usable https link.
// The server checks this again when the link is saved.
export const normalizeLink = (text = "") => {
  const value = text.trim();
  if (!value) return null;

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(value);
  try {
    const url = new URL(hasScheme ? value : `https://${value}`);
    return url.protocol === "https:" && url.hostname.includes(".") ? url.href : null;
  } catch {
    return null;
  }
};

// "https://www.udemy.com/settings" shows as "udemy.com"
export const siteName = (link = "") => {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

// Does the website's address mention the subscription's name? "Udemy" and
// udemy.com do. A "no" isn't proof of a wrong link (Amazon also uses amzn.com),
// so the page warns the user rather than refusing it.
export const linkMatchesName = (link, name = "") => {
  const site = siteName(link).toLowerCase().replace(/[^a-z0-9]/g, "");
  const words = name.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length >= 3);
  return words.length === 0 || words.some((word) => site.includes(word));
};

// With no link saved, the user can still search for how to cancel
export const cancelSearchUrl = (name = "") =>
  `https://www.google.com/search?q=${encodeURIComponent(`how to cancel ${name} subscription`)}`;
