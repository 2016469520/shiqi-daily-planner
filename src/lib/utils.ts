import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind-merge 不认识我们自定义的字号工具类（text-body / text-caption …），
 * 会把它当成 text-color 处理，于是 `text-caption text-muted-foreground` 里的字号被丢掉。
 * 这里把六档字号注册为 font-size 组，既保留与颜色的共存，又能正确互相覆盖。
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["display", "title", "section", "body", "caption", "micro"] },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
