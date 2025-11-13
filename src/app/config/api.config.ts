export const API_CONFIG = {
  yahooFinance: {
    baseUrl: 'https://query1.finance.yahoo.com/v8/finance/chart',
    getUrl: (symbol: string, period1: number, period2: number) => {
      return `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;
    }
  },
  polygon: {
    baseUrl: 'https://api.polygon.io/v2/aggs/ticker'
  }
};

export const AI_COMPANIES = [
  'NVDA', 'MSFT', 'GOOGL', 'META', 'AMD', 'TSLA', 'AAPL', 'INTC', 'AMZN', 'CRM',
  'PLTR', 'SNOW', 'NET', 'CRWD', 'ZS', 'PANW', 'NOW', 'DOCN', 'AI', 'PATH'
];

export const DOTCOM_COMPANIES = [
  'CSCO', 'ORCL', 'INTC', 'MSFT', 'DELL', 'IBM', 'HPQ', 'SUNW', 'YHOO', 'AMZN'
];
