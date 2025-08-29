import { Injectable } from '@angular/core';
import { FlavourRecord } from '../models/coffee.models';

interface CoffeeStockDbSchema {
  Flavours: FlavourRecord[];
}

const DB_KEY = 'CoffeeStock';

@Injectable({ providedIn: 'root' })
export class LocalDbService {
  private ensureDb(): CoffeeStockDbSchema {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const empty: CoffeeStockDbSchema = { Flavours: [] };
      localStorage.setItem(DB_KEY, JSON.stringify(empty));
      return empty;
    }
    try {
      const parsed = JSON.parse(raw) as CoffeeStockDbSchema;
      if (!parsed || !Array.isArray(parsed.Flavours)) {
        const reset: CoffeeStockDbSchema = { Flavours: [] };
        localStorage.setItem(DB_KEY, JSON.stringify(reset));
        return reset;
      }
      return parsed;
    } catch {
      const reset: CoffeeStockDbSchema = { Flavours: [] };
      localStorage.setItem(DB_KEY, JSON.stringify(reset));
      return reset;
    }
  }

  private writeDb(db: CoffeeStockDbSchema): void {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  getFlavours(): FlavourRecord[] {
    return this.ensureDb().Flavours;
  }

  getFlavour(id: string): FlavourRecord | undefined {
    return this.getFlavours().find(f => f.id === id);
  }

  addFlavour(record: Omit<FlavourRecord, 'id'> & Partial<Pick<FlavourRecord, 'id'>>): FlavourRecord {
    const db = this.ensureDb();
    const id = record.id && record.id.length > 0 ? record.id : this.generateId();
    const newRecord: FlavourRecord = {
      id,
      barcode: record.barcode,
      name: record.name,
      pricePerBox: Number(record.pricePerBox) || 0,
      pricePerPod: Number(record.pricePerPod) || 0,
      podsPerBox: Number(record.podsPerBox) || 0,
      photoName: record.photoName,
      photoData: record.photoData
    };
    db.Flavours = [...db.Flavours, newRecord];
    this.writeDb(db);
    return newRecord;
  }

  updateFlavour(id: string, updates: Partial<FlavourRecord>): FlavourRecord | undefined {
    const db = this.ensureDb();
    const idx = db.Flavours.findIndex(f => f.id === id);
    if (idx === -1) return undefined;
    db.Flavours[idx] = { ...db.Flavours[idx], ...updates };
    this.writeDb(db);
    return db.Flavours[idx];
  }

  deleteFlavour(id: string): void {
    const db = this.ensureDb();
    db.Flavours = db.Flavours.filter(f => f.id !== id);
    this.writeDb(db);
  }

  clearAll(): void {
    this.writeDb({ Flavours: [] });
  }

  private generateId(): string {
    // Simple UUID v4-like generator
    const getRandomValues = (() => {
      try {
        return crypto.getRandomValues.bind(crypto);
      } catch {
        return null;
      }
    })();

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      let r: number;
      if (getRandomValues) {
        r = (getRandomValues(new Uint8Array(1))[0] & 0x0f) | 0x10;
      } else {
        r = (Math.random() * 16) | 0;
      }
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}


