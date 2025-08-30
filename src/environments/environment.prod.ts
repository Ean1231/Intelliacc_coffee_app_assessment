export const environment = {
  production: true,
  soapEndpoint: 'https://skynot.intelliacc.com/ws_IntelliCoffee/Service.asmx',
  soap: {
    timeout: 15000, // 15 seconds for production
    retryAttempts: 2,
    retryDelay: 2000, // 2 seconds
    namespace: 'http://tempuri.org/',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': 'http://tempuri.org/Login'
    }
  },
  logging: {
    enableConsoleLogging: false,
    logLevel: 'error'
  }
};
