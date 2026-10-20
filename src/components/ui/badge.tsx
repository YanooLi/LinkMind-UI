import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      default: 'border-transparent bg-muted text-foreground',
      safe: 'border-transparent bg-emerald-100 text-emerald-800',
      suspicious: 'border-transparent bg-amber-100 text-amber-800',
      malicious: 'border-transparent bg-red-100 text-red-800',
      unknown: 'border-border text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
})

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
