import api from "@/services/api";

// Downloads a file from the API (with the user's auth) and saves it.
// The server's Content-Disposition filename wins over `fallbackName`.
export const downloadFromApi = async (path, params, fallbackName) => {
  const response = await api.get(path, { params, responseType: "blob" });

  const disposition = response.headers["content-disposition"] || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || fallbackName;

  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
