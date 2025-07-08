import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  PlayCircle, 
  CheckCircle, 
  Clock, 
  Users, 
  FileText, 
  CreditCard, 
  BarChart3, 
  BookOpen,
  Smartphone
} from "lucide-react";

// Dados das vídeo aulas simplificadas
const videoLessons = [
  {
    id: "introducao",
    title: "Começando",
    description: "Primeiros passos no loanBuddy",
    duration: "2:45",
    icon: BookOpen,
    level: "Básico"
  },
  {
    id: "clientes",
    title: "Cadastrar Clientes",
    description: "Como adicionar seus clientes",
    duration: "3:20",
    icon: Users,
    level: "Básico"
  },
  {
    id: "contratos",
    title: "Criar Contratos",
    description: "Faça contratos de empréstimo",
    duration: "4:15",
    icon: FileText,
    level: "Básico"
  },
  {
    id: "pagamentos",
    title: "Registrar Pagamentos",
    description: "Como receber e registrar pagamentos",
    duration: "3:45",
    icon: CreditCard,
    level: "Básico"
  },
  {
    id: "relatorios",
    title: "Ver Relatórios",
    description: "Análise dos seus dados",
    duration: "2:30",
    icon: BarChart3,
    level: "Intermediário"
  },
  {
    id: "backup",
    title: "Fazer Backup",
    description: "Proteja seus dados",
    duration: "2:00",
    icon: Smartphone,
    level: "Intermediário"
  }
];

export default function HowToUse() {
  const [selectedVideo, setSelectedVideo] = useState(videoLessons[0]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  const markAsCompleted = (lessonId: string) => {
    if (!completedLessons.includes(lessonId)) {
      setCompletedLessons([...completedLessons, lessonId]);
    }
  };

  const getLevelColor = (level: string) => {
    if (level === "Básico") return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Como usar</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Aprenda a usar o loanBuddy com tutoriais simples
        </p>
      </div>

      {/* Video Player */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white p-4">
                <selectedVideo.icon className="h-16 w-16 mx-auto mb-3 opacity-80" />
                <h2 className="text-lg font-semibold mb-2">{selectedVideo.title}</h2>
                <p className="text-gray-300 text-sm mb-4">{selectedVideo.description}</p>
                
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Assistir Aula
                </Button>
                
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {selectedVideo.duration}
                  </span>
                  <Badge className={getLevelColor(selectedVideo.level)} variant="secondary">
                    {selectedVideo.level}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lesson List */}
      <div className="space-y-3">
        <h3 className="font-semibold mb-4">Todas as Aulas</h3>
        
        {videoLessons.map((lesson) => {
          const isCompleted = completedLessons.includes(lesson.id);
          const isSelected = selectedVideo.id === lesson.id;
          
          return (
            <Card 
              key={lesson.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-900/10" : ""
              }`}
              onClick={() => setSelectedVideo(lesson)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isCompleted ? "bg-green-100 dark:bg-green-900/20" : "bg-gray-100 dark:bg-gray-800"
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <lesson.icon className={`h-5 w-5 ${
                          isSelected ? "text-green-600" : "text-gray-500"
                        }`} />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium mb-1 ${
                      isSelected ? "text-green-900 dark:text-green-100" : ""
                    }`}>
                      {lesson.title}
                    </h4>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {lesson.description}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getLevelColor(lesson.level)} variant="secondary">
                        {lesson.level}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {lesson.duration}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Botão de completar para aula selecionada */}
                {isSelected && !isCompleted && (
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsCompleted(lesson.id);
                      }}
                      size="sm" 
                      variant="outline"
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar como concluída
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Progress */}
      {completedLessons.length > 0 && (
        <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {completedLessons.length}/{videoLessons.length}
            </div>
            <p className="text-sm text-green-700 dark:text-green-400">
              aulas concluídas
            </p>
          </div>
        </div>
      )}
    </div>
  );
}