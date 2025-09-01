import { Component } from '@angular/core';
import { LoadingOverlayComponent } from '../../components/loading-overlay/loading-overlay.component';
import { BarcodeService } from '../../services/barcode.service';
import { ImageService } from '../../services/image.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonInput } from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBack, scan, camera, add, image as imageIcon, checkmark } from 'ionicons/icons';
import { LocalDbService } from '../../services/local-db.service';
import { FlavourRecord } from '../../models/coffee.models';
import { ActionSheetController } from '@ionic/angular';
import { ActionSheet } from '@capacitor/action-sheet';
import { Capacitor } from '@capacitor/core';
import { Dialog } from '@capacitor/dialog';
import { AlertController } from '@ionic/angular'; 
import { NgZone } from '@angular/core';
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
  isEditMode = false;

  // Reactive form with conservative, non-intrusive validations
  form: FormGroup = this.fb.group({
    barcode: ['', [Validators.maxLength(64)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    pricePerBox: [0, [Validators.min(0), Validators.max(1000000)]],
    pricePerPod: [0, [Validators.min(0), Validators.max(1000000)]],
    podsPerBox: [0, [Validators.min(0), Validators.max(100000)]],
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
    private image: ImageService,
    private alertCtrl: AlertController,
    private zone: NgZone
  ) {
    addIcons({ arrowBack, scan, camera, add, image: imageIcon , checkmark });
  }

  goBack(): void {
    this.router.navigate(['flavours']);
  }

  /**
   * Scan a barcode and patch it into the form, then recalc price per pod
   */
async onScan(): Promise<void> {
  const code = await this.barcode.scan();
  if (code) {
    this.zone.run(() => {
      this.form.patchValue({ barcode: code });
      this.recalculatePricePerPod();
    });
  }
}




  /**
   * Let the user pick a photo (camera/photos) via native ActionSheet when available
   */
async onPickPhoto(): Promise<void> {
  const isNative = Capacitor.getPlatform() !== 'web';

  if (isNative && Capacitor.isPluginAvailable('ActionSheet')) {
    const res = await ActionSheet.showActions({
      title: 'Add photo',
      options: [
        { title: 'Take a photo' },                    
        { title: 'Choose from gallery' },            
        { title: 'Cancel' },         
      ],
    });

    if (res.index === 0) {
      await this.pickFrom('camera');
    } else if (res.index === 1) {
      await this.pickFrom('photos');
    }
    return;
  }

  const sheet = await this.actionSheet.create({
    header: 'Add photo',
    buttons: [
      { text: 'Take a photo', icon: 'camera', handler: () => this.pickFrom('camera') },
      { text: 'Choose from gallery', icon: 'image', handler: () => this.pickFrom('photos') },
      { text: 'Cancel', role: 'cancel' },
    ],
  });
  await sheet.present();
}

private async pickFrom(source: 'camera' | 'photos') {
  const res = await this.image.pick(source);
  if (res) {
    this.photoPreview = res.dataUrl;
    this.form.patchValue({ photoName: res.fileName });
  }
}


  /**
   * Construct payload for DB with normalization (trim strings, coerce numbers)
   */
  private buildPayload(value: Omit<FlavourRecord, 'id'>): Omit<FlavourRecord, 'id'> & { photoData?: string } {
    return {
      barcode: (value.barcode || '').trim(),
      name: (value.name || '').trim(),
      pricePerBox: Number(value.pricePerBox) || 0,
      pricePerPod: Number(value.pricePerPod) || 0,
      podsPerBox: Number(value.podsPerBox) || 0,
      photoName: value.photoName || undefined,
      photoData: this.photoPreview
    };
  }

  /**
   * Save flavour: update when editing, add when creating
   */
async onSave(): Promise<void> {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const value = this.form.value as Omit<FlavourRecord, 'id'>;
  const id = this.route.snapshot.paramMap.get('id');
  const payload = this.buildPayload(value);

  if (id) {
    this.db.updateFlavour(id, payload);
    await this.showSuccessDialog('Edit Flavour', `Flavour ${value.name} has been edited successfully.`);
  } else {
    this.db.addFlavour(payload);
    this.router.navigate(['flavours']);
  }
}

private async showSuccessDialog(header: string, message: string): Promise<void> {
  if (Capacitor.getPlatform() === 'web') {
    // ✅ Use Ionic Alert on Web
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.router.navigate(['flavours']); // navigate only after OK
          }
        }
      ]
    });
    await alert.present();
  } else {
    // ✅ Use Capacitor Native Dialog on Mobile
    await Dialog.alert({
      title: header,
      message: message,
    });
    this.router.navigate(['flavours']); // navigate after dismiss
  }
}



  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true; // Enable edit mode if ID is present
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
    // Auto-calc price per pod whenever pricePerBox or podsPerBox changes
    this.form.get('pricePerBox')?.valueChanges.subscribe(() => this.recalculatePricePerPod());
    this.form.get('podsPerBox')?.valueChanges.subscribe(() => this.recalculatePricePerPod());
    // Initial calculation
    this.recalculatePricePerPod();
  }

  /**
   * Calculate price per pod based on box price and pods per box
   */
  private recalculatePricePerPod(): void {
    const pricePerBoxRaw = this.form.get('pricePerBox')?.value;
    const podsPerBoxRaw = this.form.get('podsPerBox')?.value;
    const pricePerBox = Number(pricePerBoxRaw) || 0;
    const podsPerBox = Number(podsPerBoxRaw) || 0;
    const pricePerPod = podsPerBox > 0 ? Number((pricePerBox / podsPerBox).toFixed(2)) : 0;
    this.form.patchValue({ pricePerPod }, { emitEvent: false });
  }

formatDecimal(controlName: string): void {
  const control = this.form.get(controlName);
  const value = control?.value;

  if (value !== null && value !== undefined && value !== '') {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      control?.setValue(num.toFixed(2), { emitEvent: false });
    }
  }
}


}


