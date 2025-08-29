import { Injectable, NgZone } from '@angular/core';
import { UiStateService } from './ui-state/ui-state.service';
import { ToastService } from './toast.service';

export type ImageSource = 'camera' | 'photos';

@Injectable({ providedIn: 'root' })
export class ImageService {
  constructor(private ui: UiStateService, private toast: ToastService, private zone: NgZone) {}

  async pick(source: ImageSource): Promise<{ dataUrl: string; fileName: string } | null> {
    this.ui.startLoading(source === 'camera' ? 'Taking photo' : 'Choosing photo');
    try {
      const anyWindow = window as any;
      const camera = anyWindow?.Capacitor?.Plugins?.Camera || anyWindow?.Camera;
      if (camera?.getPhoto) {
        const photo = await camera.getPhoto({ source, resultType: 'dataUrl', quality: 70 });
        const fileName = photo?.path || photo?.webPath || 'photo.jpg';
        const dataUrl: string | undefined = photo?.dataUrl || (photo?.base64String ? `data:image/jpeg;base64,${photo.base64String}` : (photo?.webPath || photo?.path));
        if (dataUrl) return { dataUrl, fileName };
        return null;
      }
      // Browser fallback: file input
      return await new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return resolve(null);
          const reader = new FileReader();
          reader.onload = () => this.zone.run(() => resolve({ dataUrl: String(reader.result), fileName: file.name }));
          reader.readAsDataURL(file);
        };
        input.click();
      });
    } catch (e) {
      await this.toast.error('Failed to get image');
      return null;
    } finally {
      this.ui.stopLoading();
    }
  }
}


