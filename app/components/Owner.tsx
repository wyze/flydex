import Tooltip from './Tooltip'
import UnderlineLink from './UnderlineLink'

export default function Owner({
  owner,
  treasure_tag,
}: {
  owner: string
  treasure_tag: { display_name: string } | null
}) {
  const [name = null] = treasure_tag?.display_name.split('#') ?? []
  const truncated = owner.slice(0, 6).concat('...').concat(owner.slice(-4))

  if (!name) {
    return <UnderlineLink href={`/owner/${owner}`}>{truncated}</UnderlineLink>
  }

  return (
    <Tooltip>
      <Tooltip.Trigger>
        <span>
          <UnderlineLink href={`/owner/${owner}`} prefix={`✨ `}>
            {name}
          </UnderlineLink>
        </span>
      </Tooltip.Trigger>
      <Tooltip.Content>
        <div className="space-y-2 text-center text-sm">
          <div>✨ {treasure_tag?.display_name}</div>
          <div>{truncated}</div>
        </div>
      </Tooltip.Content>
    </Tooltip>
  )
}
