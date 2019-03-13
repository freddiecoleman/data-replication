export default interface Message {
    [key: number]: string | number;
    [key: string]: string | number;
}
