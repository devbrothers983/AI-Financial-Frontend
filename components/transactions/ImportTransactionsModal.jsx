"use client";

import React, { useRef, useState } from "react";
import { toast } from "react-toastify";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

import Modal from "@/components/ui/Modal";
import { importTransactions } from "@/services/transactionService";
import { parseCsv, guessMapping, IMPORT_FIELDS } from "@/lib/csv";

const MAX_ROWS = 1000;

const selectClass =
  "w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

// Upload a CSV (e.g. a bank export), match its columns, preview, import.
const ImportTransactionsModal = ({ open, onClose, onImported }) => {
  const fileRef = useRef(null);

  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [dataRows, setDataRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const reset = () => {
    setFileName("");
    setHeaders([]);
    setDataRows([]);
    setMapping({});
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("That file is too large (2MB max)");
      return;
    }

    const rows = parseCsv(await file.text());
    if (rows.length < 2) {
      toast.error("That file has no data rows");
      return;
    }

    const [headerRow, ...rest] = rows;
    setFileName(file.name);
    setHeaders(headerRow);
    setDataRows(rest);
    setMapping(guessMapping(headerRow));
    setResult(null);
  };

  const mappedRows = dataRows.map((row) =>
    Object.fromEntries(IMPORT_FIELDS.map((f) => [f.key, mapping[f.key] !== undefined ? row[mapping[f.key]] ?? "" : ""]))
  );

  const missingRequired = IMPORT_FIELDS.filter((f) => f.required && mapping[f.key] === undefined);

  const handleImport = async () => {
    if (missingRequired.length) return;
    if (mappedRows.length > MAX_ROWS) {
      toast.error(`Import up to ${MAX_ROWS} rows at a time — split the file and try again`);
      return;
    }
    try {
      setImporting(true);
      const response = await importTransactions(mappedRows);
      setResult(response);
      if (response.imported) {
        toast.success(`Imported ${response.imported} transactions`);
        onImported?.();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Import transactions">
      {result ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm text-emerald-800 dark:text-emerald-200">{result.message}</p>
          </div>
          {result.skipped?.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" /> {result.skipped.length} rows skipped
              </p>
              <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-amber-700 dark:text-amber-300">
                {result.skipped.slice(0, 50).map((s) => (
                  <li key={s.row}>
                    Row {s.row}: {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={reset}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              Import another file
            </button>
            <button
              onClick={handleClose}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      ) : !headers.length ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Upload a CSV file, such as an export from your bank or a file exported from this app. You&apos;ll match its columns
            before anything is imported.
          </p>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-8 text-slate-500 hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/5 cursor-pointer"
          >
            <Upload className="h-6 w-6" />
            <span className="text-sm font-medium">Choose a CSV file</span>
            <span className="text-xs">Up to {MAX_ROWS} rows, 2MB</span>
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Needs at least a date and an amount column. Negative amounts are treated as expenses when there&apos;s no type
            column; unknown categories become &quot;other&quot;.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            <span className="truncate font-medium">{fileName}</span>
            <span className="shrink-0 text-slate-400">· {dataRows.length} rows</span>
          </p>

          <div className="grid grid-cols-2 gap-2">
            {IMPORT_FIELDS.map((f) => (
              <label key={f.key} className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {f.label}
                {f.required && <span className="text-red-500"> *</span>}
                <select
                  value={mapping[f.key] ?? ""}
                  onChange={(e) =>
                    setMapping((m) => {
                      const next = { ...m };
                      if (e.target.value === "") delete next[f.key];
                      else next[f.key] = Number(e.target.value);
                      return next;
                    })
                  }
                  className={`${selectClass} mt-1`}
                >
                  <option value="">— Not in file —</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Column ${i + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Preview</p>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    {["Date", "Amount", "Type", "Category", "Description"].map((h) => (
                      <th key={h} className="whitespace-nowrap px-2 py-1.5 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mappedRows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="text-slate-700 dark:text-slate-300">
                      <td className="whitespace-nowrap px-2 py-1.5">{r.date}</td>
                      <td className="whitespace-nowrap px-2 py-1.5">{r.amount}</td>
                      <td className="px-2 py-1.5">{r.type}</td>
                      <td className="px-2 py-1.5">{r.category}</td>
                      <td className="max-w-[160px] truncate px-2 py-1.5">{r.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {missingRequired.length > 0 && (
            <p className="text-xs text-red-500">Choose the {missingRequired.map((f) => f.label.toLowerCase()).join(" and ")} column.</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={reset}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              Choose another file
            </button>
            <button
              onClick={handleImport}
              disabled={importing || missingRequired.length > 0}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {importing ? "Importing..." : `Import ${dataRows.length} rows`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ImportTransactionsModal;
