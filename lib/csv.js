// Parses CSV text into an array of rows (arrays of strings). Handles quoted
// fields, escaped quotes, commas/newlines inside quotes, CRLF and a BOM.
// Semicolon-separated files (common in European bank exports) are detected.
export const parseCsv = (text) => {
  const input = text.replace(/^﻿/, "");
  const firstLine = input.split(/\r?\n/, 1)[0] || "";
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
};

// The fields an imported transaction can have, with header names to guess from
export const IMPORT_FIELDS = [
  { key: "date", label: "Date", required: true, guesses: ["date", "transaction date", "posted", "posting date", "booking date"] },
  { key: "amount", label: "Amount", required: true, guesses: ["amount", "value", "sum", "total", "debit/credit"] },
  { key: "type", label: "Type (income/expense)", guesses: ["type", "transaction type", "direction", "credit/debit"] },
  { key: "category", label: "Category", guesses: ["category", "transaction category"] },
  { key: "description", label: "Description", guesses: ["description", "details", "memo", "payee", "merchant", "narrative", "name"] },
  { key: "paymentMethod", label: "Payment method", guesses: ["payment method", "method", "payment"] },
  { key: "notes", label: "Notes", guesses: ["notes", "note", "comment", "comments"] },
];

// Best-guess column index for each field, from the header row
export const guessMapping = (headers) => {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  const used = new Set();
  const mapping = {};

  for (const field of IMPORT_FIELDS) {
    let index = normalized.findIndex((h, i) => !used.has(i) && field.guesses.includes(h));
    if (index === -1) index = normalized.findIndex((h, i) => !used.has(i) && field.guesses.some((g) => h.includes(g)));
    if (index !== -1) {
      mapping[field.key] = index;
      used.add(index);
    }
  }

  return mapping;
};
