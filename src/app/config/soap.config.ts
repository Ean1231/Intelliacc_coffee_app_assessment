import { environment } from '../../environments/environment';

/**
 * SOAP configuration constants for authentication service
 * Combines environment-specific settings with static templates
 */

export const SOAP_CONFIG = {
  NAMESPACE: environment.soap.namespace,
  
  TEMPLATES: {
    LOGIN: `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Login xmlns="${environment.soap.namespace}">
      <username>{{USERNAME}}</username>
      <password>{{PASSWORD}}</password>
    </Login>
  </soap:Body>
</soap:Envelope>`
  },
  
  HEADERS: environment.soap.headers,
  
  STORAGE: {
    LOGIN_KEY: 'coffee_isLoggedIn'
  },
  
  PLACEHOLDERS: {
    USERNAME: '{{USERNAME}}',
    PASSWORD: '{{PASSWORD}}'
  },

  NETWORK: {
    TIMEOUT: environment.soap.timeout,
    RETRY_ATTEMPTS: environment.soap.retryAttempts,
    RETRY_DELAY: environment.soap.retryDelay
  }
} as const;
