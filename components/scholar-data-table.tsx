import type { ReactNode } from "react";

/**
 * ScholarDataTable – table for scholar-like and other tabular data.
 *
 * Purpose:
 * - Often used with a name column (e.g. Scholar) and a UID column; other columns
 *   are optional and have configurable headers.
 * - Can also be used for non-scholar data by passing only the columns array.
 *
 * Usage:
 * 1) Scholar data (typical): pass nameColumn, uidColumn, and columns (extra columns).
 * 2) Other data: pass only columns (full column list).
 */

/** One column: id, configurable header, and optional layout/cell options. */
export interface ScholarDataTableColumn<T> {
  id: string;
  header: string;
  colSpan?: number;
  width?: string;
  render: (row: T) => ReactNode;
  cellClassName?: string;
}

/**
 * Config for a single column when the component supplies id and default header.
 * Used for nameColumn and uidColumn: header is optional (defaults "Scholar" / "UID").
 */
export interface ScholarDataTableColumnConfig<T> {
  header?: string;
  colSpan?: number;
  width?: string;
  render: (row: T) => ReactNode;
  cellClassName?: string;
}

interface ScholarDataTableProps<T> {
  data: T[];
  getRowKey: (row: T, index: number) => string;
  /** Name column (e.g. Scholar). Often spans 2 columns. Uses header default "Scholar". */
  nameColumn?: ScholarDataTableColumnConfig<T>;
  /** UID column. Uses header default "UID". */
  uidColumn?: ScholarDataTableColumnConfig<T>;
  /** Extra columns (when using name/uid), or full column list otherwise. */
  columns?: ScholarDataTableColumn<T>[];
  emptyMessage?: string;
  className?: string;
}

function toColumn<T>(
  id: string,
  header: string,
  config: ScholarDataTableColumnConfig<T>
): ScholarDataTableColumn<T> {
  return {
    id,
    header,
    colSpan: config.colSpan,
    width: config.width,
    render: config.render,
    cellClassName: config.cellClassName,
  };
}

export function ScholarDataTable<T>({
  data,
  getRowKey,
  nameColumn,
  uidColumn,
  columns = [],
  emptyMessage = "No records",
  className,
}: ScholarDataTableProps<T>) {
  const hasNameUid = nameColumn != null || uidColumn != null;
  const resolvedColumns: ScholarDataTableColumn<T>[] = hasNameUid
    ? [
        ...(nameColumn
          ? [
              toColumn<T>("name", nameColumn.header ?? "Scholar", {
                ...nameColumn,
                colSpan: nameColumn.colSpan ?? 2,
              }),
            ]
          : []),
        ...(uidColumn
          ? [toColumn<T>("uid", uidColumn.header ?? "UID", uidColumn)]
          : []),
        ...columns,
      ]
    : columns;

  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">{emptyMessage}</p>
    );
  }

  const cellClass = "py-2 pr-4";
  const thClass = "font-medium py-2 pr-4 text-left text-muted-foreground";
  const hasWidths = resolvedColumns.some((col) => col.width != null);

  return (
    <div className={`overflow-x-auto rounded-md text-sm ${className ?? ""}`}>
      <table
        className="w-full border-collapse"
        style={hasWidths ? { tableLayout: "fixed" } : undefined}
      >
        {hasWidths && (
          <colgroup>
            {resolvedColumns.map((col) => (
              <col
                key={col.id}
                span={col.colSpan ?? 1}
                style={col.width ? { width: col.width } : undefined}
              />
            ))}
          </colgroup>
        )}
        <thead>
          <tr>
            {resolvedColumns.map((col) => (
              <th
                key={col.id}
                className={thClass}
                colSpan={col.colSpan ?? 1}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={getRowKey(row, i)}>
              {resolvedColumns.map((col) => (
                <td
                  key={col.id}
                  className={`${cellClass} ${col.cellClassName ?? ""}`}
                  colSpan={col.colSpan ?? 1}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
