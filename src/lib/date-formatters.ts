const PT_BR = 'pt-BR';

export function formatScheduleDateTime(value: Date | string): string {
  return new Date(value).toLocaleString(PT_BR, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatScheduleTime(value: Date | string): string {
  return new Date(value).toLocaleTimeString(PT_BR, {
    hour: '2-digit',
    minute: '2-digit',
  });
}
