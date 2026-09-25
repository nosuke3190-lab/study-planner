import holidayJp from '@holiday-jp/holiday_jp'

const table = holidayJp.holidays as Record<string, { name: string } | undefined>

/** 日本の祝日名（祝日でなければ空文字） */
export function holidayName(key: string): string {
  return table[key]?.name ?? ''
}
