import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonInput, IonItem, IonLabel } from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBack, scan, camera, add } from 'ionicons/icons';
import { LocalDbService } from '../../services/local-db.service';
import { FlavourRecord } from '../../models/coffee.models';
import { UiStateService } from '../../services/ui-state/ui-state.service';
import { ErrorFactory } from '../../models/error.models';
import { ActionSheetController } from '@ionic/angular';
// Optional camera import (only available when Capacitor Camera is installed)
// Use dynamic reference to avoid type errors when not installed
type CameraSource = 'prompt' | 'camera' | 'photos' | undefined;

@Component({
  selector: 'app-manage-flavour',
  standalone: true,
  templateUrl: './manage-flavour.page.html',
  styleUrls: ['./manage-flavour.page.scss'],
  providers: [],
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonInput, IonItem, IonLabel
  ]
})
export class ManageFlavourPage {
  form = this.fb.group({
    barcode: ['', []],
    name: ['', [Validators.required]],
    pricePerBox: [0, [Validators.min(0)]],
    pricePerPod: [0, [Validators.min(0)]],
    podsPerBox: [0, [Validators.min(0)]],
    photoName: ['']
  });
  photoPreview: string | undefined;

  constructor(
    private fb: FormBuilder,
    private db: LocalDbService,
    private router: Router,
    private route: ActivatedRoute,
    private uiState: UiStateService,
    private actionSheet: ActionSheetController,
    private zone: NgZone
  ) {
    addIcons({ arrowBack, scan, camera, add });
  }

  goBack(): void {
    this.router.navigateByUrl('/flavours');
  }

  async onScan(): Promise<void> {
    this.uiState.startLoading('Scanning barcode');
    try {
      const anyWindow = window as any;
      const plugin = anyWindow?.cordova?.plugins?.barcodeScanner;
      if (plugin && typeof plugin.scan === 'function') {
        await new Promise<void>((resolve) => {
          plugin.scan((result: any) => {
            this.zone.run(() => {
              if (!result.cancelled && result.text) {
                this.form.patchValue({ barcode: result.text });
              }
              resolve();
            });
          }, (err: any) => {
            console.error('Barcode scan failed', err);
            this.uiState.addError(ErrorFactory.createApiError('unknown', 'Barcode scan failed'));
            resolve();
          });
        });
        return;
      }
      // No plugin available -> show concise error and fall back to manual entry
      this.uiState.addError(ErrorFactory.createApiError('unknown', 'Barcode scanner not available on web. Using manual input.'));
      const manual = prompt('Enter barcode (fallback):', '');
      if (manual !== null) {
        this.zone.run(() => this.form.patchValue({ barcode: manual }));
      }
    } finally {
      this.uiState.stopLoading();
    }
  }

  async onPickPhoto(): Promise<void> {
    const sheet = await this.actionSheet.create({
      header: 'Add Photo',
      buttons: [
        { text: 'Take Photo', icon: 'camera', handler: () => this.capturePhoto('camera') },
        { text: 'Choose from Gallery', icon: 'image', handler: () => this.capturePhoto('photos') },
        { text: 'Cancel', role: 'cancel' }
      ]
    });
    await sheet.present();
  }

  private async capturePhoto(source: CameraSource): Promise<void> {
    this.uiState.startLoading('Capturing photo');
    try {
      const anyWindow = window as any;
      const capacitorCamera = anyWindow?.Capacitor?.Plugins?.Camera || anyWindow?.Camera;
      if (capacitorCamera && typeof capacitorCamera.getPhoto === 'function') {
        const photo = await capacitorCamera.getPhoto({
          source,
          resultType: 'dataUrl',
          quality: 70
        });
        const fileName = photo?.path || photo?.webPath || 'photo.jpg';
        const dataUrl: string | undefined = photo?.dataUrl || (photo?.base64String ? `data:image/jpeg;base64,${photo.base64String}` : (photo?.webPath || photo?.path));
        this.zone.run(() => {
          if (dataUrl) {
            this.photoPreview = dataUrl;
          }
          this.form.patchValue({ photoName: fileName });
        });
      } else {
        // Fallback: open file dialog for web
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => {
          const file = input.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              this.zone.run(() => {
                this.photoPreview = String(reader.result);
                this.form.patchValue({ photoName: file.name });
              });
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      }
    } catch (err) {
      console.error('Photo capture failed', err);
      this.uiState.addError(ErrorFactory.createApiError('unknown', 'Photo capture failed'));
    } finally {
      this.uiState.stopLoading();
    }
  }

  onSave(): void {
    if (this.form.invalid) return;
    const value = this.form.value as Omit<FlavourRecord, 'id'>;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.db.updateFlavour(id, {
        barcode: value.barcode || '',
        name: value.name || '',
        pricePerBox: Number(value.pricePerBox) || 0,
        pricePerPod: Number(value.pricePerPod) || 0,
        podsPerBox: Number(value.podsPerBox) || 0,
        photoName: value.photoName || undefined,
        photoData: this.photoPreview
      });
    } else {
      this.db.addFlavour({
        barcode: value.barcode || '',
        name: value.name || '',
        pricePerBox: Number(value.pricePerBox) || 0,
        pricePerPod: Number(value.pricePerPod) || 0,
        podsPerBox: Number(value.podsPerBox) || 0,
        photoName: value.photoName || undefined,
        photoData: this.photoPreview
      });
    }
    this.router.navigateByUrl('/flavours');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const record = this.db.getFlavour(id);
      if (record) {
        this.form.patchValue({
          barcode: record.barcode,
          name: record.name,
          pricePerBox: record.pricePerBox,
          pricePerPod: record.pricePerPod,
          podsPerBox: record.podsPerBox,
          photoName: record.photoName || ''
        });
        this.photoPreview = record.photoData;
      }
    }
  }
}


