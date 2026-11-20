"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Plus } from "lucide-react";
import type { PosWorkspaceController } from "../../hooks/usePosWorkspace";

interface PosExpensesViewProps {
  pos: PosWorkspaceController;
}

export function PosExpensesView({ pos }: PosExpensesViewProps) {
  const { expenses, totalExpensesAmount, setIsAddExpenseOpen, exportCSV } = pos;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Business Expense Logging</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Record operational costs, rent, packaging, logistics, and store overheads.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCSV("expenses")}
            className="h-9 text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Export CSV
          </Button>
          <Button
            onClick={() => setIsAddExpenseOpen(true)}
            className="h-9 text-xs bg-slate-900 text-white"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Record Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500">
              Total Recorded Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-slate-900">
              ${totalExpensesAmount.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Across all logged operational categories
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500">Rent & Utilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-slate-900">
              $
              {expenses
                .filter((e) => e.category.includes("Rent") || e.category.includes("Utilities"))
                .reduce((s, e) => s + e.amount, 0)
                .toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Store lease, electricity, water bills</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500">
              Packaging & Daily Supplies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-slate-900">
              $
              {expenses
                .filter((e) => !e.category.includes("Rent") && !e.category.includes("Utilities"))
                .reduce((s, e) => s + e.amount, 0)
                .toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Bags, stationary, snacks, minor maintenance
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="text-xs font-semibold">Date</TableHead>
              <TableHead className="text-xs font-semibold">Expense Category</TableHead>
              <TableHead className="text-xs font-semibold">Description / Payee</TableHead>
              <TableHead className="text-xs font-semibold">Store Outlet</TableHead>
              <TableHead className="text-xs font-semibold">Recorded By</TableHead>
              <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
              <TableHead className="text-xs font-semibold text-center">Payment Method</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((exp) => (
              <TableRow key={exp.id}>
                <TableCell className="text-xs text-slate-600 font-mono">{exp.date}</TableCell>
                <TableCell className="text-xs font-semibold text-slate-900">
                  <Badge variant="outline" className="text-[10px] bg-slate-50">
                    {exp.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-700">{exp.description}</TableCell>
                <TableCell className="text-xs font-mono text-slate-500">{exp.storeId}</TableCell>
                <TableCell className="text-xs text-slate-600">{exp.recordedBy}</TableCell>
                <TableCell className="text-xs text-right font-mono font-bold text-slate-900">
                  ${exp.amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-xs text-center text-slate-600">
                  {exp.paymentMethod}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
