import type { Icon as TablerIcon, TablerIconsProps } from '@tabler/icons-react'

export function Icon({
  icon: Svg,
  ...props
}: TablerIconsProps & {
  icon: TablerIcon
}) {
  return <Svg aria-hidden="true" stroke={1.5} {...props} />
}
