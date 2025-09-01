import { Injectable, NgZone } from '@angular/core';
import { UiStateService } from './ui-state/ui-state.service';
import { ToastService } from './toast.service';
import { LoggerService } from './logger/logger.service';

@Injectable({ providedIn: 'root' })
export class BarcodeService {
  constructor(private ui: UiStateService, private toast: ToastService, private zone: NgZone, private logger: LoggerService) {}

  async scan(): Promise<string | null> {
    this.ui.startLoading('Scanning barcode');
    try {
      const anyWindow = window as any;
      const plugin = anyWindow?.cordova?.plugins?.barcodeScanner;
      if (plugin && typeof plugin.scan === 'function') {
        return await new Promise<string | null>((resolve) => {
          const options = {
            preferFrontCamera: false,
            showFlipCameraButton: true,
            showTorchButton: true,
            prompt: 'Place a barcode inside the scan area',
            resultDisplayDuration: 0,
            // Restrict to common product barcodes to avoid URLs/text from QR
            // Remove this if you want to allow QR codes
            formats: 'EAN_13,EAN_8,UPC_A,UPC_E,CODE_128,CODE_39,ITF'
          };
          plugin.scan((result: any) => {
            this.zone.run(() => {
              const rawText = typeof result?.text === 'string' ? result.text : '';
              const format = result?.format as string | undefined;
              const normalized = this.normalizeBarcode(rawText, format);
              this.logger.debug('Scanned barcode', { rawText, format, normalized });
              if (!result?.cancelled && normalized) {
                resolve(normalized);
              } else {
                resolve(null);
              }
            });
          }, () => resolve(null), options);
        });
      }
      await this.toast.error('Barcode scanner not available in browser.');
      return null;
    } finally {
      this.ui.stopLoading();
    }
  }

  private normalizeBarcode(text: string, format?: string): string | null {
    if (!text) return null;
    const trimmed = text.replace(/[\u0000-\u001F\u007F]/g, '').trim();
    if (!trimmed) return null;

    const numericFormats = new Set(['EAN_13', 'EAN_8', 'UPC_A', 'UPC_E', 'ITF', 'ITF14']);
    if (format && numericFormats.has(format)) {
      // Prefer the main code without supplemental (+2/+5) if present.
      // Strategy: find digit runs of length 8-14; prefer 12-14, else the longest.
      const matches: string[] = [];
      const re = /\d{8,14}/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(trimmed)) !== null) {
        matches.push(m[0]);
      }
      if (matches.length > 0) {
        const preferred = matches.find(m => m.length >= 12 && m.length <= 14);
        return preferred || matches.sort((a, b) => b.length - a.length)[0];
      }
      // Fallback to stripping non-digits if no bounded group found
      const digitsOnly = trimmed.replace(/\D+/g, '');
      if (digitsOnly.length >= 8) return digitsOnly;
    }

    // Some scanners may return 'FORMAT:CODE' (defensive)
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0 && colonIndex < trimmed.length - 1) {
      const possible = trimmed.slice(colonIndex + 1).trim();
      if (possible) return possible;
    }

    return trimmed;
  }
}


