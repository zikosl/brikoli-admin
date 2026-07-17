import { apiUrl, getAccessToken } from './apiClient';

type RealtimeEventName = 'request.changed';

export function subscribeToRealtime(eventName: RealtimeEventName, onEvent: () => void) {
  const token = getAccessToken();

  if (!token || typeof window.EventSource === 'undefined') {
    return () => undefined;
  }

  const source = new window.EventSource(`${apiUrl('/realtime/events')}?token=${encodeURIComponent(token)}`);
  source.addEventListener(eventName, onEvent);

  return () => {
    source.close();
  };
}
