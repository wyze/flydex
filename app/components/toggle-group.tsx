import * as RadixToggleGroup from '@radix-ui/react-toggle-group'
import { motion } from 'framer-motion'

type Props = {
  children: React.ReactNode
  className?: string
  label: string
}

type MultipleProps = ValueProps<string[]> & { type: 'multiple' }
type SingleProps = ValueProps<string> & { type: 'single' }

type ValueProps<T> = {
  onValueChange: (value: T) => void
  value: T
}

export function ToggleGroup({
  children,
  className = '',
  label,
  ...props
}: Props & (MultipleProps | SingleProps)) {
  return (
    <RadixToggleGroup.Root
      className={`${className} inline-flex space-x-px rounded bg-pink-100 shadow-[0_1px_3px] shadow-gray-700 dark:bg-gray-800`}
      {...props}
      asChild
      aria-label={label}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {children}
      </motion.div>
    </RadixToggleGroup.Root>
  )
}

ToggleGroup.Item = function ToggleGroupItem({
  className,
  label,
  ...props
}: Props & { className?: string; value: string }) {
  return (
    <RadixToggleGroup.Item
      className={`${
        className ?? 'h-5 w-5'
      } flex h-5 w-5 items-center justify-center bg-white text-xs font-light leading-4 text-gray-500 transition-colors duration-200 first:rounded-l last:rounded-r hover:bg-pink-100 focus:z-10 focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none radix-state-on:bg-pink-200 radix-state-on:text-pink-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-pink-600 dark:hover:text-gray-50 dark:radix-state-on:bg-pink-500 dark:radix-state-on:text-gray-50`}
      {...props}
      aria-label={label}
    />
  )
}
