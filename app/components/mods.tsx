import { motion } from 'framer-motion'

import type { ModWithColor } from '~/lib/types'

import { Popover } from './popover'
import { ScrollArea } from './scroll-area'
import { Tooltip } from './tooltip'

export function Mods({
  items,
  title,
}: {
  items: ModWithColor[]
  title: string
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <div>
      <span className="text-xs font-semibold text-gray-400">{title}</span>
      <Popover>
        <Popover.Trigger>
          <motion.button
            className="flex max-w-max overflow-hidden rounded border border-transparent transition duration-200 hover:border-gray-600"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
          >
            {items.slice(0, 12).map(({ color, slot }, index) => (
              <div
                key={slot ?? index}
                className="h-3 w-3"
                style={{
                  background: `linear-gradient(119.42deg, rgba(37, 33, 55, 0.5) -16.72%, rgb(${color}) 153.84%)`,
                }}
              />
            ))}
          </motion.button>
        </Popover.Trigger>
        <Popover.Content>
          <ScrollArea className="h-36 w-full">
            <div className="space-y-1">
              {items.map(({ color, mod, slot }) => (
                <div
                  key={slot}
                  className="flex items-center gap-3 text-sm leading-4"
                >
                  <Tooltip>
                    <Tooltip.Trigger>
                      <img
                        alt={mod.name}
                        className="w-8 rounded"
                        src={mod.image}
                        style={{
                          background: `linear-gradient(119.42deg, rgba(37, 33, 55, 0.5) -16.72%, rgb(${color}) 153.84%)`,
                        }}
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                      {mod.rarity} {mod.category} {mod.type} Mod
                    </Tooltip.Content>
                  </Tooltip>
                  {mod.name}
                </div>
              ))}
            </div>
          </ScrollArea>
        </Popover.Content>
      </Popover>
    </div>
  )
}
