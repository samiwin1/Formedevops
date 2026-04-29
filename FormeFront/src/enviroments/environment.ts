const port = typeof window !== 'undefined' ? window.location.port : '';
const useNgProxy = port === '4200';
const useRelativeApi = port === '4200' || port === '8080';

export const environment = {
  apiUrl: useNgProxy ? '/user-api' : 'http://localhost:8082/api',
  formationApiUrl: useNgProxy ? '/formation-api' : 'http://localhost:8083/api',
  certificationApiUrl: useRelativeApi ? '/api' : 'http://localhost:8090/api',
  gatewayApiUrl: 'http://localhost:8080/api',
  shopApiUrl: useNgProxy ? '/shop-api' : 'http://localhost:8082/api/shop',
  paymentApiUrl: useNgProxy ? '/payments-api' : 'http://localhost:8082/api/payments',
  documentApiUrl: useNgProxy ? '/document-api' : 'http://localhost:8085/api',
  articleApiUrl: useNgProxy ? '/article-api' : 'http://localhost:8082/api',
  // Stripe Publishable key (frontend only). Secret key (sk_...) must stay in backend config.
  stripePublishableKey: 'pk_test_51QxSSXChmhEZInbmW8zEHsoc7tbqeDnZs8sZMx2SgHUKOdhFhBxOBBWnaN4iLoZyBDmao6objazdCSqEQ2tgO7Ay00qOYahLwC',
};
