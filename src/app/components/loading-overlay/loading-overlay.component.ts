import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSpinner } from '@ionic/angular/standalone';
import { UiStateService } from '../../services/ui-state/ui-state.service';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule, IonSpinner],
  template: `
    <div class="overlay" *ngIf="ui.loadingState().isLoading">
      <ion-spinner name="crescent"></ion-spinner>
      <div class="label" *ngIf="ui.loadingState().operation">{{ ui.loadingState().operation }}</div>
    </div>
  `,
  styles: [`
    .overlay { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.25); z-index: 2000; }
    .label { margin-top: 8px; color: #fff; font-size: 14px; }
  `]
})
export class LoadingOverlayComponent {
  constructor(public ui: UiStateService) {}
}


