import { format, startOfToday } from 'date-fns'

export const today = format(startOfToday(), 'yyyy-MM-dd')
