// backend/src/config/swagger.js
import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SeneteBilling API Documentation",
      version: "1.0.0",
      description:
        "RESTful API for the SeneteBilling Hotspot Management Platform. Refer to SDD Section 4 for endpoint standards.",
      contact: {
        name: "SeneteBilling Architecture Team",
      },
    },
    servers: [
      {
        url: "http://localhost:3000/api/v1",
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Path to the API routes
  apis: ["./src/modules/**/*.routes.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
