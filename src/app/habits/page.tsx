'use client'

import { useState } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { HabitCheckin } from '@/components/habits/habit-checkin'
import { HabitCheckinErrorWrapper } from '@/components/habits/habit-checkin-error-wrapper'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useRepos } from '@/providers/repo-provider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { todayStr } from '@/lib/utils/date'
import { toast } from 'sonner'
import { Bell } from 'lucide-react'
import type { MeasurementType } from '@/types'

export default function HabitsPage() {
  const { user } = useAuth()
  const { habits } = useRepos()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<MeasurementType>('boolean')
  const [newTarget, setNewTarget] = useState('1')
  const [newUnit, setNewUnit] = useState('')
  const [reminderTime, setReminderTime] = useState('')
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const createMutation = useMutation({
    mutationFn: () =>
      habits.create(user!.id, {
        name: newName,
        measurement_type: newType,
        target_value: Number(newTarget),
        unit: newUnit || undefined,
        schedule_rule: { frequency: 'daily', interval: 1 },
        start_date: todayStr(),
        reminder_time: reminderTime || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      setShowCreate(false)
      setNewName('')
      setReminderTime('')
      toast.success('习惯已创建')
    },
    onError: () => toast.error('创建失败'),
  })

  if (!user) return null

  const form = (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!newName.trim()) return
        createMutation.mutate()
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="habit-name">习惯名称</Label>
        <Input
          id="habit-name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="如：阅读、运动、早睡"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>计量方式</Label>
          <Select value={newType} onValueChange={(v: string | null) => v && setNewType(v as MeasurementType)}>
            <SelectTrigger>
              <SelectValue>
                {{ boolean: '完成/未完成', count: '次数', duration: '分钟', minutes: '分钟', hours: '小时', numeric: '自定义数值' }[newType] || newType}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="boolean">完成/未完成</SelectItem>
              <SelectItem value="count">次数</SelectItem>
              <SelectItem value="minutes">分钟</SelectItem>
              <SelectItem value="hours">小时</SelectItem>
              <SelectItem value="numeric">自定义数值</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>目标值</Label>
          <Input value={newTarget} onChange={(e) => setNewTarget(e.target.value)} type="number" />
        </div>
      </div>
      {newType !== 'boolean' && (
        <div className="space-y-2">
          <Label>单位</Label>
          <Input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="如：次、分钟、个" />
        </div>
      )}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          提醒时间
        </Label>
        <Input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
        <p className="text-micro text-muted-foreground">每天在此时间提醒打卡（可选）</p>
      </div>
      <Button type="submit" className="w-full" disabled={createMutation.isPending || !newName.trim()}>
        创建习惯
      </Button>
    </form>
  )

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-display">习惯打卡</h1>
          <p className="mt-1 text-caption text-muted-foreground">坚持每一天</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />新建习惯
        </Button>
      </div>

      <HabitCheckinErrorWrapper>
        <HabitCheckin />
      </HabitCheckinErrorWrapper>

      {/* Create dialog */}
      {isDesktop ? (
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>新建习惯</DialogTitle>
            </DialogHeader>
            {form}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={showCreate} onOpenChange={setShowCreate}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>新建习惯</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4">{form}</div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
