import protocol from '../../../protocol';
import statusMessageSerialiser from '../../../serialisers/statusMessageSerialiser';

describe('statusMessageSerialiser', () => {
    describe('#serialise', () => {
        it('throws error on invalid message format', () => {
            const invalidStatusMessage = {
                invalid: 'message',
                foo: 1
            };

            expect(() => statusMessageSerialiser.serialise(invalidStatusMessage)).toThrow(new Error('Invalid statusMessage ValidationError: "invalid" is not allowed. "foo" is not allowed'));
        });
        it('serialises a valid message to buffer containing messagepack format binary', () => {
            const validRumorMessage = {
                [protocol.statusMessage.ORIGIN]: 'Newton',
                [protocol.statusMessage.WANT]: 22
            };
            const expectedBinary = new Buffer([
                0x81, 0xa1, 0x32,
                0x82, 0xa2, 0x31,
                0x36, 0xa6, 0x4e,
                0x65, 0x77, 0x74,
                0x6f, 0x6e, 0xa2,
                0x31, 0x37, 0x16
            ]);

            expect(statusMessageSerialiser.serialise(validRumorMessage)).toEqual(expectedBinary);
        });
    });
});
