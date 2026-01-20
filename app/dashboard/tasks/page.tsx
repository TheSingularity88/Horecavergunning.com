'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Search, CheckSquare, Calendar, LayoutGrid, List } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { Header } from '@/app/components/dashboard/Header';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Badge, getStatusBadgeVariant } from '@/app/components/ui/Badge';
import { Spinner } from '@/app/components/ui/Spinner';
import { cn } from '@/app/lib/utils/cn';
import type { Task } from '@/app/lib/types/database';

type ViewMode = 'list' | 'board';

export default function TasksPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('tasks')
          .select('*')
          .order('due_date', { ascending: true, nullsFirst: false });

        if (search) {
          query = query.ilike('title', `%${search}%`);
        }

        if (statusFilter) {
          query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;
        if (error) throw error;
        setTasks((data as Task[]) || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [supabase, search, statusFilter]);

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
    });
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const tasksByStatus = {
    pending: tasks.filter((t) => t.status === 'pending'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    completed: tasks.filter((t) => t.status === 'completed'),
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
        } as unknown as never)
        .eq('id', taskId);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t))
      );
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <div
      className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-slate-900 line-clamp-2">{task.title}</h4>
        <Badge variant={getStatusBadgeVariant(task.priority)} className="ml-2 flex-shrink-0">
          {task.priority}
        </Badge>
      </div>
      {task.due_date && (
        <div className="flex items-center gap-1 text-sm text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(task.due_date)}
        </div>
      )}
    </div>
  );

  const BoardColumn = ({
    title,
    tasks,
    status,
  }: {
    title: string;
    tasks: Task[];
    status: string;
  }) => (
    <div className="flex-1 min-w-[280px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <span className="text-sm text-slate-500">{tasks.length}</span>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No tasks</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen">
      <Header title={t.dashboard?.nav?.tasks || 'Tasks'} />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Actions Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex gap-3">
              {viewMode === 'list' && (
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={statusOptions}
                  className="w-40"
                />
              )}
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'px-3 py-2 transition-colors',
                    viewMode === 'list'
                      ? 'bg-slate-100 text-slate-900'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('board')}
                  className={cn(
                    'px-3 py-2 transition-colors',
                    viewMode === 'board'
                      ? 'bg-slate-100 text-slate-900'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
              <Button
                onClick={() => router.push('/dashboard/tasks/new')}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : viewMode === 'board' ? (
            /* Board View */
            <div className="flex gap-6 overflow-x-auto pb-4">
              <BoardColumn title="Pending" tasks={tasksByStatus.pending} status="pending" />
              <BoardColumn title="In Progress" tasks={tasksByStatus.in_progress} status="in_progress" />
              <BoardColumn title="Completed" tasks={tasksByStatus.completed} status="completed" />
            </div>
          ) : (
            /* List View */
            <Card padding="none">
              <div className="divide-y divide-slate-100">
                {tasks.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-12">No tasks found</p>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(
                            task.id,
                            task.status === 'completed' ? 'pending' : 'completed'
                          );
                        }}
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                          task.status === 'completed'
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-slate-300 hover:border-amber-500'
                        )}
                      >
                        {task.status === 'completed' && (
                          <CheckSquare className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'font-medium',
                            task.status === 'completed'
                              ? 'text-slate-400 line-through'
                              : 'text-slate-900'
                          )}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-sm text-slate-500 truncate">{task.description}</p>
                        )}
                      </div>
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Calendar className="w-4 h-4" />
                          {formatDate(task.due_date)}
                        </div>
                      )}
                      <Badge variant={getStatusBadgeVariant(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
