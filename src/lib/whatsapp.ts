import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';

// Define global interface to prevent multiple instances in dev mode
declare global {
  var whatsappClientInstance: WhatsAppService | undefined;
}

export class WhatsAppService {
  private client: Client;
  private qrCode: string | null = null;
  private isAuthenticated: boolean = false;
  private isReady: boolean = false;
  private status: 'DISCONNECTED' | 'INITIALIZING' | 'QR_READY' | 'AUTHENTICATED' | 'READY' = 'DISCONNECTED';
  
  // Safety Handling
  private dailyCount: number = 0;
  private lastReset: Date = new Date();

  constructor() {
    console.log('Initializing WhatsApp Service...');
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    this.initializeEvents();
    this.status = 'INITIALIZING';
    this.client.initialize().catch(err => {
        console.error("Initialization error:", err);
        this.status = 'DISCONNECTED';
    });
  }

  private initializeEvents() {
    this.client.on('qr', (qr) => {
      console.log('QR Code received');
      this.qrCode = qr;
      this.status = 'QR_READY';
    });

    this.client.on('ready', () => {
      console.log('WhatsApp Client is ready!');
      this.isReady = true;
      this.status = 'READY';
      this.qrCode = null; // Clear QR code
    });

    this.client.on('authenticated', () => {
      console.log('WhatsApp Client authenticated');
      this.isAuthenticated = true;
      this.status = 'AUTHENTICATED';
      this.qrCode = null;
    });

    this.client.on('auth_failure', (msg) => {
      console.error('AUTHENTICATION FAILURE', msg);
      this.status = 'DISCONNECTED';
    });

    this.client.on('disconnected', (reason) => {
      console.log('Client was disconnected', reason);
      this.isAuthenticated = false;
      this.isReady = false;
      this.status = 'DISCONNECTED';
    });
  }

  private checkReset() {
    const now = new Date();
    if (now.getDate() !== this.lastReset.getDate()) {
      this.dailyCount = 0;
      this.lastReset = now;
    }
  }

  public getDailyCount() {
    this.checkReset();
    return this.dailyCount;
  }

  public incrementDailyCount() {
    this.checkReset();
    this.dailyCount++;
  }

  public getRiskLevel() {
    const count = this.getDailyCount();
    if (count < 50) return 'LOW';
    if (count < 100) return 'MEDIUM';
    return 'HIGH';
  }

  public getQrCode() {
    return this.qrCode;
  }

  public getStatus() {
    return {
      status: this.status,
      isAuthenticated: this.isAuthenticated,
      isReady: this.isReady,
      stats: {
        dailyCount: this.getDailyCount(),
        riskLevel: this.getRiskLevel(),
        recommendedLimit: 50
      }
    };
  }

  public async sendMessage(to: string, message: string, mediaData?: { mimetype: string, data: string, filename?: string }, options?: { fallbackName?: string }) {
    if (!this.isReady) throw new Error('Cliente WhatsApp não está pronto');
    
    // Safety check reset
    this.checkReset();
    
    // Format number to be digits only initially
    const number = to.replace(/\D/g, '');
    const candidateId = `${number}@c.us`;

    console.log(`Attempting to send message to ${to} (candidate: ${candidateId})`);

    let finalId = candidateId;

    // specific check for group IDs or if it's already properly formatted
    if (to.includes('@g.us')) {
       finalId = to;
    } else {
       // Validate number and get the correct ID
       try {
          const validContact = await this.client.getNumberId(candidateId);
          
          if (validContact && validContact._serialized) {
            finalId = validContact._serialized;
          } else {
            console.warn(`Number ${number} not found on WhatsApp.`);
            throw new Error(`O número ${number} não está registrado no WhatsApp.`);
          }
       } catch (e: any) {
          console.error("Error validating number:", e);
          throw new Error(`Falha ao validar número: ${e.message}`);
       }
    }

    // Smart Variable Substitution
    let finalMessage = message;
    
    // Replace {{phone}} locally first
    finalMessage = finalMessage.replace(/{{phone}}/g, number);

    if (finalMessage.includes('{{name}}') || finalMessage.includes('{{nome}}')) {
        try {
            const contact = await this.client.getContactById(finalId);
            // pushname: what the user set for themselves
            // name: what I saved them as (if synced) or sometimes same as pushname
            // options.fallbackName: what we have in our local DB
            
            const bestName = contact.pushname || contact.name || options?.fallbackName || 'Cliente';
            console.log(`Smart Substitution: Using '${bestName}' for contact ${finalId} (Push: ${contact.pushname}, Name: ${contact.name}, Fallback: ${options?.fallbackName})`);
            
            finalMessage = finalMessage.replace(/{{name}}/g, bestName).replace(/{{nome}}/g, bestName);
        } catch (error) {
            console.warn('Failed to fetch contact details for substitution, using fallback.', error);
            const fallback = options?.fallbackName || 'Cliente';
            finalMessage = finalMessage.replace(/{{name}}/g, fallback).replace(/{{nome}}/g, fallback);
        }
    }
    
    console.log(`Sending to final ID: ${finalId}`);

    try {
        if (mediaData) {
            const media = new MessageMedia(mediaData.mimetype, mediaData.data, mediaData.filename);
            await this.client.sendMessage(finalId, media, { caption: finalMessage });
        } else {
            await this.client.sendMessage(finalId, finalMessage);
        }
    } catch (sendError: any) {
        console.error('Error in client.sendMessage:', sendError);
        throw new Error(`Falha ao enviar mensagem: ${sendError.message}`);
    }
    
    this.incrementDailyCount();
    return { success: true };
  }
  
  public async logout() {
      await this.client.logout();
      this.isAuthenticated = false;
      this.isReady = false;
      this.qrCode = null;
      this.status = 'DISCONNECTED';
      // Re-initialize to allow new login
      this.client.initialize(); 
  }
}

// Singleton pattern
if (!global.whatsappClientInstance) {
  global.whatsappClientInstance = new WhatsAppService();
}
const service = global.whatsappClientInstance;

export default service;
