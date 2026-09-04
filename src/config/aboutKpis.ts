export type AboutKpi = {
  value: number
  decimals?: number
  suffix?: string
  title: string
  description?: string
}

export const aboutKpis: readonly AboutKpi[] = [
  {
    value: 40,
    suffix: '+',
    title: 'ANNI DI ESPERIENZA',
  },
  {
    value: 3,
    title: 'AREE SPECIALIZZATE',
  },
  {
    value: 1000,
    suffix: '+',
    title: 'INTERVENTI ESEGUITI',
  },
  {
    value: 4.9,
    decimals: 1,
    suffix: '★',
    title: 'VALUTAZIONE GOOGLE',
  },
]
