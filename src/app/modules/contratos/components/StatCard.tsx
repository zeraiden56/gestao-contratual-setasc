"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "danger" | "accent";
  percentage?: number;
}

const variantColors: Record<string, string> = {
  primary: "bg-blue-600 text-white",
  success: "bg-green-600 text-white",
  warning: "bg-yellow-500 text-white",
  danger: "bg-red-600 text-white",
  accent: "bg-purple-600 text-white",
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  variant = "primary",
  percentage,
}: StatCardProps) {
  const color = variantColors[variant];

  return (
    <Card className={`${color} shadow-md`}>
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Icon className="w-4 h-4" />
            {label}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-lg font-bold">{value}</p>
          {percentage !== undefined && (
            <p className="text-sm text-white/80">{percentage.toFixed(1)}%</p>
          )}
        </div>

        {percentage !== undefined && (
          <Progress value={percentage} className="bg-white/20" />
        )}
      </CardContent>
    </Card>
  );
}
