import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { type Express } from 'express';

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Feels Social',
      description:
        "API endpoints for a 'feels social media' documented on swagger",
      contact: {
        name: 'Anuj Kumar',
        email: 'wtricks.ak@gmail.com',
        url: 'https://github.com/wtricks',
      },
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:5000/',
        description: 'Local server',
      },
      {
        url: '<your live url here>',
        description: 'Live server',
      },
    ],
  },
  apis: ['../routes/*.ts'],
});

const swaggerDocs = (app: Express) => {
  app.use('/swagger/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/swagger/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

export default swaggerDocs;
