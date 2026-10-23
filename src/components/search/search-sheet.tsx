'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useMediaQuery } from '@/hooks/use-media-query'
import { SearchFilter } from './search-filter'
import type { Task } from '@/types'

interface SearchSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTask?: (task: Task) => void
}

/**
 * 搜索面板：桌面用对话框，手机用底部抽屉。
 * 把已有的 SearchFilter（关键词 + 状态/优先级/标签/日期 + 过期/重复）接进主流程，
 * 之前它没有任何入口，README 里的"搜索筛选"其实是空的。
 */
export function SearchSheet({ open, onOpenChange, onSelectTask }: SearchSheetProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const body = (
    <SearchFilter
      onSelectTask={(task) => {
        onSelectTask?.(task)
        onOpenChange(false)
      }}
    />
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[80vh] overflow-y-auto shadow-[var(--shadow-pop)] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-section">搜索事项</DialogTitle>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[88vh] shadow-[var(--shadow-pop)]">
        <DrawerHeader>
          <DrawerTitle className="text-section">搜索事项</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6">{body}</div>
      </DrawerContent>
    </Drawer>
  )
}
