'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRepos } from '@/providers/repo-provider'
import { useAuth } from '@/providers/auth-provider'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Task } from '@/types'
import { MoveHorizontal, TagIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MoveToCategoryMenuProps {
  task: Task
  className?: string
}

export function MoveToCategoryMenu({ task, className }: MoveToCategoryMenuProps) {
  const { user } = useAuth()
  const { tasks: taskRepo, tags: tagRepo } = useRepos()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagRepo.getAll(user!.id),
    enabled: !!user,
  })

  const moveMutation = useMutation({
    mutationFn: async (tagId: string | null) => {
      await taskRepo.update(user!.id, task.id, {
        tag_id: tagId || undefined,
      } as Partial<Task>)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('已移动事项')
      setOpen(false)
    },
    onError: () => {
      toast.error('移动失败，请重试')
    },
  })

  const currentTagId = task.tag_id || null

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger>
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-7 px-2 text-caption', className)}
          disabled={moveMutation.isPending}
          type="button"
        >
          {moveMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : (
            <MoveHorizontal className="h-3.5 w-3.5 mr-1" />
          )}
          移动到
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-micro">选择分类</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tags.map((tag) => (
          <DropdownMenuItem
            key={tag.id}
            onClick={() => moveMutation.mutate(tag.id)}
            disabled={tag.id === currentTagId || moveMutation.isPending}
            className="flex items-center gap-2 text-body"
          >
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: tag.color }}
            />
            <span>{tag.name}</span>
            {tag.id === currentTagId && (
              <span className="ml-auto text-micro text-muted-foreground">当前</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => moveMutation.mutate(null)}
          disabled={currentTagId === null || moveMutation.isPending}
          className="flex items-center gap-2 text-body"
        >
          <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span>未分类</span>
          {currentTagId === null && (
            <span className="ml-auto text-micro text-muted-foreground">当前</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
