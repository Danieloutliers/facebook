import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export function HTMLPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Versão HTML do LoanBuddy</CardTitle>
          <CardDescription>
            Acesse a versão simplificada em HTML do aplicativo LoanBuddy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Foi criada uma versão do LoanBuddy usando apenas HTML, CSS e JavaScript puro, sem 
            frameworks ou bibliotecas. Esta versão é mais leve e pode funcionar offline.
          </p>
          <p>
            Você pode acessar diretamente ou baixar para usar localmente.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="default" asChild>
            <a href="/html" target="_blank" rel="noopener noreferrer">
              Acessar Versão HTML
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/download-html" target="_blank" rel="noopener noreferrer">
              Baixar Versão HTML
            </a>
          </Button>
        </CardFooter>
      </Card>
      <div className="mt-4 text-center">
        <Link href="/">
          <a className="text-blue-500 hover:underline">Voltar para a página principal</a>
        </Link>
      </div>
    </div>
  );
}

export default HTMLPage;
