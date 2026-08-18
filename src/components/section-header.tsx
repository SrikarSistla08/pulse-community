export default function SectionHeader({
  label,
  count,
  plain,
}: {
  label: string
  count?: number | string
  plain?: boolean
}) {
  return (
    <div className="pulse-section-heading">
      <h2>
        {plain ? label : `/ ${label}`}
      </h2>
      {count !== undefined && (
        <span className="text-[10px] text-[var(--dim)]">{count}</span>
      )}
    </div>
  )
}
