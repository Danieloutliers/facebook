import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types/task";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Trash, Lock, KeyRound, Calendar as CalendarIcon } from "lucide-react";

interface TaskCalendarProps {
  onSecretComplete: () => void;
}

export default function TaskCalendar({ onSecretComplete }: TaskCalendarProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [secretProgress, setSecretProgress] = useState<string[]>([]);
  
  // Definição da sequência secreta
  const secretSequence = ['adicionar-tarefa-secreta', 'marcar-completa-secreta', 'adicionar-senha-secreta'];
  
  // Função para gerar IDs únicos
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Carregar tarefas salvas no localStorage ao iniciar
  useEffect(() => {
    const savedTasks = localStorage.getItem('calendar-tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
      } catch (e) {
        console.error("Erro ao carregar tarefas:", e);
      }
    }
  }, []);

  // Salvar tarefas no localStorage quando mudam
  useEffect(() => {
    localStorage.setItem('calendar-tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Verificar progresso da sequência secreta
  useEffect(() => {
    if (secretProgress.length === secretSequence.length) {
      const isCorrect = secretProgress.every((action, index) => action === secretSequence[index]);
      if (isCorrect) {
        onSecretComplete();
      } else {
        setSecretProgress([]);
      }
    }
  }, [secretProgress, onSecretComplete, secretSequence]);

  // Adicionar uma nova tarefa
  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: generateId(),
      title: newTaskTitle,
      date: selectedDate,
      completed: false,
      createdAt: new Date()
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskTitle("");
    
    // Verificar se a tarefa adiciona progresso à sequência secreta
    if (newTaskTitle.toLowerCase().includes("secreta") && 
        secretProgress.length < secretSequence.length &&
        secretSequence[secretProgress.length] === 'adicionar-tarefa-secreta') {
      
      // Adicionar ao progresso com efeito visual
      const calendar = document.querySelector('.rdp');
      if (calendar) {
        calendar.classList.add('pulse-animation');
        setTimeout(() => {
          calendar.classList.remove('pulse-animation');
        }, 1000);
      }
      
      setSecretProgress([...secretProgress, 'adicionar-tarefa-secreta']);
      
    } else if (newTaskTitle.toLowerCase().includes("senha") && 
               secretProgress.length < secretSequence.length &&
               secretSequence[secretProgress.length] === 'adicionar-senha-secreta') {
      
      // Adicionar ao progresso com efeito visual
      const calendar = document.querySelector('.rdp');
      if (calendar) {
        calendar.classList.add('glow-animation');
        setTimeout(() => {
          calendar.classList.remove('glow-animation');
        }, 1000);
      }
      
      setSecretProgress([...secretProgress, 'adicionar-senha-secreta']);
    }
  };

  // Remover uma tarefa
  const removeTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  // Alternar o status de conclusão de uma tarefa
  const toggleTaskCompletion = (taskId: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const updated = { ...task, completed: !task.completed };
        
        // Verificar se marcar como completa faz parte da sequência secreta
        if (updated.completed && 
            updated.title.toLowerCase().includes("secreta") &&
            secretProgress.length < secretSequence.length &&
            secretSequence[secretProgress.length] === 'marcar-completa-secreta') {
          
          // Adicionar ao progresso com efeito visual
          const taskElement = document.getElementById(`task-${taskId}`)?.closest('li');
          if (taskElement) {
            taskElement.classList.add('scale-animation');
            setTimeout(() => {
              taskElement.classList.remove('scale-animation');
            }, 1000);
          }
          
          setSecretProgress([...secretProgress, 'marcar-completa-secreta']);
        }
        
        return updated;
      }
      return task;
    });
    
    setTasks(updatedTasks);
  };

  // Filtrar tarefas para a data selecionada
  const tasksForSelectedDate = tasks.filter(task => 
    selectedDate && task.date && isSameDay(new Date(task.date), selectedDate)
  );
  
  // Função para verificar se uma tarefa faz parte da sequência secreta
  const isSecretTask = (task: Task): boolean => {
    return task.title.toLowerCase().includes("secreta") || task.title.toLowerCase().includes("senha");
  };

  // Renderizar o componente do calendário com lista de tarefas
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Calendário */}
      <Card className="p-4 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5" /> Calendário
          </CardTitle>
          <CardDescription>Selecione uma data para gerenciar tarefas</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar 
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={ptBR}
            className="rounded-md border"
          />
          
          {/* Painel de estatísticas */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="bg-primary/10 rounded-md p-2 text-center">
              <div className="text-2xl font-bold">{tasks.length}</div>
              <div className="text-xs text-muted-foreground">Total de tarefas</div>
            </div>
            <div className="bg-green-500/10 rounded-md p-2 text-center">
              <div className="text-2xl font-bold">{tasks.filter(t => t.completed).length}</div>
              <div className="text-xs text-muted-foreground">Tarefas concluídas</div>
            </div>
          </div>

          {/* Removemos o indicador de progresso visível para manter o segredo */}
        </CardContent>
      </Card>

      {/* Lista de Tarefas */}
      <Card className="p-4 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            Tarefas - {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
          </CardTitle>
          <CardDescription>Gerencie suas tarefas para esta data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Formulário para adicionar nova tarefa */}
            <div className="space-y-2">
              <Input 
                placeholder="Título da tarefa"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
              <Button 
                onClick={addTask} 
                disabled={!newTaskTitle.trim()}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar Tarefa
              </Button>
              
              {/* Sem dicas explícitas */}
              <div className="mt-2 text-xs text-muted-foreground">
                <p className="italic">Gerencie suas tarefas neste calendário</p>
              </div>
            </div>
            
            {/* Lista de tarefas para a data selecionada */}
            <div>
              {tasksForSelectedDate.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma tarefa para esta data
                </p>
              ) : (
                <ul className="space-y-2">
                  {tasksForSelectedDate.map(task => (
                    <li 
                      key={task.id} 
                      className="flex items-start space-x-2 p-2 border rounded-md transition-colors"
                    >
                      <Checkbox 
                        id={`task-${task.id}`}
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskCompletion(task.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Label 
                            htmlFor={`task-${task.id}`}
                            className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                          >
                            {task.title}
                          </Label>
                          {/* Removemos o ícone de chave que poderia revelar tarefas secretas */}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Criada em: {format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTask(task.id)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <span>Total: {tasksForSelectedDate.length} tarefas</span>
          <span>Concluídas: {tasksForSelectedDate.filter(t => t.completed).length}</span>
        </CardFooter>
      </Card>
    </div>
  );
}
