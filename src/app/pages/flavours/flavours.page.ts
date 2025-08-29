import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonButton, IonIcon, IonBadge, IonGrid,
  IonRow, IonCol, IonChip, IonButtons, IonBackButton
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { addIcons } from 'ionicons';
import { star, logOut, cafe, refresh, add, createOutline, trashOutline } from 'ionicons/icons';
import { AlertController } from '@ionic/angular';
import { LocalDbService } from '../../services/local-db.service';
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
    CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, 
    IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, 
    IonBadge, IonGrid, IonRow, IonCol, IonChip, IonButtons
  ]
})
export class FlavoursPage implements OnInit {
  dbFlavours: FlavourRecord[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private alertController: AlertController,
    private db: LocalDbService
  ) {
    addIcons({ star, logOut, cafe, refresh, add, createOutline, trashOutline });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.dbFlavours = this.db.getFlavours();
  }

  /**
   * Handle coffee selection
   */
  selectCoffee(_flavour: FlavourRecord): void {
    // Reserved for future flow (e.g., details page)
  }

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
    this.router.navigateByUrl('/manage-flavours/manage-flavours');
  }

  editFlavour(flavour: FlavourRecord): void {
    // For now navigate to create/edit screen; edit flow could prefill by id if from DB
    this.router.navigateByUrl('/manage-flavours/manage-flavours');
  }

  deleteFlavour(flavour: FlavourRecord): void {
    if (this.dbFlavours.find(f => f.id === flavour.id)) {
      this.db.deleteFlavour(flavour.id);
      this.dbFlavours = this.db.getFlavours();
    }
  }
}
