import type { Icon as TablerIcon, TablerIconsProps } from '@tabler/icons-react'

type IconProps = TablerIconsProps & {
  icon: TablerIcon
}

export default function Icon({ icon: Svg, ...props }: IconProps) {
  return <Svg aria-hidden="true" stroke={1.5} {...props} />
}
