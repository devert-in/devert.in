"use client";

import { useMemo, useState } from "react";
import { academicYears, departments, placementRecords, type AcademicYear, type CompanyType, type Department } from "@/lib/data/placements";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ALL = "all";

export function RecordsTable() {
  const [year, setYear] = useState<AcademicYear | typeof ALL>(ALL);
  const [department, setDepartment] = useState<Department | typeof ALL>(ALL);
  const [companyType, setCompanyType] = useState<CompanyType | typeof ALL>(ALL);

  const filtered = useMemo(() => {
    return placementRecords.filter((record) => {
      if (year !== ALL && record.year !== year) return false;
      if (department !== ALL && record.department !== department) return false;
      if (companyType !== ALL && record.type !== companyType) return false;
      return true;
    });
  }, [year, department, companyType]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historical Placement Records</CardTitle>
        <CardDescription>Filter by academic year, department, and recruiter type.</CardDescription>
        <div className="mt-4 flex flex-wrap gap-3">
          <Select value={year} onValueChange={(value) => setYear(value as AcademicYear | typeof ALL)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Academic Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Years</SelectItem>
              {academicYears.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={department} onValueChange={(value) => setDepartment(value as Department | typeof ALL)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={companyType} onValueChange={(value) => setCompanyType(value as CompanyType | typeof ALL)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Company Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Types</SelectItem>
              <SelectItem value="Product">Product</SelectItem>
              <SelectItem value="Service">Service</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-foreground/60">
            No placement records match the selected filters.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>CTC (LPA)</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.studentName}</TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell>{record.year}</TableCell>
                    <TableCell>{record.company}</TableCell>
                    <TableCell>{record.role}</TableCell>
                    <TableCell className={record.ctc >= 15 ? "font-bold text-gold-600" : ""}>{record.ctc}</TableCell>
                    <TableCell>
                      <Badge variant={record.type === "Product" ? "default" : "muted"}>{record.type}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-3 text-xs text-foreground/50">
              Showing {filtered.length} of {placementRecords.length} records.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
