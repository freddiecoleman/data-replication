import protocol from '../../../protocol';
import rumorMessageSerialiser from '../../../serialisers/rumorMessageSerialiser';

describe('rumorMessageSerialiser', () => {
    describe('#serialise', () => {
        it('throws error on invalid message format', () => {
            const invalidRumorMessage = {
                invalid: 'message',
                foo: 1
            };

            expect(() => rumorMessageSerialiser.serialise(invalidRumorMessage)).toThrow(new Error('Invalid rumorMessage ValidationError: "invalid" is not allowed. "foo" is not allowed'));
        });
        it('serialises a valid message to buffer containing messagepack format binary', () => {
            const validRumorMessage = {
                [protocol.rumorMessage.ORIGIN]: 'Einstein',
                [protocol.rumorMessage.FROM]: 'Darwin',
                [protocol.rumorMessage.SEQUENCE]: 999
            };
            const expectedBinary = new Buffer([
                0x81, 0xa1, 0x31, 0x83,
                0xa2, 0x31, 0x30, 0xa8,
                0x45, 0x69, 0x6e, 0x73,
                0x74, 0x65, 0x69, 0x6e,
                0xa2, 0x31, 0x31, 0xa6,
                0x44, 0x61, 0x72, 0x77,
                0x69, 0x6e, 0xa2, 0x31,
                0x32, 0xcd, 0x3, 0xe7
            ]);

            expect(rumorMessageSerialiser.serialise(validRumorMessage)).toEqual(expectedBinary);
        });
    });
});
