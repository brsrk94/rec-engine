export function formatIndianNumber(
  value: number,
  options?: Intl.NumberFormatOptions
) {
  return new Intl.NumberFormat('en-IN', options).format(value)
}
