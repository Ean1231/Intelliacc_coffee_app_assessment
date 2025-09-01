import { Injectable, NgZone } from '@angular/core';
import { UiStateService } from './ui-state/ui-state.service';
import { ToastService } from './toast.service';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource as CapCameraSource } from '@capacitor/camera';

export type ImageSource = 'camera' | 'photos';

@Injectable({ providedIn: 'root' })
export class ImageService {
  constructor(private ui: UiStateService, private toast: ToastService, private zone: NgZone) {}

  async pick(source: ImageSource): Promise<{ dataUrl: string; fileName: string } | null> {
    this.zone.run(() => this.ui.startLoading(source === 'camera' ? 'Taking photo' : 'Choosing photo'));

    try {
      const platform = Capacitor.getPlatform();
      const isWeb = platform === 'web';

      // If we’re on native, make sure the Camera plugin is actually there
      if (!isWeb && !Capacitor.isPluginAvailable('Camera')) {
        await this.toast.error('Camera plugin not installed in native build. Run "npx cap sync" and rebuild.');
        return null;
      }

      if (!isWeb) {
        // Native: request permissions explicitly
        const perm = await Camera.checkPermissions();
        const needCamera = source === 'camera' && perm.camera !== 'granted';
        const needPhotos = source === 'photos' && perm.photos !== 'granted';

        if (needCamera || needPhotos) {
          const req = await Camera.requestPermissions({ permissions: ['camera', 'photos'] as any });
          if (source === 'camera' && req.camera !== 'granted') {
            await this.toast.error('Camera permission denied');
            return null;
          }
          if (source === 'photos' && req.photos !== 'granted') {
            await this.toast.error('Photos permission denied');
            return null;
          }
        }

        // Open camera or gallery
        const photo = await Camera.getPhoto({
          source: source === 'camera' ? CapCameraSource.Camera : CapCameraSource.Photos,
          resultType: CameraResultType.DataUrl,
          quality: 70,
        });


        const dataUrl =
          photo?.dataUrl ??
          (photo?.base64String ? `data:image/jpeg;base64,${photo.base64String}` : photo?.webPath || photo?.path);

        const fileNameCandidate = photo?.path || photo?.webPath || 'photo.jpg';
        if (!dataUrl || typeof dataUrl !== 'string') {
          await this.toast.error('No image data returned');
          return null;
        }
        return { dataUrl, fileName: String(fileNameCandidate) };
      }

      // --- Web path (unchanged) ---
      const webCamera = (window as any)?.Capacitor?.Plugins?.Camera;
      if (webCamera?.getPhoto) {
        try {
          const photo = await webCamera.getPhoto({
            source: source === 'camera' ? CapCameraSource.Camera : CapCameraSource.Photos,
            resultType: CameraResultType.DataUrl,
            quality: 70,
          });
          const dataUrl =
            photo?.dataUrl ??
            (photo?.base64String ? `data:image/jpeg;base64,${photo.base64String}` : photo?.webPath || photo?.path);
          if (!dataUrl || typeof dataUrl !== 'string') {
            return null;
          }
          return { dataUrl, fileName: String(photo?.path || photo?.webPath || 'photo.jpg') };
        } catch { /* fall through to input */ }
      }

      // Pure browser fallback (also works on mobile browsers)
      return await new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        if (source === 'camera') input.setAttribute('capture', 'environment');

        const cleanup = () => { input.remove(); window.removeEventListener('focus', onFocus); };
        const onFocus = () => setTimeout(() => {
          if (!input.files || input.files.length === 0) { cleanup(); this.zone.run(() => resolve(null)); }
        }, 0);

        input.addEventListener('change', () => {
          const file = input.files?.[0];
          if (!file) { cleanup(); this.zone.run(() => resolve(null)); return; }
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            if (!result || typeof result !== 'string') {
              cleanup();
              this.zone.run(() => resolve(null));
              return;
            }
            cleanup();
            this.zone.run(() => resolve({ dataUrl: result, fileName: file.name }));
          };
          reader.readAsDataURL(file);
        }, { once: true });

        window.addEventListener('focus', onFocus, { once: true });
        document.body.appendChild(input);
        input.click();
      });
    } catch (e: any) {
      console.log('[ImageService] Camera error:', e); // <- watch Logcat/Xcode
      if (String(e?.message || e).includes('plugin_not_installed') || String(e?.code).includes('UNIMPLEMENTED')) {
        await this.toast.error('Camera plugin not available. Run "npx cap sync" and rebuild.');
      } else {
        await this.toast.error('Failed to get image');
      }
      return null;
    } finally {
      this.zone.run(() => this.ui.stopLoading());
    }
  }
}
