import * as RadixSeparator from '@radix-ui/react-separator'

export default function Separator({
  orientation,
}: {
  orientation: 'horizontal' | 'vertical'
}) {
  return (
    <RadixSeparator.Root
      className={`${
        orientation === 'vertical' ? 'mx-2' : 'my-2'
      } bg-gray-300 data-[orientation=horizontal]:h-px data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px`}
      decorative
      orientation={orientation}
    />
  )
}
