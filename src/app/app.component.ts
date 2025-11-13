import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TrackByFunction } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoaderComponent } from './components/loader/loader.component';
import { StockChartComponent } from './components/stock-chart/stock-chart.component';
import { CompanyInfo, StockService } from './services/stock.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, StockChartComponent, LoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-container">
      <header class="header">
        <h1>AI Bubble</h1>
        <div class="selector-wrapper">
          <select 
            id="company-select" 
            [(ngModel)]="selectedCompany" 
            (change)="onCompanyChange()" 
            class="company-select"
            [attr.aria-label]="'Select AI Company'"
            [disabled]="isLoadingCompanies"
          >
            <option *ngIf="isLoadingCompanies" value="">Loading...</option>
            <option *ngFor="let company of aiCompanies; trackBy: trackByCompany" [value]="company.symbol">
              {{company.symbol}} - {{company.name}}
            </option>
          </select>
        </div>
      </header>
      <main class="main-content">
        <div class="chart-section">
          <app-stock-chart 
            [isDotcom]="false" 
            [symbol]="selectedCompany"
            [autoUpdate]="autoUpdate"
          ></app-stock-chart>
        </div>
        <div class="chart-section">
          <app-stock-chart [isDotcom]="true"></app-stock-chart>
        </div>
      </main>
      <div class="controls">
        <button 
          class="toggle-button"
          (click)="toggleAutoUpdate()"
          [class.active]="autoUpdate"
        >
          {{autoUpdate ? '⏸ Pause' : '▶ Resume'}} Auto-Update
        </button>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      padding: 16px;
      background: #1a1a1a;
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      padding-bottom: 80px;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
      width: 100%;
    }
    .header h1 {
      font-size: 1.75rem;
      font-weight: 300;
      color: #ffffff;
      margin-bottom: 24px;
      letter-spacing: 2px;
      word-wrap: break-word;
    }
    .selector-wrapper {
      display: flex;
      justify-content: center;
      width: 100%;
    }
    .company-select {
      background: #2a2a2a;
      color: #ffffff;
      border: 1px solid #3a3a3a;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 0.9rem;
      cursor: pointer;
      outline: none;
      transition: border-color 0.2s;
      min-width: 200px;
      max-width: 100%;
      width: auto;
    }
    .company-select:hover:not(:disabled) {
      border-color: #4a4a4a;
    }
    .company-select:focus {
      border-color: #5a5a5a;
    }
    .company-select:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .main-content {
      display: flex;
      flex-direction: row;
      gap: 16px;
      max-width: 1800px;
      margin: 0 auto;
      width: 100%;
    }
    .chart-section {
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      border-radius: 4px;
      padding: 16px;
      flex: 1;
      min-width: 0;
      width: 100%;
      overflow: hidden;
    }
    .controls {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
    }
    .toggle-button {
      background: #2a2a2a;
      color: #ffffff;
      border: 1px solid #3a3a3a;
      border-radius: 4px;
      padding: 10px 20px;
      font-size: 0.9rem;
      cursor: pointer;
      outline: none;
      transition: all 0.2s;
    }
    .toggle-button:hover {
      background: #3a3a3a;
      border-color: #4a4a4a;
    }
    .toggle-button.active {
      background: #3a3a3a;
      border-color: #5a5a5a;
    }
    @media (max-width: 1024px) {
      .main-content {
        gap: 12px;
      }
      .chart-section {
        padding: 14px;
      }
    }
    @media (max-width: 768px) {
      .main-content {
        flex-direction: column;
        gap: 12px;
      }
      .header h1 {
        font-size: 1.5rem;
        margin-bottom: 20px;
      }
      .app-container {
        padding: 12px;
        padding-bottom: 80px;
      }
      .chart-section {
        padding: 12px;
      }
      .company-select {
        min-width: 180px;
        font-size: 0.85rem;
      }
      .toggle-button {
        font-size: 0.85rem;
        padding: 8px 16px;
      }
    }
    @media (max-width: 480px) {
      .app-container {
        padding: 8px;
        padding-bottom: 70px;
      }
      .header {
        margin-bottom: 24px;
      }
      .header h1 {
        font-size: 1.25rem;
        margin-bottom: 16px;
        letter-spacing: 1px;
      }
      .company-select {
        font-size: 0.85rem;
        padding: 6px 12px;
        min-width: 160px;
      }
      .chart-section {
        padding: 8px;
      }
      .main-content {
        gap: 8px;
      }
      .controls {
        bottom: 10px;
      }
      .toggle-button {
        font-size: 0.8rem;
        padding: 6px 12px;
      }
    }
    @media (max-width: 360px) {
      .app-container {
        padding: 6px;
        padding-bottom: 70px;
      }
      .header h1 {
        font-size: 1.1rem;
        margin-bottom: 12px;
      }
      .company-select {
        font-size: 0.8rem;
        padding: 5px 10px;
        min-width: 140px;
      }
      .chart-section {
        padding: 6px;
      }
      .main-content {
        gap: 6px;
      }
      .toggle-button {
        font-size: 0.75rem;
        padding: 5px 10px;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  aiCompanies: CompanyInfo[] = [];
  selectedCompany: string = '';
  isLoadingCompanies: boolean = true;
  autoUpdate: boolean = true;

  constructor(
    private stockService: StockService,
    private cdr: ChangeDetectorRef
  ) {}

  trackByCompany: TrackByFunction<CompanyInfo> = (index: number, company: CompanyInfo) => company.symbol;

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.isLoadingCompanies = true;
    this.cdr.markForCheck();
    
    this.stockService.getAICompanies().subscribe(companies => {
      this.aiCompanies = companies;
      if (companies.length > 0 && !this.selectedCompany) {
        this.selectedCompany = companies[0].symbol;
      }
      this.isLoadingCompanies = false;
      this.cdr.markForCheck();
    });
  }

  onCompanyChange(): void {
    this.cdr.markForCheck();
  }

  toggleAutoUpdate(): void {
    this.autoUpdate = !this.autoUpdate;
    this.cdr.markForCheck();
  }
}
