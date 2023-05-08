import { motion } from 'framer-motion'

export default function UnderlineLink({
  children,
  href,
  prefix,
}: {
  children: React.ReactNode
  href: string
  prefix?: string
}) {
  return (
    <motion.a
      href={href}
      {...(href.startsWith('https://')
        ? { rel: 'noreferrer', target: '_blank' }
        : {})}
      whileHover="hover"
    >
      {prefix}
      <motion.span
        className="inline-flex items-center gap-0.5 pb-0.5 text-pink-500"
        style={{
          background: `
            linear-gradient(currentColor 0 0) 
            bottom left/
            var(--underline-width, 0%) 0.1em
            no-repeat`,
        }}
        variants={{ hover: { '--underline-width': '100%' } as any }}
      >
        {children}
      </motion.span>
    </motion.a>
  )
}
