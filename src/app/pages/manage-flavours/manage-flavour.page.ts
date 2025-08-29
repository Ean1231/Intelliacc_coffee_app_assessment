import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonInput, IonItem, IonLabel } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBack, scan, camera, add } from 'ionicons/icons';
import { LocalDbService } from '../../services/local-db.service';
import { FlavourRecord } from '../../models/coffee.models';

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

  constructor(
    private fb: FormBuilder,
    private db: LocalDbService,
    private router: Router
  ) {
    addIcons({ arrowBack, scan, camera, add });
  }

  async onScan(): Promise<void> {
    const anyWindow = window as any;
    const plugin = anyWindow?.cordova?.plugins?.barcodeScanner;
    if (plugin && typeof plugin.scan === 'function') {
      await new Promise<void>((resolve) => {
        plugin.scan((result: any) => {
          if (!result.cancelled && result.text) {
            this.form.patchValue({ barcode: result.text });
          }
          resolve();
        }, (err: any) => {
          console.error('Barcode scan failed', err);
          resolve();
        });
      });
      return;
    }
    // Fallback for web/testing
    const manual = prompt('Enter barcode (fallback):', '');
    if (manual !== null) {
      this.form.patchValue({ barcode: manual });
    }
  }

  onPickPhoto(): void {
    // Demo: open camera / file picker
    this.form.patchValue({ photoName: 'capsule.png' });
  }

  onSave(): void {
    if (this.form.invalid) return;
    const value = this.form.value as Omit<FlavourRecord, 'id'>;
    this.db.addFlavour({
      barcode: value.barcode || '',
      name: value.name || '',
      pricePerBox: Number(value.pricePerBox) || 0,
      pricePerPod: Number(value.pricePerPod) || 0,
      podsPerBox: Number(value.podsPerBox) || 0,
      photoName: value.photoName || undefined
    });
    this.router.navigateByUrl('/flavours');
  }
}


