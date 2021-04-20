import {
  Type,
  ObjectType,
  Struct,
  ID,
  Int,
  Float,
  Literal,
  List,
  Union,
  Intersect,
  Nullable,
  Record,
  Json,
  Any,
  Unknown,
  Strict,
  NonStrict,
  ReadOnly,
  ReadOnlyDeep,
  Tuple,
} from '../schema'

import { Formater } from '../newFormater'

const formatSchema = Formater.format

describe('Formater', () => {
  it('supports format Number', () => {
    let result = formatSchema(Number)

    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Number',
        },
      },
    })
  })

  it('support format Int', () => {
    let result = formatSchema(Int)
    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
      },
    })
  })

  it('support format Float', () => {
    let result = formatSchema(Float)
    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Float',
        },
      },
    })
  })

  it('support format String', () => {
    let result = formatSchema(String)
    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'string',
          valueName: 'String',
        },
      },
    })
  })

  it('support format Boolean', () => {
    let result = formatSchema(Boolean)
    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'boolean',
          valueName: 'Boolean',
        },
      },
    })
  })

  it('support format ID', () => {
    let result = formatSchema(ID)
    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'string',
          valueName: 'ID',
        },
      },
    })
  })

  it('support format Literal', () => {
    let result0 = formatSchema(Literal(0))
    let result1 = formatSchema(Literal(false))
    let result2 = formatSchema(Literal('abc'))
    let result3 = formatSchema(Literal(null))

    expect(result0).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Literal',
          value: 0,
        },
      },
    })

    expect(result1).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Literal',
          value: false,
        },
      },
    })

    expect(result2).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Literal',
          value: 'abc',
        },
      },
    })

    expect(result3).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Literal',
          value: null,
        },
      },
    })
  })

  it('support format Json', () => {
    let result = formatSchema(Json)
    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'JsonType',
          valueName: 'Json',
        },
      },
    })
  })

  it('support format Any', () => {
    let result = formatSchema(Any)
    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'any',
          valueName: 'Any',
        },
      },
    })
  })

  it('support format Unknown', () => {
    let result = formatSchema(Unknown)
    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'unknown',
          valueName: 'Unknown',
        },
      },
    })
  })

  it('support format Record', () => {
    let result = formatSchema(Record(Int))

    expect(result).toEqual({
      typeId: 1,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
        '1': {
          type: 'Record',
          valueTypeId: 0,
          $ref: `#/types/0`,
        },
      },
    })
  })

  it('support format Nullable', () => {
    let result = formatSchema(Nullable(Int))

    expect(result).toEqual({
      typeId: 1,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
        '1': {
          type: 'Nullable',
          itemTypeId: 0,
          $ref: `#/types/0`,
        },
      },
    })
  })

  it('support format Tuple', () => {
    let result = formatSchema(Tuple(Int, String))

    expect(result).toEqual({
      typeId: 2,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
        '1': {
          type: 'Scalar',
          valueType: 'string',
          valueName: 'String',
        },
        '2': {
          type: 'Tuple',
          itemTypes: [
            {
              typeId: 0,
              $ref: '#/types/0',
            },
            {
              typeId: 1,
              $ref: '#/types/1',
            },
          ],
        },
      },
    })
  })

  it('support format List', () => {
    let result = formatSchema(List(Int))

    expect(result).toEqual({
      typeId: 1,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
        '1': {
          type: 'List',
          itemTypeId: 0,
          $ref: `#/types/0`,
        },
      },
    })
  })

  it('support format Union', () => {
    let result = formatSchema(Union(Int, Float, Boolean))

    expect(result).toEqual({
      typeId: 3,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
        '1': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Float',
        },
        '2': {
          type: 'Scalar',
          valueType: 'boolean',
          valueName: 'Boolean',
        },

        '3': {
          type: 'Union',
          itemTypes: [
            {
              typeId: 0,
              $ref: '#/types/0',
            },
            {
              typeId: 1,
              $ref: '#/types/1',
            },
            {
              typeId: 2,
              $ref: '#/types/2',
            },
          ],
        },
      },
    })
  })

  it('support format Intersect', () => {
    let result = formatSchema(Intersect(Int, Float, Boolean))

    expect(result).toEqual({
      typeId: 3,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
        '1': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Float',
        },
        '2': {
          type: 'Scalar',
          valueType: 'boolean',
          valueName: 'Boolean',
        },
        '3': {
          type: 'Intersect',
          itemTypes: [
            {
              typeId: 0,
              $ref: '#/types/0',
            },
            {
              typeId: 1,
              $ref: '#/types/1',
            },
            {
              typeId: 2,
              $ref: '#/types/2',
            },
          ],
        },
      },
    })
  })

  it('supports format Struct', () => {
    let result = formatSchema(
      Struct({
        a: Int,
        b: Number,
        c: {
          d: Float,
          e: Int,
        },
      }),
    )

    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Struct',
          fields: {
            a: {
              typeId: 1,
              $ref: '#/types/1',
            },
            b: {
              typeId: 2,
              $ref: '#/types/2',
            },
            c: {
              typeId: 3,
              $ref: '#/types/3',
            },
          },
        },
        '1': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
        '2': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Number',
        },
        '3': {
          type: 'Struct',
          fields: {
            d: {
              typeId: 4,
              $ref: '#/types/4',
            },
            e: {
              typeId: 1,
              $ref: '#/types/1',
            },
          },
        },
        '4': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Float',
        },
      },
    })
  })

  it('support format Object', () => {
    class Test extends ObjectType {
      a = Int
      b = Float
      c = Int
      d = {
        e: Nullable(Test),
      }
      f = List(Test)
    }

    let result = formatSchema(Test)

    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Object',
          name: 'Test',
          fields: {
            a: {
              typeId: 1,
              $ref: '#/types/1',
            },
            b: {
              typeId: 2,
              $ref: '#/types/2',
            },
            c: {
              typeId: 1,
              $ref: '#/types/1',
            },
            d: {
              typeId: 3,
              $ref: '#/types/3',
            },
            f: {
              typeId: 4,
              $ref: '#/types/4',
            },
          },
        },
        '1': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
        '2': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Float',
        },
        '3': {
          type: 'Struct',
          fields: {
            e: {
              typeId: 5,
              $ref: '#/types/5',
            },
          },
        },
        '4': {
          type: 'List',
          itemTypeId: 0,
          $ref: '#/types/0',
        },
        '5': {
          type: 'Nullable',
          itemTypeId: 0,
          $ref: '#/types/0',
        },
      },
    })
  })

  it('supports extended info like description/deprecated', () => {
    class Test extends ObjectType {
      a = {
        description: 'int',
        deprecated: 'use field b',
        [Type]: Int,
      }
      b = {
        description: 'float',
        [Type]: Float,
      }
    }

    let result = formatSchema(Test)

    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Object',
          name: 'Test',
          fields: {
            a: {
              typeId: 1,
              description: 'int',
              deprecated: 'use field b',
              $ref: '#/types/1',
            },
            b: {
              typeId: 2,
              description: 'float',
              $ref: '#/types/2',
            },
          },
        },
        '1': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
        '2': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Float',
        },
      },
    })
  })

  it('supports format Strict/NonStrict/ReadOnly/ReadOnlyDeep', () => {
    let result0 = formatSchema(
      Strict(
        Struct({
          a: Int,
        }),
      ),
    )

    let result1 = formatSchema(
      NonStrict(
        Struct({
          a: Int,
        }),
      ),
    )

    let result2 = formatSchema(
      ReadOnly(
        Struct({
          a: Int,
        }),
      ),
    )

    let result3 = formatSchema(
      ReadOnlyDeep(
        Struct({
          a: Int,
        }),
      ),
    )

    expect(result0).toEqual({
      typeId: 1,
      types: {
        '0': {
          type: 'Struct',
          fields: {
            a: {
              typeId: 2,
              $ref: '#/types/2',
            },
          },
        },
        '1': {
          type: 'Strict',
          itemTypeId: 0,
          $ref: '#/types/0',
        },
        '2': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
      },
    })

    expect(result1).toEqual({
      typeId: 1,
      types: {
        '0': {
          type: 'Struct',
          fields: {
            a: {
              typeId: 2,
              $ref: '#/types/2',
            },
          },
        },
        '1': {
          type: 'NonStrict',
          itemTypeId: 0,
          $ref: '#/types/0',
        },
        '2': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
      },
    })

    expect(result2).toEqual({
      typeId: 1,
      types: {
        '0': {
          type: 'Struct',
          fields: {
            a: {
              typeId: 2,
              $ref: '#/types/2',
            },
          },
        },
        '1': {
          type: 'ReadOnly',
          itemTypeId: 0,
          $ref: '#/types/0',
        },
        '2': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
      },
    })

    expect(result3).toEqual({
      typeId: 1,
      types: {
        '0': {
          type: 'Struct',
          fields: {
            a: {
              typeId: 2,
              $ref: '#/types/2',
            },
          },
        },
        '1': {
          type: 'ReadOnlyDeep',
          itemTypeId: 0,
          $ref: '#/types/0',
        },
        '2': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
      },
    })
  })
})
