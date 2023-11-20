function hasLeagueProp(value: any): value is { league: string } {
  return 'league' in value
}

export function league<
  T extends string | { league: string } | { league_full: string },
>(...args: [T, T]) {
  const order = ['Apex', 'Predator', 'Monarch', 'Pupa', 'Larvae']

  function value(item: T) {
    return typeof item === 'string'
      ? item
      : hasLeagueProp(item)
        ? item.league
        : item.league_full
  }
  function format(item: string) {
    return item.split(' ').at(0) ?? ''
  }

  const left = format(value(args[0]))
  const right = format(value(args[1]))

  return order.indexOf(left) - order.indexOf(right)
}

export function rarity<T extends { rarity: string }>(left: T, right: T) {
  const order = [
    'Core',
    'Common',
    'Uncommon',
    'Rare',
    'Epic',
    'Legendary',
    'Artefact',
  ]

  return order.indexOf(left.rarity) - order.indexOf(right.rarity)
}
