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
import { Plus, Trash, Lock, KeyRound, Calendar as CalendarIcon, CircleDot, Crown, Clock, CheckCircle2, Key, CalendarCheck } from "lucide-react";
import ReactConfetti from 'react-confetti';

interface TaskCalendarProps {
  onSecretComplete: () => void;
}

export default function TaskCalendar({ onSecretComplete }: TaskCalendarProps) {
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
  
  // Definição da sequência secreta
  // Usamos uma sequência fixa, mas garantimos que não é persistente entre sessões
  const secretSequence = ['adicionar-tarefa-secreta', 'marcar-completa-secreta', 'adicionar-senha-secreta'];
  
  // Limpar qualquer progresso salvo anteriormente no localStorage quando o componente é montado
  useEffect(() => {
    // Também remover qualquer variável de localStorage que possa conter progresso da sequência
    localStorage.removeItem('secret-progress');
    localStorage.removeItem('login-unlocked');
  }, []);
  
  // Atualizar o tamanho da janela quando o componente for montado e quando a janela for redimensionada
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    // Adicionando ouvinte para evento de redimensionamento
    window.addEventListener('resize', handleResize);
    
    // Limpar o ouvinte quando o componente for desmontado
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Função para gerar IDs únicos
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Não vamos mais carregar ou salvar tarefas no localStorage
  // para garantir que a sequência secreta precisa ser realizada a cada acesso
  
  // Adicionar tarefas predefinidas quando o componente é montado
  useEffect(() => {
    // Remover qualquer tarefa que possa ter sido salva anteriormente
    localStorage.removeItem('calendar-tasks');
    
    // Criar e definir as tarefas predefinidas
    setTasks(createPredefinedTasks());
  }, []);

  // Verificar progresso da sequência secreta
  useEffect(() => {
    if (secretProgress.length === secretSequence.length) {
      try {
        const isCorrect = secretProgress.every((action, index) => action === secretSequence[index]);
        if (isCorrect) {
          // Limpar dados antes de completar a sequência
          localStorage.removeItem('calendar-tasks');
          
          try {
            // Obter apenas as tarefas predefinidas com datas atualizadas
            const updatedPredefinedTasks = getUpdatedPredefinedTasks();
            
            // Manter apenas as tarefas predefinidas
            setTasks(updatedPredefinedTasks);
          } catch (error) {
            console.error("Erro ao atualizar tarefas predefinidas:", error);
            // Em caso de erro, criar novas tarefas predefinidas
            setTasks(createPredefinedTasks());
          }
          
          // Chamar o callback de conclusão
          onSecretComplete();
        } else {
          setSecretProgress([]);
        }
      } catch (error) {
        console.error("Erro ao verificar sequência secreta:", error);
        setSecretProgress([]);
      }
    }
  }, [secretProgress, onSecretComplete, secretSequence]);

  // Função para verificar se é uma tarefa predefinida
  const isPredefinedTask = (title: string): boolean => {
    return title === "Joga bola" || title === "Joga xadrez";
  };
  
  // Função para criar novas tarefas predefinidas com datas atualizadas
  const createPredefinedTasks = () => {
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
  };
  
  // Função para atualizar as datas das tarefas predefinidas existentes
  const getUpdatedPredefinedTasks = () => {
    const today = new Date();
    const predefinedTasks = tasks.filter(task => isPredefinedTask(task.title));
    
    // Se não houver tarefas predefinidas, criar novas
    if (predefinedTasks.length === 0) {
      return createPredefinedTasks();
    }
    
    return predefinedTasks.map(task => {
      if (task.title === "Joga bola") {
        // Atualizar data para 5 dias no futuro
        const newDate = new Date(today);
        newDate.setDate(today.getDate() + 5);
        return { ...task, date: newDate };
      } else if (task.title === "Joga xadrez") {
        // Atualizar data para 10 dias no futuro
        const newDate = new Date(today);
        newDate.setDate(today.getDate() + 10);
        return { ...task, date: newDate };
      }
      return task;
    });
  };
  
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
    
    try {
      // Obter tarefas que não são predefinidas
      const regularTasks = tasks.filter(task => !isPredefinedTask(task.title));
      
      // Obter tarefas predefinidas com datas atualizadas
      const updatedPredefinedTasks = getUpdatedPredefinedTasks();
      
      // Combinar tudo: tarefas predefinidas atualizadas + tarefas regulares existentes + nova tarefa
      setTasks([...updatedPredefinedTasks, ...regularTasks, newTask]);
      
      // Adicionar efeito visual de entrada à nova tarefa (com pequeno delay para garantir que o DOM foi atualizado)
      setTimeout(() => {
        const newTaskElement = document.getElementById(`task-${newTask.id}`);
        if (newTaskElement) {
          newTaskElement.classList.add('task-enter');
          // Remover a classe após a animação para não interferir em outras animações
          setTimeout(() => {
            newTaskElement.classList.remove('task-enter');
          }, 500);
        }
      }, 50);
    } catch (error) {
      console.error("Erro ao adicionar tarefa:", error);
      
      // Tentar uma abordagem mais simples se houver erro
      const newTasks = [...tasks];
      newTasks.push(newTask);
      setTasks(newTasks);
    }
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
    console.log("Tentando remover tarefa com ID:", taskId);
    
    // Buscar a tarefa pelo ID
    const taskToRemove = tasks.find(task => task.id === taskId);
    
    if (!taskToRemove) {
      console.log("Tarefa não encontrada para remoção");
      return;
    }
    
    console.log("Tarefa encontrada para remoção:", taskToRemove.title);
    
    // Se for uma tarefa predefinida, não permitir a remoção, mas mostrar mensagem
    if (isPredefinedTask(taskToRemove.title)) {
      console.log("Não é possível remover tarefas predefinidas:", taskToRemove.title);
      
      // Adicionar um efeito visual para indicar que a tarefa não pode ser removida
      const taskElement = document.getElementById(`task-${taskId}`);
      if (taskElement) {
        taskElement.classList.add('shake-animation');
        setTimeout(() => {
          taskElement.classList.remove('shake-animation');
        }, 800);
      }
      return;
    }
    
    // Efeito visual melhorado antes de remover
    const taskElement = document.getElementById(`task-${taskId}`);
    if (taskElement) {
      // Adicionar classe de animação de saída
      taskElement.classList.add('task-exit');
      
      // Pequeno delay para mostrar o efeito antes de remover
      setTimeout(() => {
        // Remover a tarefa da lista
        setTasks(tasks.filter(task => task.id !== taskId));
        console.log("Tarefa removida com sucesso:", taskToRemove.title);
      }, 300);
    } else {
      // Se não encontrar o elemento, remover sem animação
      setTasks(tasks.filter(task => task.id !== taskId));
      console.log("Tarefa removida com sucesso (sem animação):", taskToRemove.title);
    }
  };

  // Função para alternar o status de conclusão de uma tarefa
  const toggleTaskCompletion = (taskId: string) => {
    // Buscar a tarefa pelo ID para verificar
    const taskToToggle = tasks.find(task => task.id === taskId);
    
    // Se a tarefa não existir, sair
    if (!taskToToggle) {
      console.log("Tarefa não encontrada:", taskId);
      return;
    }
    
    // Se for uma tarefa predefinida, não permitir completar
    if (isPredefinedTask(taskToToggle.title)) {
      console.log("Não é possível completar tarefas predefinidas:", taskToToggle.title);
      return;
    }
    
    // Criar uma cópia atualizada das tarefas
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        // Inverter o status de conclusão
        const updatedTask = { ...task, completed: !task.completed };
        
        // Se a tarefa foi marcada como concluída (e não estava antes)
        if (updatedTask.completed && !task.completed) {
          console.log("Tarefa marcada como concluída:", task.title);
          
          // Tentar animar a conclusão
          try {
            const taskElement = document.getElementById(`task-${taskId}`);
            if (taskElement) {
              // Iniciar animação
              taskElement.classList.add('scale-animation');
              
              // Obter posição para confetti
              const rect = taskElement.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              
              setTimeout(() => {
                taskElement.classList.add('task-bounce');
                
                // Posicionar confetti acima da tarefa
                setConfettiPosition({
                  x: centerX,
                  y: centerY - 50
                });
                
                setTimeout(() => {
                  // Mostrar confetti
                  setShowConfetti(true);
                  
                  // Vibração opcional se disponível
                  if ('vibrate' in navigator) {
                    try {
                      navigator.vibrate(50);
                    } catch (e) {
                      // Ignorar erro
                    }
                  }
                }, 100);
                
                // Remover classes de animação
                setTimeout(() => {
                  taskElement.classList.remove('scale-animation');
                  taskElement.classList.remove('task-bounce');
                }, 1000);
                
                // Parar confetti
                setTimeout(() => {
                  setShowConfetti(false);
                }, 4000);
              }, 150);
            } else {
              console.error("Elemento da tarefa não encontrado:", `task-${taskId}`);
            }
          } catch (error) {
            console.error("Erro ao animar tarefa:", error);
          }
          
          // Verificar se está na sequência secreta
          if (updatedTask.title.toLowerCase().includes("secreta") &&
              secretProgress.length < secretSequence.length &&
              secretSequence[secretProgress.length] === 'marcar-completa-secreta') {
            setSecretProgress([...secretProgress, 'marcar-completa-secreta']);
          }
        }
        
        return updatedTask;
      }
      return task;
    });
    
    setTasks(updatedTasks);
  };
  
  // Verificar se uma tarefa faz parte da sequência secreta
  const isSecretTask = (task: Task): boolean => {
    return task.title.toLowerCase().includes("secreta") || task.title.toLowerCase().includes("senha");
  };

  // Filtrar tarefas para a data selecionada (mas sempre mostrar predefinidas)
  const tasksForSelectedDate = tasks.filter(task => 
    isPredefinedTask(task.title) || 
    (selectedDate && task.date && isSameDay(new Date(task.date), selectedDate))
  );

  // Função para lidar com mudança de data no calendário
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // Renderizar o componente do calendário com lista de tarefas
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={300}
          gravity={0.3}
          initialVelocityY={10}
          initialVelocityX={5}
          colors={['#34D399', '#3B82F6', '#A855F7', '#EC4899', '#F59E0B', '#EF4444']}
          confettiSource={{
            x: confettiPosition.x,
            y: confettiPosition.y,
            w: 10,
            h: 10
          }}
        />
      )}
      
      {/* Calendário Modernizado */}
      <Card className="p-2 sm:p-4 shadow-lg modern-calendar relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"></div>
        <CardHeader className="px-2 py-3 sm:px-6 sm:py-4">
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <CalendarIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
              Calendário de Tarefas
            </span>
          </CardTitle>
          <CardDescription className="flex items-center text-xs sm:text-sm text-muted-foreground">
            <Clock className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Selecione uma data para gerenciar suas tarefas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-1 relative rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl"></div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              locale={ptBR}
              className="rounded-xl border-0 shadow-sm bg-transparent transition-all duration-300"
              modifiers={{
                hasTasks: tasks.map(task => new Date(task.date))
              }}
              modifiersClassNames={{
                hasTasks: "has-tasks bg-blue-100 dark:bg-blue-900/20 font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/30"
              }}
              classNames={{
                months: "animate-fadeIn transition-opacity duration-500",
                caption_label: "text-blue-600 dark:text-blue-400 font-bold",
                nav_button: "hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-300",
                head_cell: "text-muted-foreground font-medium",
                cell: "transition-transform duration-150 hover:scale-105",
                day: "h-9 w-9 text-sm font-medium transition-all duration-300 hover:shadow-md rounded-full",
              }}
            />
          </div>
          
          {/* Painel de estatísticas modernizado */}
          <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl p-2 sm:p-3 text-center shadow-sm border border-blue-100 dark:border-blue-800/30 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-center mb-1">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center">
                  <CircleDot className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  <span className="text-[10px] sm:text-xs font-medium">Total</span>
                </Badge>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{tasks.length}</div>
              <div className="text-[10px] sm:text-xs text-blue-500 dark:text-blue-300 opacity-80">Tarefas Planejadas</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-2 sm:p-3 text-center shadow-sm border border-green-100 dark:border-green-800/30 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-center mb-1">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center">
                  <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  <span className="text-[10px] sm:text-xs font-medium">Concluídas</span>
                </Badge>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{tasks.filter(t => t.completed).length}</div>
              <div className="text-[10px] sm:text-xs text-green-500 dark:text-green-300 opacity-80">Tarefas Finalizadas</div>
            </div>
          </div>

          {/* Legenda das cores do calendário */}
          <div className="mt-3 sm:mt-4 flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center">
              <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-accent mr-1 sm:mr-2"></span>
              <span>Hoje</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500 mr-1 sm:mr-2"></span>
              <span>Com tarefas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tarefas Modernizada */}
      <Card className="p-2 sm:p-4 shadow-lg modern-calendar relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-teal-500 to-emerald-500"></div>
        <CardHeader className="px-2 py-3 sm:px-6 sm:py-4">
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <CheckCircle2 className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-teal-600 truncate">
              Tarefas - {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </CardTitle>
          <CardDescription className="flex items-center text-xs sm:text-sm text-muted-foreground">
            <CircleDot className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Adicione e gerencie suas tarefas para esta data
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {/* Formulário modernizado para adicionar nova tarefa */}
            <div className="space-y-2 group">
              <div className="relative">
                <Input 
                  placeholder="Título da tarefa"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="pl-9 sm:pl-10 pr-3 sm:pr-4 py-5 sm:py-6 rounded-xl border-2 focus:border-primary transition-all shadow-sm focus:shadow-md text-sm sm:text-base"
                />
                <div className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  <CircleDot className="h-4 w-4 sm:h-5 sm:w-5 text-primary/60 group-focus-within:text-primary transition-colors" />
                </div>
              </div>
              <Button 
                onClick={addTask} 
                disabled={!newTaskTitle.trim()}
                className="w-full rounded-xl py-4 sm:py-6 shadow-md bg-gradient-to-r from-green-500 to-teal-600 hover:opacity-90 transition-all transform hover:translate-y-[-2px] text-sm sm:text-base"
              >
                <Plus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse" /> Adicionar Tarefa
              </Button>
              
              {/* Sem dicas explícitas */}
              <div className="mt-2 text-[10px] sm:text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800/30 p-1.5 sm:p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                <p className="italic flex items-center">
                  <CircleDot className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 text-primary/60" />
                  Gerencie suas tarefas neste calendário
                </p>
              </div>
            </div>
            
            {/* Lista de tarefas para a data selecionada - Modernizada */}
            <div>
              {tasksForSelectedDate.length === 0 ? (
                <div className="text-center py-6 sm:py-8 bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-2.5 sm:p-3">
                      <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Nenhuma tarefa para esta data
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-1 sm:mt-2 text-[10px] sm:text-xs bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 hover:shadow-md transition-all transform hover:scale-105"
                      onClick={() => document.querySelector('input')?.focus()}
                    >
                      <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 text-blue-500" /> Criar tarefa
                    </Button>
                  </div>
                </div>
              ) : (
                <ul className="space-y-3">
                  {tasksForSelectedDate.map(task => (
                    <li 
                      key={task.id} 
                      className={`flex flex-wrap sm:flex-nowrap items-start p-4 border-2 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md task-card
                        ${isPredefinedTask(task.title) 
                          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800/50 predefined' 
                          : isSecretTask(task)
                            ? 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border-purple-200 dark:border-purple-800/50'
                            : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800/50'
                        } 
                        ${task.completed ? 'completed' : 'pending'}
                      `}
                      id={`task-${task.id}`}
                    >
                      <div className="flex-shrink-0 pt-1">
                        <Checkbox 
                          id={`checkbox-${task.id}`}
                          checked={task.completed}
                          onCheckedChange={() => toggleTaskCompletion(task.id)}
                          className={`h-5 w-5 rounded-full border-2 cursor-pointer ${
                            isPredefinedTask(task.title) 
                              ? 'border-blue-400 text-blue-600 opacity-50 pointer-events-none' 
                              : isSecretTask(task)
                                ? 'border-purple-400 text-purple-600'
                                : task.completed 
                                  ? 'border-green-400 text-green-600 scale-110 ring-2 ring-green-200 ring-offset-1 transition-all'
                                  : 'border-gray-300 hover:border-blue-500 transition-all'
                          }`}
                          disabled={isPredefinedTask(task.title)}
                        />
                      </div>
                      <div className="flex-1 min-w-0 ml-3 sm:ml-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full">
                            {isPredefinedTask(task.title) ? (
                              task.title === "Joga bola" ? (
                                <CircleDot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <Crown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              )
                            ) : isSecretTask(task) ? (
                              <KeyRound className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            ) : (
                              <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <Label 
                            htmlFor={`checkbox-${task.id}`}
                            className={`font-medium text-base cursor-pointer break-words overflow-hidden ${task.completed ? 'line-through text-muted-foreground transition-all duration-500' : 'transition-all duration-300'}`}
                          >
                            {task.title}
                            {task.completed && (
                              <span className="ml-2 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Concluída
                              </span>
                            )}
                          </Label>
                          <Badge variant="outline" className="ml-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/30 px-2.5 py-0.5">
                            {format(new Date(task.date), 'dd/MM/yyyy', { locale: ptBR })}
                          </Badge>
                          {/* Removemos o ícone de chave que poderia revelar tarefas secretas */}
                        </div>
                        <div className="flex flex-wrap mt-1.5 text-xs text-muted-foreground">
                          <div className="flex items-center mr-2 mb-1">
                            <Clock className="h-3 w-3 mr-1 text-muted-foreground/70 flex-shrink-0" />
                            <span>Criada: {format(new Date(task.createdAt), 'dd/MM/yy HH:mm', { locale: ptBR })}</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1 mb-1">
                            <span className="inline-flex items-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full text-xs">
                              <CalendarIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{format(new Date(task.date), 'dd/MM/yy', { locale: ptBR })}</span>
                            </span>
                            {isPredefinedTask(task.title) && (
                              <span className="inline-flex items-center font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full text-xs">
                                {task.title === "Joga bola" ? "5 dias" : "10 dias"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="w-full sm:w-auto mt-2 sm:mt-0 sm:ml-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            console.log("Botão de exclusão clicado para a tarefa:", task.id, task.title);
                            removeTask(task.id);
                          }}
                          className={`group h-9 w-9 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-all duration-300 ${isPredefinedTask(task.title) ? 'opacity-60' : 'opacity-70 hover:opacity-100'}`}
                          aria-label="Remover tarefa"
                          title={isPredefinedTask(task.title) ? "Esta tarefa não pode ser removida" : "Remover tarefa"}
                        >
                          <Trash className="h-4 w-4 transition-transform group-hover:rotate-12 group-hover:scale-110" />
                          <span className="sr-only">Remover tarefa</span>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
