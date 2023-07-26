// Return a random integer between min and max
export function GetRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
// return a normalized random number between -1 and 1
export function GetRandomNormalizedNumber() {
    const r = Math.random() + Math.random() + Math.random() + Math.random();
    return (r / 4.0) * 2.0 - 1;
}
// Return a random integer number between min and max
export function GetRandomIntNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
// Lerps between two numbers
export function Lerp(a, b, t) {
    return a + (b - a) * t;
}
// Smoothstep between two numbers
export function Smoothstep(a, b, t) {
    const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return x * x * (3 - 2 * x);
}
// Smootherstep between two numbers
export function Smootherstep(a, b, t) {
    const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return x * x * x * (x * (x * 6 - 15) + 10);
}
// Clamp a number between a min and max value
export function Clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
// saturate a number between 0 and 1
export function Saturate(value) {
    return Clamp(value, 0, 1);
}
// Return binear interpolation between four numbers
export function DoBilinearInterpolation(x11, x12, x21, x22, x, y) {
    const r1 = Lerp(x11, x12, x);
    const r2 = Lerp(x21, x22, x);
    const r = Lerp(r1, r2, y);
    return r;
}
//# sourceMappingURL=MathHelper.js.map