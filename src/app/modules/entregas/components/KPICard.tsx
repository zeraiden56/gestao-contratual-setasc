"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export default function KPICard({
  title,
  value,
  subtitle,
  color = "bg-blue-600 text-white",
}: KPICardProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200 border rounded-xl overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`flex items-baseline gap-2 p-3 rounded-lg ${color}`}>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
