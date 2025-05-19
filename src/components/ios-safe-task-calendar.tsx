import { useState, useEffect, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types/task";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Trash, Calendar as CalendarIcon, CircleDot, Crown, Clock, CheckCircle2 } from "lucide-react";
import ReactConfetti from 'react-confetti';

interface TaskCalendarProps {
  onSecretComplete: () => void;
}

// Detecção de iOS
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

export default function IOSSafeTaskCalendar({ onSecretComplete }: TaskCalendarProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [secretProgress, setSecretProgress] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [confettiPosition, setConfettiPosition] = useState<{x: number, y: number}>({x: 0, y: 0});
  const [windowSize, setWindowSize] = useState<{width: number, height: number}>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });
  
  // Definição da sequência secreta - simplificada para iOS
  // No iOS, vamos simplificar a sequência para evitar problemas com localStorage
  const secretSequence = isIOS() 
    ? ['adicionar-tarefa-secreta', 'adicionar-senha-secreta'] 
    : ['adicionar-tarefa-secreta', 'marcar-completa-secreta', 'adicionar-senha-secreta'];
  
  // Limpar qualquer progresso quando o componente é montado
  // No iOS, evitamos manipulações desnecessárias do localStorage
  useEffect(() => {
    // Para iOS, usamos uma abordagem mais conservadora
    if (!isIOS()) {
      try {
        localStorage.removeItem('secret-progress');
        localStorage.removeItem('login-unlocked');
        localStorage.removeItem('calendar-tasks');
      } catch (err) {
        console.error('Erro ao limpar localStorage:', err);
      }
    }
  }, []);
  
  // Atualizar o tamanho da janela
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Função para gerar IDs únicos
  const generateId = useCallback((): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }, []);

  // Função para criar tarefas predefinidas
  const createPredefinedTasks = useCallback(() => {
    const today = new Date();
    
    // Data para "Joga bola" - 5 dias no futuro
    const ballGameDate = new Date(today);
    ballGameDate.setDate(today.getDate() + 5);
    
    // Data para "Joga xadrez" - 10 dias no futuro
    const chessGameDate = new Date(today);
    chessGameDate.setDate(today.getDate() + 10);
    
    // Criar tarefas predefinidas
    return [
      {
        id: generateId(),
        title: "Joga bola",
        date: ballGameDate,
        completed: false,
        createdAt: new Date()
      },
      {
        id: generateId(),
        title: "Joga xadrez",
        date: chessGameDate,
        completed: false,
        createdAt: new Date()
      }
    ];
  }, [generateId]);
  
  // Inicializar tarefas predefinidas
  useEffect(() => {
    // No iOS, evitamos operações arriscadas de localStorage
    try {
      setTasks(createPredefinedTasks());
    } catch (error) {
      console.error("Erro ao criar tarefas predefinidas:", error);
      // Tarefas mínimas para não quebrar a interface
      setTasks([
        {
          id: "fallback1",
          title: "Joga bola",
          date: new Date(),
          completed: false,
          createdAt: new Date()
        },
        {
          id: "fallback2",
          title: "Joga xadrez",
          date: new Date(),
          completed: false,
          createdAt: new Date()
        }
      ]);
    }
  }, [createPredefinedTasks]);

  // Verificar progresso da sequência secreta - implementação à prova de falhas
  useEffect(() => {
    try {
      if (secretProgress.length === secretSequence.length) {
        // Verificar se a sequência está correta
        const isCorrect = secretProgress.every((action, index) => 
          action === secretSequence[index]
        );
        
        if (isCorrect) {
          try {
            // Limpar as tarefas antes de completar a sequência
            setTasks(createPredefinedTasks());
            
            // Chamar o callback de conclusão
            onSecretComplete();
          } catch (error) {
            console.error("Erro ao concluir sequência secreta:", error);
            // Em caso de erro, tentar diretamente o callback
            onSecretComplete();
          }
        } else {
          setSecretProgress([]);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar sequência:", error);
      setSecretProgress([]);
    }
  }, [secretProgress, secretSequence, onSecretComplete, createPredefinedTasks]);

  // Função para verificar se é uma tarefa predefinida
  const isPredefinedTask = useCallback((title: string): boolean => {
    return title === "Joga bola" || title === "Joga xadrez";
  }, []);
  
  // Função para adicionar uma nova tarefa - mais robusta
  const addTask = () => {
    try {
      if (!newTaskTitle.trim()) return;
      
      const newTask: Task = {
        id: generateId(),
        title: newTaskTitle,
        date: selectedDate,
        completed: false,
        createdAt: new Date()
      };
      
      // Adicionar à lista de tarefas
      setTasks(prevTasks => [...prevTasks, newTask]);
      
      // Limpar o campo
      setNewTaskTitle("");
      
      // Verificar progresso da sequência secreta
      if (newTaskTitle.toLowerCase().includes("secreta") && 
          secretProgress.length < secretSequence.length &&
          secretSequence[secretProgress.length] === 'adicionar-tarefa-secreta') {
        
        setSecretProgress(prev => [...prev, 'adicionar-tarefa-secreta']);
        
      } else if (newTaskTitle.toLowerCase().includes("senha") && 
                secretProgress.length < secretSequence.length &&
                secretSequence[secretProgress.length] === 'adicionar-senha-secreta') {
        
        setSecretProgress(prev => [...prev, 'adicionar-senha-secreta']);
      }
    } catch (error) {
      console.error("Erro ao adicionar tarefa:", error);
      // Notificar usuário que algo deu errado
      alert("Não foi possível adicionar a tarefa. Tente novamente.");
    }
  };

  // Função para completar tarefa - mais segura
  const toggleTaskCompletion = (taskId: string) => {
    try {
      // Encontrar a tarefa
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      // Verificar se é predefinida
      if (isPredefinedTask(task.title)) return;
      
      // Atualizar tarefas
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === taskId 
            ? {...t, completed: !t.completed} 
            : t
        )
      );
      
      // Se a tarefa foi completada e é parte da sequência
      if (!task.completed && 
          task.title.toLowerCase().includes("secreta") &&
          secretProgress.length < secretSequence.length &&
          secretSequence[secretProgress.length] === 'marcar-completa-secreta') {
        
        // Efeito visual
        setConfettiPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        });
        setShowConfetti(true);
        
        // Atualizar progresso
        setSecretProgress(prev => [...prev, 'marcar-completa-secreta']);
        
        // Limpar confetti
        setTimeout(() => {
          setShowConfetti(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Erro ao completar tarefa:", error);
    }
  };

  // Função para remover tarefa
  const removeTask = (taskId: string) => {
    try {
      // Encontrar a tarefa
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      // Não remover tarefas predefinidas
      if (isPredefinedTask(task.title)) return;
      
      // Remover a tarefa
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error("Erro ao remover tarefa:", error);
    }
  };

  // Filtrar tarefas para a data selecionada
  const tasksForSelectedDate = tasks.filter(task => 
    isPredefinedTask(task.title) || 
    (selectedDate && task.date && isSameDay(new Date(task.date), selectedDate))
  );

  // Função para lidar com mudança de data
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // UI do componente
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          colors={['#34D399', '#3B82F6', '#A855F7', '#EC4899', '#F59E0B']}
        />
      )}
      
      {/* Calendário Modernizado */}
      <Card className="p-4 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"></div>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
              Calendário de Tarefas
            </span>
          </CardTitle>
          <CardDescription className="flex items-center text-muted-foreground">
            <Clock className="mr-2 h-4 w-4" />
            Selecione uma data para gerenciar suas tarefas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateChange}
            locale={ptBR}
            className="rounded-xl border-0 shadow-sm"
          />
        </CardContent>
      </Card>
      
      {/* Lista de Tarefas */}
      <div className="space-y-4">
        <Card className="p-4 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-teal-500 to-cyan-500"></div>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5 text-primary" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-teal-600">
                Tarefas do Dia
              </span>
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Adicionar nova tarefa */}
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Nova tarefa..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addTask} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Lista de tarefas */}
              <div className="space-y-2 mt-4">
                {tasksForSelectedDate.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhuma tarefa para este dia</p>
                    <p className="text-sm mt-1">Adicione uma nova tarefa acima</p>
                  </div>
                ) : (
                  tasksForSelectedDate.map((task) => (
                    <div
                      key={task.id}
                      id={`task-${task.id}`}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                        task.completed
                          ? 'bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30'
                          : 'bg-card border'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTaskCompletion(task.id)}
                          disabled={isPredefinedTask(task.title)}
                        />
                        <div>
                          <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {isPredefinedTask(task.title) ? (
                              <Badge variant="outline" className="text-xs">Agendada</Badge>
                            ) : (
                              format(new Date(task.date), "HH:mm", { locale: ptBR })
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {!isPredefinedTask(task.title) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTask(task.id)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}