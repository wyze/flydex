export default function DescriptionListCard({
  data,
  description,
  label,
  title,
}: {
  data: Record<string, JSX.Element | string | number | null>
  description: React.ReactNode
  label: string
  title: React.ReactNode
}) {
  return (
    <section aria-labelledby={label}>
      <div className="overflow-hidden bg-white shadow dark:bg-gray-800 sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2
            id={label}
            className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
          >
            {title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
        <dl className="divide-y divide-gray-200 border-b border-t border-gray-200 dark:divide-gray-700 dark:border-gray-700">
          {Object.entries(data)
            .filter(([, value]) => value !== null)
            .map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between px-4 py-3 text-sm font-medium sm:px-6"
              >
                <dt className="text-gray-500 dark:text-gray-400">{key}</dt>
                <dd className="whitespace-nowrap text-gray-900 dark:text-gray-200">
                  {value}
                </dd>
              </div>
            ))}
        </dl>
      </div>
    </section>
  )
}
