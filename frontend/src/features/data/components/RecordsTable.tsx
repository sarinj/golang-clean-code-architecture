"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  displayValue,
  fieldLabel,
  isSecretField,
  recordId,
} from "@/features/data/lib/records";
import type {
  DataList,
  DataRecord,
  ResourceSlug,
} from "@/features/data/schemas/data";
import { formatDate } from "@/lib/format";

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, DataRecord>();

export function RecordsTable({
  resource,
  result,
}: {
  resource: ResourceSlug;
  result: DataList;
}) {
  const columns = useMemo(
    () =>
      columnHelper.columns([
        ...result.data_schema.fields
          .filter((field) => !isSecretField(field.name))
          .map((field) =>
            columnHelper.accessor((record) => record[field.name], {
              id: field.name,
              header: fieldLabel(field.name),
              cell: (context) => {
                const value = context.getValue();
                const text =
                  field.type === "datetime" && typeof value === "string"
                    ? formatDate(value)
                    : displayValue(value);
                return (
                  <span className="block max-w-64 truncate" title={text}>
                    {text}
                  </span>
                );
              },
            }),
          ),
        columnHelper.display({
          id: "actions",
          header: () => <span className="sr-only">Actions</span>,
          cell: (context) => {
            const id = recordId(context.row.original);
            return id ? (
              <Button variant="ghost" size="icon" asChild>
                <Link
                  href={`/data/${resource}/${encodeURIComponent(id)}`}
                  aria-label={`View record ${id}`}
                >
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
            ) : null;
          },
        }),
      ]),
    [result.data_schema.fields, resource],
  );

  const table = useTable({
    features,
    columns,
    data: result.data,
    getRowId: (record, index) => recordId(record) ?? String(index),
  });

  return (
    <Table>
      <TableCaption className="sr-only">
        {resource} records, page {result.page}
      </TableCaption>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id} className="bg-muted/35 hover:bg-muted/35">
            {group.headers.map((header) => (
              <TableHead
                key={header.id}
                className="h-11 px-5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
              >
                {header.isPlaceholder ? null : (
                  <table.FlexRender header={header} />
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getAllCells().map((cell) => (
              <TableCell key={cell.id} className="h-16 px-5 text-sm last:w-14">
                <table.FlexRender cell={cell} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
