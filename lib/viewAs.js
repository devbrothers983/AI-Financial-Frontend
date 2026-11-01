// Admin "view as user" sessions live in sessionStorage, so they only apply to
// the one browser tab they were opened in; the admin's own sign-in (in
// localStorage) is never touched.
const KEY = "viewAs";

export const getViewAs = () => {
  if (typeof window === "undefined") return null;
  try {
    const session = JSON.parse(sessionStorage.getItem(KEY));
    return session?.token ? session : null;
  } catch {
    return null;
  }
};

export const startViewAs = (session) => {
  sessionStorage.setItem(KEY, JSON.stringify(session));
};

// Leaves the view and returns this tab to the user's admin page
export const exitViewAs = () => {
  const session = getViewAs();
  sessionStorage.removeItem(KEY);
  window.location.href = session?.user?._id ? `/dashboard/users/${session.user._id}` : "/dashboard";
};
