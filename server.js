const { setServers } = require("node:dns/promises");
setServers(["1.1.1.1", "8.8.8.8"]);

const dotenv = require("dotenv");
const connectDB = require("./config/db");
const app = require("./app");

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express')

// Load env vars
dotenv.config({ path: "./config/config.env" });

// Connect DB
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    "Server running in",
    process.env.NODE_ENV,
    "mode on port",
    PORT
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Hotel Booking API',
            version: '1.0.0'
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: ['./routes/*.js']
};

const swaggerDoc = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));