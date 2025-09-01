import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [IonContent]
})
export class SplashPage implements OnInit, OnDestroy {
  private timeoutId: any;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.timeoutId = setTimeout(() => {
      this.router.navigateByUrl('/login', { replaceUrl: true });
    }, 2000);
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}


