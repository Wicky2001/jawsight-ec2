import React, { useState, type UIEvent } from "react";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Button,
} from "@headlessui/react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Edit2,
  Search,
  Trash2,
  Ellipsis,
  CirclePlus,
} from "lucide-react";

type LoadingSpinnerProps = {
  centered?: boolean;
  label?: string;
  spinnerClassName?: string;
  labelClassName?: string;
  className?: string;
};

const LoadingSpinner = ({
  centered = false,
  label,
  spinnerClassName = "h-6 w-6",
  labelClassName = "text-primary",
  className = "",
}: LoadingSpinnerProps) => {
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        className={`animate-spin text-current ${spinnerClassName}`}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 1 0-6 6v4A10 10 0 0 1 12 2Z"
        />
      </svg>
      {label ? (
        <span className={`text-sm font-medium ${labelClassName}`}>{label}</span>
      ) : null}
    </div>
  );

  if (centered) {
    return <div className="flex items-center justify-center">{content}</div>;
  }

  return content;
};

type TableEmptyStateProps = {
  title: string;
  description: string;
};

const TableEmptyState = ({ title, description }: TableEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-4 text-center text-slate-500">
      <Search className="h-9 w-9 text-slate-300" />
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <p className="w-full text-xs leading-relaxed text-slate-500">
        {description}
      </p>
    </div>
  );
};

export type ColumnDef = {
  headerName: string;
  field: string;
  width?: React.CSSProperties["width"] | number;
  sortable?: boolean;
};

export type CommonTableProps<T> = {
  cols?: ColumnDef[];
  rows?: T[];
  loading?: boolean;
  totalRecords?: number;
  lastSynced?: string;
  showEdit?: boolean;
  showDelete?: boolean;
  showAdd?: boolean;
  onEdit?: (row: T) => void;
  onAdd?: () => void;
  onDelete?: (ids: any[]) => void;
  onSearchChange?: (value: string) => void;
  onLoadMoreRecords?: () => void;
  onSortChange?: (field: string, order: "asc" | "desc" | null) => void;
  clickable?: boolean;
  onRowClick?: (row: T) => void;
};

// Fallback status badge rendering (supports multiple colors)
const getStatusIcon = (value: number | string) => {
  const raw = String(value ?? "").trim();
  const v = raw.toLowerCase();

  // Define themes for different statuses (Light & Dark mode compatible)
  const styles = {
    success: {
      wrapper:
        "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/30",
      dot: "bg-emerald-600 dark:bg-emerald-300",
    },
    info: {
      wrapper:
        "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-400/10 dark:text-cyan-300 dark:border-cyan-400/30",
      dot: "bg-cyan-600 dark:bg-cyan-300",
    },
    warning: {
      wrapper:
        "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/30",
      dot: "bg-amber-600 dark:bg-amber-300",
    },
    error: {
      wrapper:
        "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-400/10 dark:text-rose-300 dark:border-rose-400/30",
      dot: "bg-rose-600 dark:bg-rose-300",
    },
    neutral: {
      wrapper:
        "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700/40 dark:text-slate-200 dark:border-slate-600",
      dot: "bg-slate-500 dark:bg-slate-300",
    },
  };

  let theme = styles.neutral;

  if (["success", "completed", "done", "active", "ok"].includes(v)) {
    theme = styles.success;
  } else if (["pending", "processing", "in-progress", "queued"].includes(v)) {
    theme = styles.info;
  } else if (["warning", "attention"].includes(v)) {
    theme = styles.warning;
  } else if (["failed", "error", "rejected", "cancelled"].includes(v)) {
    theme = styles.error;
  } else if (/^\d+$/.test(v)) {
    if (v === "0") theme = styles.info;
    else if (v === "1") theme = styles.success;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase border transition-colors ${theme.wrapper}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
      {raw}
    </span>
  );
};
export const Table = <T extends Record<string, any>>({
  cols = [],
  rows = [],
  loading = false,
  totalRecords = 0,
  lastSynced,
  showEdit = false,
  showDelete = false,
  showAdd = false,
  onEdit,
  onAdd,
  onDelete,
  onSearchChange,
  onLoadMoreRecords: onLoadMore,
  onSortChange,
  clickable = false,
  onRowClick,
}: CommonTableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollTop + clientHeight + 100 > scrollHeight;

    if (isNearBottom && !loading && rows.length < totalRecords) {
      onLoadMore?.();
    }
  };

  const toggleSort = (field: string) => {
    const nextOrder =
      sortField === field && sortOrder === "asc"
        ? "desc"
        : sortField === field && sortOrder === "desc"
          ? null
          : "asc";
    setSortField(nextOrder ? field : null);
    setSortOrder(nextOrder);
    onSortChange?.(field, nextOrder);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearchChange?.(searchTerm);
  };

  const renderCellValue = (value: unknown, fieldName: string) => {
    if (value === null || value === undefined || value === "") {
      return "--";
    }

    if (
      fieldName === "status" &&
      (typeof value === "number" || typeof value === "string")
    ) {
      return getStatusIcon(value);
    }

    if (React.isValidElement(value)) {
      return value;
    }

    return String(value);
  };

  const tableColumnSpan = Math.max(
    1,
    cols.length + (showDelete || showEdit ? 1 : 0),
  );

  return (
    <div className="flex flex-col h-full min-h-0 w-full surface-card border border-primary rounded-xl overflow-hidden card-shadow">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4 border-b border-primary bg-page shrink-0">
        {showAdd && (
          <Button
            className="btn-primary inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold"
            onClick={() => onAdd?.()}
          >
            <CirclePlus size={18} />
            Add
          </Button>
        )}
        <div className="relative w-full sm:w-1/2">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
            size={18}
          />
          <input
            type="text"
            placeholder="Search records..."
            className="w-full pl-10 pr-4 py-2 themed-input input-focus text-sm rounded-lg"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-secondary">
          {lastSynced && (
            <div className="flex items-center gap-1.5 font-medium">
              <Clock size={14} />
              <span>Synced: {lastSynced}</span>
            </div>
          )}
          <div className="h-4 w-px border-subtle mx-1 hidden sm:block"></div>
          <span
            className="px-2 py-1 rounded-md font-bold text-primary"
            style={{ background: "transparent" }}
          >
            {rows.length} / {totalRecords}
          </span>
        </div>
      </div>

      {/* Main Scrollable Table Body */}
      <div
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-x-auto overflow-y-auto relative scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
      >
        <table className="w-full text-left border-collapse min-w-full md:min-w-[600px]">
          <thead className="sticky top-0 z-30">
            <tr className="table-header-bg">
              {cols.map((col) => (
                <th
                  key={String(col.field)}
                  onClick={
                    col.sortable
                      ? () => toggleSort(String(col.field))
                      : undefined
                  }
                  className={`p-4 text-xs font-semibold text-secondary uppercase tracking-wider transition-colors border-b border-primary ${col.sortable ? "cursor-pointer hover-bg" : ""}`}
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-2">
                    {col.headerName}
                    {col.sortable && (
                      <div className="flex flex-col text-slate-300">
                        <ChevronUp
                          size={13}
                          className={`transition-transform duration-200 hover:scale-125 ${sortField === col.field && sortOrder === "asc" ? "text-primary" : "text-muted"}`}
                        />
                        <ChevronDown
                          size={13}
                          className={`transition-transform duration-200 hover:scale-125 ${sortField === col.field && sortOrder === "desc" ? "text-primary" : "text-muted"}`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}

              {(showDelete || showEdit) && (
                <th className="p-4 text-xs text-center font-semibold text-secondary uppercase tracking-wider border-b border-primary w-32">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={tableColumnSpan} className="p-0">
                  <div className="flex min-h-[240px] items-center justify-center py-10">
                    <LoadingSpinner
                      centered
                      label="Loading records..."
                      spinnerClassName="h-6 w-6"
                      labelClassName="text-primary"
                    />
                  </div>
                </td>
              </tr>
            ) : null}
            {rows.length === 0 && !loading ? (
              <tr>
                <td colSpan={tableColumnSpan} className="p-4">
                  <div className="flex h-full min-h-[300px] w-full items-center justify-center p-4">
                    <TableEmptyState
                      title="No records found"
                      description="There are no matching table rows for the current filters or search terms."
                    />
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => {
                    if (clickable && onRowClick) onRowClick(row);
                  }}
                  className={`transition-colors group ${clickable ? "cursor-pointer" : ""}`}
                >
                  {cols.map((col) => (
                    <td
                      key={`${row.id || idx}-${String(col.field)}`}
                      className="p-4 text-sm text-primary truncate w-full"
                    >
                      {renderCellValue(row[col.field], String(col.field))}
                    </td>
                  ))}
                  {(showDelete || showEdit) && (
                    <td
                      className="p-4 flex flex-row justify-center align-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Menu>
                        <MenuButton className="flex justify-center items-center px-2 py-1 rounded transition-colors cursor-pointer hover-bg">
                          <Ellipsis size={15} />
                        </MenuButton>
                        <MenuItems
                          anchor="bottom end"
                          className="[--anchor-gap:3px] [--anchor-padding:3px] surface-card border border-primary rounded-lg shadow-lg py-1 min-w-[120px] focus:outline-none z-50"
                        >
                          {showEdit && (
                            <MenuItem>
                              {({ focus }) => (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit?.(row);
                                  }}
                                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm ${focus ? "hover-bg" : ""} text-primary`}
                                >
                                  <Edit2 size={14} />
                                  Edit
                                </button>
                              )}
                            </MenuItem>
                          )}
                          {showDelete && (
                            <MenuItem>
                              {({ focus }) => (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete?.([row.id || row]);
                                  }}
                                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm ${focus ? "hover-bg" : ""} text-destructive`}
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              )}
                            </MenuItem>
                          )}
                        </MenuItems>
                      </Menu>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {loading && rows.length > 0 ? (
          <div className="sticky bottom-0 left-0 right-0 p-4 flex justify-center items-center surface-elevated z-30">
            <div className="flex items-center gap-3 px-6 py-2 surface-card border border-primary rounded-full card-shadow">
              <LoadingSpinner
                label="Loading more records..."
                spinnerClassName="w-[18px] h-[18px]"
                labelClassName="text-primary"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const demoColumns: ColumnDef[] = [
  { headerName: "Name", field: "name" },
  { headerName: "Status", field: "status", sortable: true },
  { headerName: "Created", field: "createdAt" },
];

const demoRows = [
  {
    id: 1,
    name: "Demo Patient",
    status: "completed",
    createdAt: "May 17, 2026",
  },
];

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex h-[80vh] w-full flex-col">
        <Table
          cols={demoColumns}
          rows={demoRows}
          totalRecords={1}
          loading={false}
        />
      </div>
    </div>
  );
}
