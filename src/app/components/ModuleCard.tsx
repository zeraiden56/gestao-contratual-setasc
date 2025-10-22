import { Card, CardContent } from "@/app/components/ui/card";
import { ReactNode } from "react";

interface ModuleCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

export function ModuleCard({ icon, title, description, onClick }: ModuleCardProps) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-lg transition rounded-xl border border-slate-200"
    >
      <CardContent className="flex flex-col items-center text-center p-6 space-y-3">
        <div className="text-4xl text-blue-600">{icon}</div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-slate-500 text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
