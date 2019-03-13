import * as EventEmitter from 'events';
import * as express from 'express';
import LocalState from '../../../localState';
import protocol from '../../../protocol';
import addDataRoute from '../../../routes/add';

describe('/add', () => {
    let localState: jasmine.SpyObj<LocalState>; 
    let res: jasmine.SpyObj<express.Response>;

    beforeEach(() => {
        localState = jasmine.createSpyObj('localState', ['getSequenceNumber']);
        res = jasmine.createSpyObj('response', ['status', 'json', 'send']);
        res.status.and.returnValue(res);

        // @ts-ignore
        localState.sequence = 2;
    })

    it('response with HTTP 400 on invalid request body', () => {
        const invalidRequest: express.Request = <express.Request> { body: { invalid: 'invalid' } };
        const eventEmitter = new EventEmitter();

        addDataRoute(localState, eventEmitter)(invalidRequest, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: new Error('"invalid" is not allowed') });
    });
    
    it('emits message:rumor with valid rumor message and returns HTTP 200', done => {
        const validRequest: express.Request = <express.Request> { body: { data: 'green' } };
        const eventEmitter = new EventEmitter();

        eventEmitter.on('message:rumor', rumorMessage => {
            expect(rumorMessage).toEqual({
                [protocol.rumorMessage.ORIGIN]: localState.name,
                [protocol.rumorMessage.FROM]: localState.name,
                [protocol.rumorMessage.SEQUENCE]: localState.getSequenceNumber() + 1,
                [protocol.rumorMessage.DATA]: 'green'
            });

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith('Data added');

            done();
        });

        addDataRoute(localState, eventEmitter)(validRequest, res);
    });
});