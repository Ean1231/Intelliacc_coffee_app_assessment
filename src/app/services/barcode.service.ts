import { Injectable } from '@angular/core';
import { UiStateService } from './ui-state/ui-state.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class BarcodeService {
  constructor(private ui: UiStateService, private toast: ToastService) {}

  async scan(): Promise<string | null> {
    this.ui.startLoading('Scanning barcode');
    try {
      const anyWindow = window as any;
      const plugin = anyWindow?.cordova?.plugins?.barcodeScanner;
      if (plugin && typeof plugin.scan === 'function') {
        return await new Promise<string | null>((resolve) => {
          plugin.scan((result: any) => {
            if (!result.cancelled && result.text) {
              resolve(result.text as string);
            } else {
              resolve(null);
            }
          }, () => resolve(null));
        });
      }
      await this.toast.error('Barcode scanner not available in browser.');
      return null;
    } finally {
      this.ui.stopLoading();
    }
  }
}


