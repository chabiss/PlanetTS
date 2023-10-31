"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoBilinearInterpolation = exports.Saturate = exports.Clamp = exports.Smootherstep = exports.Smoothstep = exports.Lerp = exports.GetRandomIntNumber = exports.GetRandomNormalizedNumber = exports.GetRandomNumber = void 0;
// Return a random integer between min and max
function GetRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
exports.GetRandomNumber = GetRandomNumber;
// return a normalized random number between -1 and 1
function GetRandomNormalizedNumber() {
    const r = Math.random() + Math.random() + Math.random() + Math.random();
    return (r / 4.0) * 2.0 - 1;
}
exports.GetRandomNormalizedNumber = GetRandomNormalizedNumber;
// Return a random integer number between min and max
function GetRandomIntNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
exports.GetRandomIntNumber = GetRandomIntNumber;
// Lerps between two numbers
function Lerp(a, b, t) {
    return a + (b - a) * t;
}
exports.Lerp = Lerp;
// Smoothstep between two numbers
function Smoothstep(a, b, t) {
    const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return x * x * (3 - 2 * x);
}
exports.Smoothstep = Smoothstep;
// Smootherstep between two numbers
function Smootherstep(a, b, t) {
    const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return x * x * x * (x * (x * 6 - 15) + 10);
}
exports.Smootherstep = Smootherstep;
// Clamp a number between a min and max value
function Clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
exports.Clamp = Clamp;
// saturate a number between 0 and 1
function Saturate(value) {
    return Clamp(value, 0, 1);
}
exports.Saturate = Saturate;
// Return binear interpolation between four numbers
function DoBilinearInterpolation(x11, x12, x21, x22, x, y) {
    const r1 = Lerp(x11, x12, x);
    const r2 = Lerp(x21, x22, x);
    const r = Lerp(r1, r2, y);
    return r;
}
exports.DoBilinearInterpolation = DoBilinearInterpolation;
//# sourceMappingURL=MathHelper.js.map