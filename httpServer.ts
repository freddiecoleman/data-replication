
import * as EventEmitter from 'events';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as pino from 'pino';
import routes from './routes';
import LocalState from './localState';

const log = pino();

/**
 * Starts a local HTTP server.
 * 
 * @param {*} local 
 * @param {*} eventEmitter 
 */
export const start = (localState: LocalState, eventEmitter: EventEmitter) => {
    const httpServer = express();
    const jsonParser = bodyParser.json();

    // Endpoint for adding data. Schema: { "data": "content" }
    httpServer.post('/add', jsonParser, routes.addDataRoute(localState, eventEmitter));

    log.info(`Starting HTTP server on port ${localState.httpServerPort}`);

    httpServer.listen(localState.httpServerPort);
};
