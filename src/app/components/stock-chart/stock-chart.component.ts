import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Subscription } from 'rxjs';
import { DotcomDataService } from '../../services/dotcom-data.service';
import { CandleData, StockService } from '../../services/stock.service';
import { LoaderComponent } from '../loader/loader.component';

@Component({
  selector: 'app-stock-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, LoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart-wrapper">
      <div class="update-info" *ngIf="!isDotcom && !isLoading && lastUpdateTime">
        <span>Last update: {{lastUpdateTime | date:'short'}}</span>
      </div>
      <app-loader *ngIf="isLoading"></app-loader>
      <apx-chart
        *ngIf="!isLoading && chartOptions.series"
        [series]="chartOptions.series"
        [chart]="chartOptions.chart"
        [xaxis]="chartOptions.xaxis"
        [yaxis]="chartOptions.yaxis"
        [title]="chartOptions.title"
        [plotOptions]="chartOptions.plotOptions"
        [colors]="chartOptions.colors"
        [tooltip]="chartOptions.tooltip"
        [stroke]="chartOptions.stroke"
        [fill]="chartOptions.fill"
        [grid]="chartOptions.grid"
      ></apx-chart>
    </div>
  `,
  styles: [`
    .chart-wrapper {
      width: 100%;
      height: 550px;
      position: relative;
      min-height: 500px;
    }
    .update-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      border-radius: 4px;
      margin-bottom: 12px;
      font-size: 0.85rem;
      color: #b0b0b0;
      flex-wrap: wrap;
      gap: 8px;
    }
    .update-info span {
      font-weight: 400;
      white-space: nowrap;
    }
    @media (max-width: 1024px) {
      .chart-wrapper {
        height: 450px;
        min-height: 450px;
      }
    }
    @media (max-width: 768px) {
      .chart-wrapper {
        height: 400px;
        min-height: 400px;
      }
      .update-info {
        font-size: 0.75rem;
        padding: 6px 10px;
      }
    }
    @media (max-width: 480px) {
      .chart-wrapper {
        height: 350px;
        min-height: 350px;
      }
      .update-info {
        flex-direction: column;
        gap: 4px;
        font-size: 0.7rem;
        padding: 6px 8px;
      }
    }
    @media (max-width: 360px) {
      .chart-wrapper {
        height: 300px;
        min-height: 300px;
      }
      .update-info {
        font-size: 0.65rem;
        padding: 4px 6px;
      }
    }
  `]
})
export class StockChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isDotcom: boolean = false;
  @Input() symbol: string = '';

  chartOptions: any = {};
  isLoading: boolean = true;
  lastUpdateTime: Date | null = null;

  private cachedData: CandleData[] = [];
  private subscription?: Subscription;

  constructor(
    private stockService: StockService,
    private dotcomService: DotcomDataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['symbol'] && !this.isDotcom && this.symbol) {
      this.isLoading = true;
      this.cdr.markForCheck();
      this.loadData();
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  updateData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.loadData();
  }

  private loadData(): void {
    if (this.isDotcom) {
      this.subscription = this.dotcomService.getDotcomBubbleData().subscribe({
        next: (data) => {
          this.updateChart(this.optimizeData(data));
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading dotcom data:', error);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      if (this.symbol) {
        this.subscription = this.stockService.getAIStocksData(this.symbol).subscribe({
          next: (data) => {
            this.cachedData = data;
            this.updateChart(this.optimizeData(data));
            this.lastUpdateTime = new Date();
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error(`Error loading data for ${this.symbol}:`, error);
            if (this.cachedData.length > 0) {
              this.updateChart(this.optimizeData(this.cachedData));
            }
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        });
      }
    }
  }

  private optimizeData(data: CandleData[]): CandleData[] {
    if (data.length <= 500) {
      return data;
    }

    const maxPoints = 500;
    const step = Math.ceil(data.length / maxPoints);
    const optimized: CandleData[] = [];

    for (let i = 0; i < data.length; i += step) {
      optimized.push(data[i]);
    }

    if (optimized[optimized.length - 1] !== data[data.length - 1]) {
      optimized.push(data[data.length - 1]);
    }

    return optimized;
  }

  private updateChart(data: CandleData[]): void {
    const chartHeight = this.getChartHeight();
    this.chartOptions = {
      series: [{
        name: 'Candlestick',
        data: data.map(d => ({
          x: d.x,
          y: d.y
        }))
      }],
      chart: {
        type: 'candlestick',
        height: chartHeight,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 600
        },
        zoom: {
          enabled: true
        }
      },
      title: {
        text: this.isDotcom ? 'Dotcom Bubble (1995-2003)' : `${this.symbol} (2020-Present)`,
        align: 'left',
        style: {
          color: '#e0e0e0',
          fontSize: this.getTitleFontSize(),
          fontWeight: '400'
        }
      },
      xaxis: {
        type: 'datetime',
        reversed: true,
        labels: {
          style: {
            colors: '#b0b0b0',
            fontSize: this.getLabelFontSize()
          }
        },
        axisBorder: {
          color: '#3a3a3a'
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#b0b0b0',
            fontSize: this.getLabelFontSize()
          },
          formatter: (val: number) => `$${val.toFixed(2)}`
        }
      },
      plotOptions: {
        candlestick: {
          colors: {
            upward: '#10b981',
            downward: '#ef4444'
          }
        }
      },
      colors: ['#10b981'],
      tooltip: {
        theme: 'dark',
        x: {
          formatter: (val: number) => {
            return new Date(val).toLocaleString();
          }
        },
        y: {
          formatter: (val: number) => {
            return `$${val.toFixed(2)}`;
          }
        }
      },
      stroke: {
        width: 1
      },
      fill: {
        opacity: 1
      },
      grid: {
        borderColor: '#3a3a3a',
        strokeDashArray: 4,
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        }
      }
    };
  }

  private getChartHeight(): number {
    if (typeof window === 'undefined') return 500;
    if (window.innerWidth <= 360) return 300;
    if (window.innerWidth <= 480) return 350;
    if (window.innerWidth <= 768) return 400;
    if (window.innerWidth <= 1024) return 450;
    return 500;
  }

  private getTitleFontSize(): string {
    if (typeof window === 'undefined') return '16px';
    if (window.innerWidth <= 360) return '12px';
    if (window.innerWidth <= 480) return '13px';
    if (window.innerWidth <= 768) return '14px';
    return '16px';
  }

  private getLabelFontSize(): string {
    if (typeof window === 'undefined') return '12px';
    if (window.innerWidth <= 360) return '9px';
    if (window.innerWidth <= 480) return '10px';
    if (window.innerWidth <= 768) return '11px';
    return '12px';
  }
}
