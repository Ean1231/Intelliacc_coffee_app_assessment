import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ManageFlavourPage } from './manage-flavour.page';
import { LocalDbService } from '../../services/local-db.service';
import { BarcodeService } from '../../services/barcode.service';
import { ImageService } from '../../services/image.service';
import { AlertController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

// Minimal stubs
class LocalDbStub {
  addFlavour(): void {}
  updateFlavour(): void {}
  getFlavour(): any { return null; }
}

class BarcodeStub { scan = jasmine.createSpy('scan'); }
class ImageStub { pick = jasmine.createSpy('pick'); }

describe('ManageFlavourPage - logic', () => {
  let component: ManageFlavourPage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: LocalDbService, useClass: LocalDbStub },
        { provide: BarcodeService, useClass: BarcodeStub },
        { provide: ImageService, useClass: ImageStub },
        AlertController,
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map() } } },
      ]
    });

    component = TestBed.createComponent(ManageFlavourPage).componentInstance;
  });

  it('recalculatePricePerPod should compute derived price with 2 decimals', () => {
    component.form.patchValue({ pricePerBox: 30, podsPerBox: 10 });
    (component as any).recalculatePricePerPod();
    expect(component.form.get('pricePerPod')?.value).toBe(3);

    component.form.patchValue({ pricePerBox: 7, podsPerBox: 3 });
    (component as any).recalculatePricePerPod();
    expect(component.form.get('pricePerPod')?.value).toBe(2.33);
  });

  it('buildPayload should trim strings and coerce numbers', () => {
    const raw = {
      barcode: '  12345  ',
      name: '  My Flavour  ',
      pricePerBox: '15' as unknown as number,
      pricePerPod: '0' as unknown as number,
      podsPerBox: '10' as unknown as number,
      photoName: ''
    };

    // Access private via any for unit-testing tiny logic
    const payload = (component as any).buildPayload(raw);

    expect(payload.barcode).toBe('12345');
    expect(payload.name).toBe('My Flavour');
    expect(payload.pricePerBox).toBe(15);
    expect(payload.pricePerPod).toBe(0);
    expect(payload.podsPerBox).toBe(10);
    // photoData is sourced from component.photoPreview, which is undefined by default
    expect(payload.photoData).toBeUndefined();
  });
});


