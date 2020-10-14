"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.term = exports.any = exports.json = exports.record = exports.literal = exports.union = exports.nullable = exports.object = exports.list = exports.boolean = exports.string = exports.number = exports.thunk = exports.createType = exports.isTerm = exports.isType = exports.Ok = exports.Err = void 0;
const util_1 = require("./util");
const types_1 = require("../types");
Object.defineProperty(exports, "Err", { enumerable: true, get: function () { return types_1.Err; } });
Object.defineProperty(exports, "Ok", { enumerable: true, get: function () { return types_1.Ok; } });
const TypeSymbol = Symbol('Type');
const isType = (input) => {
    return !!(input && input[TypeSymbol]);
};
exports.isType = isType;
const TermSymbol = Symbol('Term');
const isTerm = (input) => {
    return !!(input && input[TermSymbol]);
};
exports.isTerm = isTerm;
const createType = (options) => {
    var _a;
    let symbol = Symbol('TypeKind');
    let validate = options.validate;
    let is = (input) => {
        return input[TermSymbol] === symbol;
    };
    let assert = (input) => {
        if (!is(input)) {
            throw new Error(`Unexpected value: ${input}`);
        }
    };
    let toJSON = (_a = options.toJSON) !== null && _a !== void 0 ? _a : (() => ({
        type: 'Type'
    }));
    let json;
    let runing = false;
    let props = {
        [TypeSymbol]: true,
        toJSON: () => {
            if (runing) {
                return {
                    type: 'Recursive',
                };
            }
            runing = true;
            if (json === undefined) {
                json = toJSON();
            }
            runing = false;
            return json;
        },
        validate,
        is,
        assert,
    };
    let schema = util_1.assign((value) => {
        let result = validate(value);
        if (result.isErr)
            throw new Error(result.value.message);
        return {
            [TermSymbol]: symbol,
            value: result.value,
        };
    }, props);
    return schema;
};
exports.createType = createType;
const thunk = (f) => {
    let Type;
    let getType = () => {
        if (Type === undefined) {
            Type = f();
        }
        return Type;
    };
    return exports.createType({
        toJSON: () => {
            return getType().toJSON();
        },
        validate: (input) => {
            return getType().validate(input);
        },
    });
};
exports.thunk = thunk;
// tslint:disable-next-line: variable-name
exports.number = exports.createType({
    toJSON: () => {
        return {
            type: 'Number',
        };
    },
    validate: (input) => {
        if (typeof input === 'string') {
            let n = util_1.toNumber(input);
            if (!isNaN(n)) {
                input = n;
            }
        }
        if (typeof input === 'number') {
            return types_1.Ok(input);
        }
        else {
            return types_1.Err({
                message: `${input} is not a number`,
            });
        }
    },
});
// tslint:disable-next-line: variable-name
exports.string = exports.createType({
    toJSON: () => {
        return {
            type: 'String',
        };
    },
    validate: (input) => {
        if (typeof input === 'string') {
            return types_1.Ok(input);
        }
        else {
            return types_1.Err({
                message: `${input} is not a string`,
            });
        }
    },
});
// tslint:disable-next-line: variable-name
exports.boolean = exports.createType({
    toJSON: () => {
        return {
            type: 'Boolean',
        };
    },
    validate: (input) => {
        if (input === 'true') {
            input = true;
        }
        else if (input === 'false') {
            input = false;
        }
        if (typeof input === 'boolean') {
            return types_1.Ok(input);
        }
        else {
            return types_1.Err({
                message: `${input} is not a boolean`,
            });
        }
    },
});
const list = (ItemType) => {
    return exports.createType({
        toJSON: () => {
            return {
                type: 'List',
                itemType: ItemType.toJSON(),
            };
        },
        validate: (input) => {
            var _a;
            if (!Array.isArray(input)) {
                return types_1.Err({
                    message: `${input} is not a array`,
                });
            }
            let list = [];
            for (let i = 0; i < input.length; i++) {
                let item = input[i];
                let result = ItemType.validate(item);
                if (result.isErr) {
                    return types_1.Err({
                        path: [i, ...((_a = result.value.path) !== null && _a !== void 0 ? _a : [])],
                        message: result.value.message,
                    });
                }
                list.push(result.value);
            }
            return types_1.Ok(list);
        },
    });
};
exports.list = list;
const object = (fields) => {
    let Type = exports.createType({
        toJSON: () => {
            let list = util_1.entries(fields).map(([key, Type]) => {
                return {
                    key,
                    type: Type.toJSON(),
                };
            });
            return {
                type: 'Object',
                fields: list,
            };
        },
        validate: (input) => {
            var _a;
            if (typeof input !== 'object') {
                return types_1.Err({
                    message: `${input} is not an object`,
                });
            }
            if (input === null) {
                return types_1.Err({
                    message: `null is not an object`,
                });
            }
            if (Array.isArray(input)) {
                return types_1.Err({
                    message: `${input} is not an object`,
                });
            }
            let object = {};
            let source = input;
            for (let key in fields) {
                let FieldType = fields[key];
                let field = source[key];
                let result = FieldType.validate(field);
                if (result.isErr) {
                    return types_1.Err({
                        path: [key, ...((_a = result.value.path) !== null && _a !== void 0 ? _a : [])],
                        message: result.value.message,
                    });
                }
                object[key] = result.value;
            }
            return types_1.Ok(object);
        },
    });
    return Type;
};
exports.object = object;
const nullable = (Type) => {
    return exports.createType({
        toJSON: () => {
            return {
                type: 'Nullable',
                contentType: Type.toJSON(),
            };
        },
        validate: (input) => {
            if (input === null) {
                return types_1.Ok(input);
            }
            if (input === undefined) {
                return types_1.Ok(input);
            }
            return Type.validate(input);
        },
    });
};
exports.nullable = nullable;
const union = (...Types) => {
    let Type = exports.createType({
        toJSON: () => {
            return {
                type: 'Union',
                contentTypes: Types.map((Type) => Type.toJSON()),
            };
        },
        validate: (input) => {
            for (let i = 0; i < Types.length; i++) {
                let Type = Types[i];
                let result = Type.validate(input);
                if (result.isOk)
                    return result;
            }
            return types_1.Err({
                message: `${input} is not matched the union types: \n${JSON.stringify(Type.toJSON(), null, 2)}`,
            });
        },
    });
    return Type;
};
exports.union = union;
const literal = (literal) => {
    return exports.createType({
        toJSON: () => {
            return {
                type: 'Literal',
                literal: literal,
            };
        },
        validate: (input) => {
            if (input === literal) {
                return types_1.Ok(literal);
            }
            else {
                return types_1.Err({
                    message: `${input} is not equal to ${literal}`,
                });
            }
        },
    });
};
exports.literal = literal;
const record = (Type) => {
    let ResultType = exports.createType({
        toJSON: () => {
            return {
                type: 'Record',
                valueType: Type.toJSON(),
            };
        },
        validate: (input) => {
            var _a;
            if (typeof input !== 'object') {
                return types_1.Err({
                    message: `${input} is not an object`,
                });
            }
            if (input === null) {
                return types_1.Err({
                    message: `null is not an object`,
                });
            }
            if (Array.isArray(input)) {
                return types_1.Err({
                    message: `${input} is not an object`,
                });
            }
            let record = {};
            let source = input;
            for (let key in source) {
                let value = source[key];
                let result = Type.validate(value);
                if (result.isErr) {
                    return types_1.Err({
                        path: [key, ...((_a = result.value.path) !== null && _a !== void 0 ? _a : [])],
                        message: result.value.message,
                    });
                }
                record[key] = result.value;
            }
            return types_1.Ok(record);
        },
    });
    return ResultType;
};
exports.record = record;
exports.json = exports.thunk(() => {
    return exports.union(exports.number, exports.string, exports.boolean, exports.any, exports.literal(null), exports.list(exports.json), exports.record(exports.json));
});
// tslint:disable-next-line: variable-name
exports.any = exports.createType({
    toJSON: () => {
        return {
            type: 'Any',
        };
    },
    validate: (input) => {
        return types_1.Ok(input);
    },
});
exports.term = exports.createType({
    toJSON: () => {
        return {
            type: 'Term',
        };
    },
    validate: (input) => {
        if (exports.isTerm(input)) {
            return types_1.Ok(input);
        }
        else {
            return types_1.Err({
                message: `${input} is not a term of any Type`,
            });
        }
    },
});
