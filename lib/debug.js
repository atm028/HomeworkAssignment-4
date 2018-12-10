debug = {};

const Black = "\x1b[30m";
const Red = "\x1b[31m";
const Green = "\x1b[32m";
const Yellow = "\x1b[33m";
const Blue = "\x1b[34m";
const Magenta = "\x1b[35m";
const Cyan = "\x1b[36m";
const White = "\x1b[37m";

debug._print = (color, args) => {
    if("DEBUG" in process.env && process.env.DEBUG.length > 0) {
        var stack = new Error().stack.split("\n")[3];
        console.log(color, stack, args);
    }
};

debug.info = (...args) => debug._print(White, args);
debug.error = (...args) => debug._print(Red, args);

module.exports = debug