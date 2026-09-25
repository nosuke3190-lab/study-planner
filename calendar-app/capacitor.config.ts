import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'io.github.nosuke3190.calendar',
  appName: 'カレンダー',
  webDir: 'dist',
  android: {
    backgroundColor: '#F7F6F2',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_calendar',
      iconColor: '#1E6B64',
    },
  },
}

export default config
