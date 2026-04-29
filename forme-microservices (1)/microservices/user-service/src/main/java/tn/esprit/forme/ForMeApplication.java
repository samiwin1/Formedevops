package tn.esprit.forme;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient   // registers this microservice with Eureka
public class ForMeApplication {

    public static void main(String[] args) {
        SpringApplication.run(ForMeApplication.class, args);
    }

}
