import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User Management API",
      version: "1.0.0",
      description:
        "API untuk manajemen user (register, login, CRUD, upload avatar)",
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
  },
  // Include JSDoc comments in route files
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
