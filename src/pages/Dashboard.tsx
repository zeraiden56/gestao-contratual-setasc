import { FiFileText, FiUsers, FiDollarSign, FiTrendingUp, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const stats = [
  {
    title: "Contratos Ativos",
    value: "24",
    change: "+12%",
    icon: FiFileText,
    color: "text-primary"
  },
  {
    title: "Fornecedores",
    value: "156",
    change: "+3%",
    icon: FiUsers,
    color: "text-success"
  },
  {
    title: "Valor Total",
    value: "R$ 2.4M",
    change: "+8%",
    icon: FiDollarSign,
    color: "text-warning"
  },
  {
    title: "Economia",
    value: "R$ 340K",
    change: "+15%",
    icon: FiTrendingUp,
    color: "text-success"
  }
];

const recentContracts = [
  {
    id: "001/2024",
    objeto: "Fornecimento de materiais de escritório",
    valor: "R$ 125.000,00",
    status: "ativo",
    vencimento: "31/12/2024"
  },
  {
    id: "002/2024",
    objeto: "Serviços de limpeza e conservação",
    valor: "R$ 340.000,00",
    status: "ativo",
    vencimento: "14/02/2025"
  },
  {
    id: "003/2024",
    objeto: "Manutenção de equipamentos",
    valor: "R$ 75.000,00",
    status: "pendente",
    vencimento: "28/02/2025"
  }
];

const alerts = [
  {
    type: "warning",
    title: "Contratos vencendo",
    description: "3 contratos vencem nos próximos 30 dias",
    action: "Ver contratos"
  },
  {
    type: "info",
    title: "Relatório mensal",
    description: "Relatório de dezembro disponível para download",
    action: "Baixar"
  }
];

export default function Dashboard() {
  return (
    <div className="space-y-6 helium-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo ao sistema Helium - Visão geral dos contratos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="helium-card helium-slide-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-success">
                {stat.change} em relação ao mês anterior
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contratos Recentes */}
        <Card className="lg:col-span-2 helium-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Contratos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentContracts.map((contract) => (
                <div key={contract.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">{contract.id}</span>
                      <Badge 
                        variant={contract.status === 'ativo' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {contract.status === 'ativo' ? 'Ativo' : 'Pendente'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {contract.objeto}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Valor: {contract.valor}</span>
                      <span>Vence: {contract.vencimento}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Ver detalhes
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alertas e Notificações */}
        <Card className="helium-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  {alert.type === 'warning' ? (
                    <FiAlertCircle className="h-5 w-5 text-warning mt-0.5" />
                  ) : (
                    <FiCheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-foreground mb-1">
                      {alert.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {alert.description}
                    </p>
                    <Button variant="outline" size="sm" className="text-xs">
                      {alert.action}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="helium-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="helium-button-primary h-20 flex-col gap-2">
              <FiFileText className="h-6 w-6" />
              <span className="text-sm">Novo Contrato</span>
            </Button>
            <Button variant="outline" className="helium-button-secondary h-20 flex-col gap-2">
              <FiUsers className="h-6 w-6" />
              <span className="text-sm">Gestores</span>
            </Button>
            <Button variant="outline" className="helium-button-secondary h-20 flex-col gap-2">
              <FiDollarSign className="h-6 w-6" />
              <span className="text-sm">Pagamentos</span>
            </Button>
            <Button variant="outline" className="helium-button-secondary h-20 flex-col gap-2">
              <FiTrendingUp className="h-6 w-6" />
              <span className="text-sm">Relatórios</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}