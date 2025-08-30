import { Injectable, NgZone } from '@angular/core';
import { UiStateService } from './ui-state/ui-state.service';
import { ToastService } from './toast.service';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource as CapCameraSource } from '@capacitor/camera';

export type ImageSource = 'camera' | 'photos' | 'prompt';

@Injectable({ providedIn: 'root' })
export class ImageService {
  constructor(private ui: UiStateService, private toast: ToastService, private zone: NgZone) {}

  async pick(source: ImageSource): Promise<{ dataUrl: string; fileName: string } | null> {
    this.ui.startLoading(source === 'camera' ? 'Taking photo' : 'Choosing photo');
    try {
      // Prefer official Capacitor Camera on native platforms
      const requestedSource = source === 'camera' ? CapCameraSource.Camera : source === 'photos' ? CapCameraSource.Photos : CapCameraSource.Prompt;
      if (Capacitor.isNativePlatform()) {
        // Ensure permissions on native
        const perm = await Camera.checkPermissions();
        if (perm.camera !== 'granted' || perm.photos !== 'granted') {
          const req = await Camera.requestPermissions({ permissions: ['camera', 'photos'] as any });
          if (req.camera !== 'granted' && requestedSource === CapCameraSource.Camera) {
            await this.toast.error('Camera permission denied');
            return null;
          }
          if (req.photos !== 'granted' && requestedSource === CapCameraSource.Photos) {
            await this.toast.error('Photos permission denied');
            return null;
          }
        }
        const photo = await Camera.getPhoto({ source: requestedSource, resultType: CameraResultType.DataUrl, quality: 70 });
        const fileName = photo?.path || photo?.webPath || 'photo.jpg';
        const dataUrl: string | undefined = photo?.dataUrl || (photo?.base64String ? `data:image/jpeg;base64,${photo.base64String}` : (photo?.webPath || photo?.path));
        if (dataUrl) return { dataUrl, fileName };
        return null;
      }

      // Browser: try web implementation if available
      const anyWindow = window as any;
      const webCamera = anyWindow?.Capacitor?.Plugins?.Camera || anyWindow?.Camera;
      if (webCamera?.getPhoto) {
        const photo = await webCamera.getPhoto({ source: requestedSource, resultType: 'dataUrl', quality: 70 });
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


