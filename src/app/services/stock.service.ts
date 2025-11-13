import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { AI_COMPANIES } from '../config/api.config';

export interface CandleData {
  x: number;
  y: [number, number, number, number];
}

export interface CompanyInfo {
  symbol: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private cache: Map<string, { data: CandleData[], timestamp: number }> = new Map();
  private companiesCache: { companies: CompanyInfo[], timestamp: number } | null = null;
  private readonly CACHE_DURATION = 60000;
  private readonly COMPANIES_CACHE_DURATION = 3600000;
  private readonly AI_BUBBLE_START = new Date('2020-01-01').getTime();
  private currentProxyIndex = 0;

  private readonly AI_COMPANIES_DATA: { [key: string]: string } = {
    'NVDA': 'NVIDIA Corporation',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc.',
    'META': 'Meta Platforms Inc.',
    'AMD': 'Advanced Micro Devices',
    'TSLA': 'Tesla Inc.',
    'AAPL': 'Apple Inc.',
    'INTC': 'Intel Corporation',
    'AMZN': 'Amazon.com Inc.',
    'CRM': 'Salesforce Inc.',
    'PLTR': 'Palantir Technologies',
    'SNOW': 'Snowflake Inc.',
    'NET': 'Cloudflare Inc.',
    'CRWD': 'CrowdStrike Holdings',
    'ZS': 'Zscaler Inc.',
    'PANW': 'Palo Alto Networks',
    'NOW': 'ServiceNow Inc.',
    'DOCN': 'DigitalOcean Holdings',
    'AI': 'C3.ai Inc.',
    'PATH': 'UiPath Inc.',
    'ASML': 'ASML Holding',
    'AVGO': 'Broadcom Inc.',
    'QCOM': 'Qualcomm Inc.',
    'MU': 'Micron Technology',
    'LRCX': 'Lam Research',
    'KLAC': 'KLA Corporation',
    'ANET': 'Arista Networks',
    'MDB': 'MongoDB Inc.',
    'DDOG': 'Datadog Inc.',
    'ESTC': 'Elastic N.V.'
  };

  constructor(private http: HttpClient) {}

  private getCurrentDate(): number {
    return Date.now();
  }

  getAICompanies(): Observable<CompanyInfo[]> {
    if (this.companiesCache && Date.now() - this.companiesCache.timestamp < this.COMPANIES_CACHE_DURATION) {
      return of(this.companiesCache.companies);
    }

    return this.fetchCompaniesFromAPI().pipe(
      catchError(() => {
        const companies: CompanyInfo[] = AI_COMPANIES.map(symbol => ({
          symbol,
          name: this.AI_COMPANIES_DATA[symbol] || symbol
        }));
        this.companiesCache = { companies, timestamp: Date.now() };
        return of(companies);
      }),
      map(companies => {
        this.companiesCache = { companies, timestamp: Date.now() };
        return companies;
      }),
      shareReplay(1)
    );
  }

  private fetchCompaniesFromAPI(): Observable<CompanyInfo[]> {
    const companies: CompanyInfo[] = AI_COMPANIES.map(symbol => ({
      symbol,
      name: this.AI_COMPANIES_DATA[symbol] || symbol
    }));

    return of(companies);
  }

  getAIStocksData(symbol: string = AI_COMPANIES[0]): Observable<CandleData[]> {
    const cacheKey = `ai_stocks_${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return of(cached.data);
    }

    return this.fetchFromYahooFinance(symbol).pipe(
      map(data => {
        try {
          const processedData = this.processRealData(symbol, data);
          this.cache.set(cacheKey, { data: processedData, timestamp: Date.now() });
          return processedData;
        } catch (error) {
          throw error;
        }
      }),
      catchError((error) => {
        return throwError(() => error);
      }),
      shareReplay(1)
    );
  }

  private fetchFromYahooFinance(symbol: string, proxyIndex: number = 0): Observable<CandleData[]> {
    const period1 = Math.floor(this.AI_BUBBLE_START / 1000);
    const period2 = Math.floor(this.getCurrentDate() / 1000);
    const directUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;
    
    const proxies = [
      `https://corsproxy.io/?${encodeURIComponent(directUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(directUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`,
    ];

    const proxyUrl = proxies[proxyIndex] || proxies[0];

    return this.http.get<any>(proxyUrl).pipe(
      map(response => {
        let data: any = response;
        
        if (response.contents && typeof response.contents === 'string') {
          try {
            data = JSON.parse(response.contents);
          } catch (e) {
            data = response;
          }
        }

        if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
          throw new Error('Invalid response');
        }
        const result = data.chart.result[0];
        if (!result.timestamp || result.timestamp.length === 0) {
          throw new Error('No data');
        }
        const parsedData = this.parseYahooData(result);
        if (parsedData.length > 0) {
          parsedData.sort((a, b) => a.x - b.x);
          const lastPrice = parsedData[parsedData.length - 1].y[3];
          const lastDate = new Date(parsedData[parsedData.length - 1].x).toISOString();
          console.log(`[${symbol}] YahooFinance (proxy ${proxyIndex}) - Last price: $${lastPrice.toFixed(2)} on ${lastDate}`);
        }
        return parsedData;
      }),
      catchError((error) => {
        console.error(`[${symbol}] Proxy error (index ${proxyIndex}):`, error);
        if (proxyIndex < proxies.length - 1) {
          console.log(`[${symbol}] Trying next proxy...`);
          return this.fetchFromYahooFinance(symbol, proxyIndex + 1);
        }
        return throwError(() => error);
      })
    );
  }

  private processRealData(symbol: string, realData: CandleData[]): CandleData[] {
    const currentDate = this.getCurrentDate();
    
    if (realData.length === 0) {
      throw new Error('No data available');
    }

    realData.sort((a, b) => a.x - b.x);
    
    const filteredData = realData.filter(d => {
      return d.x >= this.AI_BUBBLE_START && d.x <= currentDate;
    });
    
    if (filteredData.length === 0) {
      throw new Error('No data in date range');
    }
    
    if (filteredData.length < 100) {
      return this.fillMissingData(symbol, filteredData);
    }

    const lastPrice = filteredData[filteredData.length - 1].y[3];
    const lastDate = new Date(filteredData[filteredData.length - 1].x).toISOString();
    console.log(`[${symbol}] Using real data - Last price: $${lastPrice.toFixed(2)} on ${lastDate}`);
    
    return filteredData;
  }

  private fillMissingData(symbol: string, realData: CandleData[]): CandleData[] {
    const currentDate = this.getCurrentDate();
    const dataMap = new Map<number, CandleData>();
    realData.forEach(d => {
      const dayKey = Math.floor(d.x / (1000 * 60 * 60 * 24));
      dataMap.set(dayKey, d);
    });

    const filledData: CandleData[] = [];
    const daysSinceStart = Math.floor((currentDate - this.AI_BUBBLE_START) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < daysSinceStart; i++) {
      const time = this.AI_BUBBLE_START + (i * 24 * 60 * 60 * 1000);
      const dayKey = Math.floor(time / (1000 * 60 * 60 * 24));
      
      if (dataMap.has(dayKey)) {
        filledData.push(dataMap.get(dayKey)!);
      } else {
        const nearestData = this.findNearestData(realData, time);
        if (nearestData) {
          filledData.push({
            x: time,
            y: nearestData.y
          });
        }
      }
    }

    if (filledData.length > 0) {
      const lastPrice = filledData[filledData.length - 1].y[3];
      const lastDate = new Date(filledData[filledData.length - 1].x).toISOString();
      console.log(`[${symbol}] Filled data - Last price: $${lastPrice.toFixed(2)} on ${lastDate}`);
    }
    
    if (filledData.length === 0) {
      throw new Error('Insufficient data after filling');
    }
    return filledData;
  }

  private findNearestData(data: CandleData[], time: number): CandleData | null {
    if (data.length === 0) return null;
    
    let nearest = data[0];
    let minDiff = Math.abs(data[0].x - time);
    
    for (const d of data) {
      const diff = Math.abs(d.x - time);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = d;
      }
    }
    
    return minDiff < 7 * 24 * 60 * 60 * 1000 ? nearest : null;
  }

private parseYahooData(result: any): CandleData[] {
    const currentDate = this.getCurrentDate();
    const data: CandleData[] = [];
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const opens = quotes.open || [];
    const highs = quotes.high || [];
    const lows = quotes.low || [];
    const closes = quotes.close || [];

    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i] * 1000;
      if (timestamp >= this.AI_BUBBLE_START && timestamp <= currentDate) {
        const open = opens[i] || 0;
        const high = highs[i] || 0;
        const low = lows[i] || 0;
        const close = closes[i] || 0;
        
        if (open > 0 && high > 0 && low > 0 && close > 0) {
          data.push({
            x: timestamp,
            y: [open, high, low, close]
          });
        }
      }
    }
    
    data.sort((a, b) => a.x - b.x);
    return data;
  }
}
