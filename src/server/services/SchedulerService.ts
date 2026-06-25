import { startScheduler } from '@/lib/scheduler';

/**
 * Serviço tipado para encapsular operações do Scheduler em background (API-010).
 */
export const SchedulerService = {
  /**
   * Acorda o scheduler em background para reavaliar a fila de disparos.
   * Inicializa o scheduler preguiçosamente na primeira chamada.
   */
  wakeUp() {
    const globalObj = global as unknown as { wakeUpScheduler?: () => void; isSchedulerRunning?: boolean };
    
    if (!globalObj.isSchedulerRunning) {
      startScheduler();
    }

    if (typeof globalObj.wakeUpScheduler === 'function') {
      globalObj.wakeUpScheduler();
    }
  }
};
export default SchedulerService;
