interface TrackOptions {
  attendee?: number
  socket?: string
}

interface AnalyticsRepository {
  trackEvent(
    eventName: string,
    payload: any,
    options: TrackOptions
  ): Promise<void>

  trackError(error: Error, options: TrackOptions): Promise<void>
}
