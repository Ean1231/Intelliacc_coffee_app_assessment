import { Component } from '@angular/core';
import { LoadingOverlayComponent } from '../../components/loading-overlay/loading-overlay.component';
import { BarcodeService } from '../../services/barcode.service';
import { ImageService } from '../../services/image.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonInput } from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBack, scan, camera, add, image as imageIcon } from 'ionicons/icons';
import { LocalDbService } from '../../services/local-db.service';
import { FlavourRecord } from '../../models/coffee.models';
// Removed unused UI state imports to keep the component focused
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
    CommonModule, FormsModule, ReactiveFormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonInput, LoadingOverlayComponent
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
    private actionSheet: ActionSheetController,
    private barcode: BarcodeService,
    private image: ImageService
  ) {
    addIcons({ arrowBack, scan, camera, add, image: imageIcon });
  }

  goBack(): void {
    this.router.navigate(['flavours']);
  }

  async onScan(): Promise<void> {
    const code = await this.barcode.scan();
    if (code) this.form.patchValue({ barcode: code });
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
    const result = await this.image.pick((source as any) === 'camera' ? 'camera' : 'photos');
    if (result) {
      this.photoPreview = result.dataUrl;
      this.form.patchValue({ photoName: result.fileName });
    }
  }

  private buildPayload(value: Omit<FlavourRecord, 'id'>): Omit<FlavourRecord, 'id'> & { photoData?: string } {
    return {
      barcode: value.barcode || '',
      name: value.name || '',
      pricePerBox: Number(value.pricePerBox) || 0,
      pricePerPod: Number(value.pricePerPod) || 0,
      podsPerBox: Number(value.podsPerBox) || 0,
      photoName: value.photoName || undefined,
      photoData: this.photoPreview
    };
  }

  onSave(): void {
    if (this.form.invalid) return;
    const value = this.form.value as Omit<FlavourRecord, 'id'>;
    const id = this.route.snapshot.paramMap.get('id');
    const payload = this.buildPayload(value);

    if (id) {
      this.db.updateFlavour(id, payload);
    } else {
      this.db.addFlavour(payload);
    }
    this.router.navigate(['flavours']);
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


