package tn.esprit.forme.config;

/**
 * CORS is handled entirely by the API Gateway (globalcors in application.yml).
 * Having CORS configured here AND in the gateway causes duplicate
 * Access-Control-Allow-Origin headers, which browsers reject with a CORS error
 * even when the HTTP status is 200 OK.
 *
 * This class is intentionally empty. Do NOT re-add a WebMvcConfigurer CORS bean here.
 */
public class CorsConfig {
    // intentionally empty
}
