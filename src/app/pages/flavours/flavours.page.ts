import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonButton, IonIcon, IonBadge, IonGrid,
  IonRow, IonCol, IonChip, IonButtons, IonBackButton
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { CoffeeFlavour, CoffeeCategory, COFFEE_SIZES } from '../../models/coffee.models';
import { addIcons } from 'ionicons';
import { star, logOut, cafe } from 'ionicons/icons';

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
  coffeeFlavours: CoffeeFlavour[] = [
    {
      id: '1',
      name: 'Classic Espresso',
      description: 'Rich and bold espresso with a perfect crema',
      intensity: 5,
      price: 3.50,
      category: 'espresso',
      origin: 'Italian Blend',
      roastLevel: 'dark',
      available: true
    },
    {
      id: '2',
      name: 'Vanilla Latte',
      description: 'Smooth espresso with steamed milk and vanilla syrup',
      intensity: 3,
      price: 4.75,
      category: 'latte',
      origin: 'Colombian',
      roastLevel: 'medium',
      available: true
    },
    {
      id: '3',
      name: 'Caramel Cappuccino',
      description: 'Frothy cappuccino with sweet caramel flavor',
      intensity: 3,
      price: 4.25,
      category: 'cappuccino',
      origin: 'Brazilian',
      roastLevel: 'medium',
      available: true
    },
    {
      id: '4',
      name: 'Mocha Delight',
      description: 'Perfect blend of coffee and chocolate',
      intensity: 4,
      price: 5.00,
      category: 'mocha',
      origin: 'Ethiopian',
      roastLevel: 'dark',
      available: true
    },
    {
      id: '5',
      name: 'House Americano',
      description: 'Smooth and clean coffee taste',
      intensity: 4,
      price: 3.25,
      category: 'americano',
      origin: 'House Blend',
      roastLevel: 'medium',
      available: true
    },
    {
      id: '6',
      name: 'Signature Blend',
      description: 'Our exclusive specialty roast',
      intensity: 5,
      price: 6.50,
      category: 'specialty',
      origin: 'Single Origin Guatemala',
      roastLevel: 'light',
      available: false
    }
  ];

  selectedCategory: CoffeeCategory | 'all' = 'all';
  categories: (CoffeeCategory | 'all')[] = ['all', 'espresso', 'americano', 'latte', 'cappuccino', 'mocha', 'specialty'];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    addIcons({ star, logOut, cafe });
  }

  ngOnInit() {
    // Component initialization logic
  }

  /**
   * Get filtered coffee flavours based on selected category
   */
  get filteredFlavours(): CoffeeFlavour[] {
    if (this.selectedCategory === 'all') {
      return this.coffeeFlavours;
    }
    return this.coffeeFlavours.filter(flavour => flavour.category === this.selectedCategory);
  }

  /**
   * Get available coffee flavours only
   */
  get availableFlavours(): CoffeeFlavour[] {
    return this.filteredFlavours.filter(flavour => flavour.available);
  }

  /**
   * Select a category filter
   */
  selectCategory(category: CoffeeCategory | 'all'): void {
    this.selectedCategory = category;
  }

  /**
   * Get intensity stars array
   */
  getIntensityStars(intensity: number): boolean[] {
    return Array(5).fill(false).map((_, index) => index < intensity);
  }

  /**
   * Format category name for display
   */
  formatCategoryName(category: CoffeeCategory | 'all'): string {
    if (category === 'all') return 'All';
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  /**
   * Handle coffee selection
   */
  selectCoffee(flavour: CoffeeFlavour): void {
    if (!flavour.available) return;
    
    // In a real app, this would navigate to an order page or add to cart
    console.log('Selected coffee:', flavour);
    // You could implement: this.router.navigate(['/order', flavour.id]);
  }

  /**
   * Logout user
   */
  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
