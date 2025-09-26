import { useState } from "react";
import { FiPlus, FiSearch, FiDownload, FiFilter, FiMoreVertical, FiFileText } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock data para demonstração
const contratos = [
  {
    id: "001/2024",
    objeto: "Fornecimento de materiais de escritório",
    fornecedor: "Papelaria Moderna Ltda",
    valor: "R$ 125.000,00",
    inicio: "01/01/2024",
    fim: "31/12/2024",
    status: "ativo",
    gestor: "Maria Santos"
  },
  {
    id: "002/2024",
    objeto: "Serviços de limpeza e conservação",
    fornecedor: "Clean Service S.A.",
    valor: "R$ 340.000,00",
    inicio: "15/02/2024",
    fim: "14/02/2025",
    status: "ativo",
    gestor: "João Silva"
  },
  {
    id: "003/2024",
    objeto: "Manutenção de equipamentos de informática",
    fornecedor: "TechFix Soluções",
    valor: "R$ 75.000,00",
    inicio: "01/03/2024",
    fim: "28/02/2025",
    status: "pendente",
    gestor: "Carlos Oliveira"
  }
];

const statusConfig = {
  ativo: { label: "Ativo", variant: "default" as const },
  pendente: { label: "Pendente", variant: "secondary" as const },
  vencido: { label: "Vencido", variant: "destructive" as const },
  finalizado: { label: "Finalizado", variant: "outline" as const }
};

export default function Contratos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredContratos, setFilteredContratos] = useState(contratos);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = contratos.filter(contrato =>
      contrato.objeto.toLowerCase().includes(term.toLowerCase()) ||
      contrato.fornecedor.toLowerCase().includes(term.toLowerCase()) ||
      contrato.id.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredContratos(filtered);
  };

  return (
    <div className="space-y-6 helium-fade-in">
      {/* Header da página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Contratos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todos os contratos administrativos do órgão
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="helium-button-secondary">
            <FiDownload className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
          <Button className="helium-button-primary">
            <FiPlus className="mr-2 h-4 w-4" />
            Novo Contrato
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="helium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Contratos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">24</div>
            <p className="text-xs text-muted-foreground">+2 este mês</p>
          </CardContent>
        </Card>

        <Card className="helium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contratos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">18</div>
            <p className="text-xs text-muted-foreground">75% do total</p>
          </CardContent>
        </Card>

        <Card className="helium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">R$ 2.4M</div>
            <p className="text-xs text-muted-foreground">Em contratos ativos</p>
          </CardContent>
        </Card>

        <Card className="helium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vencendo em 30 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">3</div>
            <p className="text-xs text-muted-foreground">Requer atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <Card className="helium-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Pesquisar contratos..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 helium-input"
              />
            </div>
            <Button variant="outline" className="helium-button-secondary">
              <FiFilter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de contratos */}
      <Card className="helium-card">
        <CardContent className="pt-6">
          {filteredContratos.length === 0 ? (
            <div className="text-center py-12">
              <FiFileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum contrato encontrado
              </h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Tente ajustar os filtros de busca." : "Comece criando um novo contrato."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Objeto</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vigência</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gestor</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContratos.map((contrato) => (
                    <TableRow key={contrato.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{contrato.id}</TableCell>
                      <TableCell className="max-w-xs truncate" title={contrato.objeto}>
                        {contrato.objeto}
                      </TableCell>
                      <TableCell>{contrato.fornecedor}</TableCell>
                      <TableCell className="font-medium">{contrato.valor}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{contrato.inicio}</div>
                          <div className="text-muted-foreground">até {contrato.fim}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[contrato.status as keyof typeof statusConfig].variant}>
                          {statusConfig[contrato.status as keyof typeof statusConfig].label}
                        </Badge>
                      </TableCell>
                      <TableCell>{contrato.gestor}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <FiMoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem>Renovar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}