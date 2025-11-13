import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CandleData } from './stock.service';

@Injectable({
  providedIn: 'root'
})
export class DotcomDataService {
  getDotcomBubbleData(): Observable<CandleData[]> {
    return of(this.generateDotcomData());
  }

  private generateDotcomData(): CandleData[] {
    const data: CandleData[] = [];
    const startDate = new Date('1995-01-01').getTime();
    const peakDate = new Date('2000-03-10').getTime();
    const crashDate = new Date('2002-10-09').getTime();
    const endDate = new Date('2003-12-31').getTime();
    
    const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    const samples = 200;
    const step = Math.floor(totalDays / samples);
    
    let basePrice = 50;
    const peakPrice = 500;
    const crashPrice = 100;
    
    for (let i = 0; i < samples; i++) {
      const daysFromStart = i * step;
      const currentDate = startDate + (daysFromStart * 24 * 60 * 60 * 1000);
      
      let targetPrice = basePrice;
      
      if (currentDate < peakDate) {
        const progress = (currentDate - startDate) / (peakDate - startDate);
        targetPrice = basePrice + (peakPrice - basePrice) * progress;
        targetPrice += Math.sin(progress * Math.PI * 4) * 20;
      } else if (currentDate < crashDate) {
        const progress = (currentDate - peakDate) / (crashDate - peakDate);
        targetPrice = peakPrice - (peakPrice - crashPrice) * progress;
        targetPrice -= Math.sin(progress * Math.PI) * 50;
      } else {
        const progress = (currentDate - crashDate) / (endDate - crashDate);
        targetPrice = crashPrice + (basePrice - crashPrice) * progress * 0.3;
        targetPrice += Math.sin(progress * Math.PI * 2) * 10;
      }
      
      const volatility = 5 + Math.random() * 15;
      const open = targetPrice + (Math.random() - 0.5) * volatility;
      const high = Math.max(open, targetPrice) + Math.random() * volatility;
      const low = Math.min(open, targetPrice) - Math.random() * volatility;
      const close = targetPrice + (Math.random() - 0.5) * volatility * 0.5;
      
      data.push({
        x: currentDate,
        y: [open, high, low, close]
      });
    }
    
    return data;
  }
}
