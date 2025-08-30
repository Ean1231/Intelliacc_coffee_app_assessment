import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonButton, IonIcon, IonBadge, IonButtons
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { addIcons } from 'ionicons';
import { cafe, refresh, add, createOutline, trashOutline } from 'ionicons/icons';
import { AlertController } from '@ionic/angular';
import { LocalDbService } from '../../services/local-db.service';
import { ToastService } from '../../services/toast.service';
import { FlavourRecord } from '../../models/coffee.models';

/**
 * Flavours page component for displaying coffee flavour options
 */
@Component({
  selector: 'app-flavours',
  templateUrl: './flavours.page.html',
  styleUrls: ['./flavours.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon, IonButtons
  ]
})
export class FlavoursPage {
  dbFlavours: FlavourRecord[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private alertController: AlertController,
    private db: LocalDbService,
    private zone: NgZone,
    private toast: ToastService
  ) {
    addIcons({ cafe, refresh, add, createOutline, trashOutline });
  }

  ionViewWillEnter() {
    this.dbFlavours = this.db.getFlavours();
  }

  trackByFlavourId(_index: number, item: FlavourRecord): string {
    return item.id;
  }

  /**
   * Handle coffee selection (reserved for future use)
   */
  selectCoffee(_flavour: FlavourRecord): void {}



  /**
   * Logout user
   */
  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  async onSync(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Sync',
      message: 'Syncing all application data... (demo)',
      buttons: ['OK']
    });
    await alert.present();
  }

  async onAdd(): Promise<void> {
    this.router.navigate(['manage-flavours']);
  }

  editFlavour(flavour: FlavourRecord): void {
    this.router.navigate(['manage-flavours', flavour.id]);
  }

  async deleteFlavour(flavour: FlavourRecord): Promise<void> {
    if (!this.dbFlavours.find(f => f.id === flavour.id)) return;
    // TEMP: Remove confirmation to verify mobile tap handling works
    this.zone.run(() => {
      this.db.deleteFlavour(flavour.id);
      this.dbFlavours = this.db.getFlavours();
      this.toast.success('Flavour deleted');
    });
  }
}
