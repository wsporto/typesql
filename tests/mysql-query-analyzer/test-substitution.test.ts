
import assert from "assert";
import { parseAndInfer, SubstitutionHash } from "../../src/mysql-query-analyzer/parse";
import { TypeVar, Constraint } from "../../src/mysql-query-analyzer/collect-constraints";
import { substitute, unify } from "../../src/mysql-query-analyzer/unify";

describe.skip('Substitution tests', () => {

    const u1: TypeVar = {
        kind: 'TypeVar',
        id: '0',
        name: 'u1',
        type: 'int'
    }

    const u2: TypeVar = {
        kind: 'TypeVar',
        id: '1',
        name: 'u2',
        type: 'varchar'
    }

    const u3: TypeVar = {
        kind: 'TypeVar',
        id: '2',
        name: 'u3',
        type: '?'
    }

    const substitutions: SubstitutionHash = {
        0: u1,
        1: u2,
        2: u1
    }

    it('substitute 1', () => {
        //id -> int

        const type1: TypeVar = {
            kind: 'TypeVar',
            id: '10',
            name: 'id',
            type: 'int'
        }

        const actual = substitute(type1, substitutions, {} as Constraint);

        const expected = type1;

        assert.deepStrictEqual(actual, expected);
    })

    it('substitute 2', () => {

        const newInt: TypeVar = {
            kind: 'TypeVar',
            id: '10',
            name: 'id',
            type: 'int'
        }

        const actual = substitute(newInt, substitutions, {} as Constraint);
        assert.deepStrictEqual(actual, newInt, "substitution 1");

        const actual2 = substitute(u1, substitutions, {} as Constraint);
        assert.deepStrictEqual(actual2, u1, "substitution 2");

        const actual3 = substitute(u3, substitutions, {} as Constraint);
        assert.deepStrictEqual(actual3, u1, "substitution 3");
    })


    it.skip('substitution case when', () => {

        const constraints: Constraint[] = [
            {
                expression: '?+id',
                type1: { kind: 'TypeVar', id: '15', name: '?', type: '?' },
                type2: { kind: 'TypeVar', id: '16', name: 'id', type: 'int' },
                mostGeneralType: true
            },
            {
                expression: '?+id',
                type1: { kind: 'TypeVar', id: '14', name: '?+id', type: 'double' },
                type2: { kind: 'TypeVar', id: '15', name: '?', type: '?' },
                mostGeneralType: true
            },
            {
                expression: '?+id',
                type1: { kind: 'TypeVar', id: '14', name: '?+id', type: 'double' },
                type2: { kind: 'TypeVar', id: '16', name: 'id', type: 'int' },
                mostGeneralType: true
            },
            {
                expression: 'THEN?+id',
                type1:
                {
                    kind: 'TypeVar',
                    id: '1',
                    name: 'CASEWHENid=1THEN?+idWHENid=2THEN2WHENid=3then?ELSE1END',
                    type: '?'
                },
                type2: { kind: 'TypeVar', id: '14', name: '?+id', type: 'double' },
                mostGeneralType: true
            },
            {
                expression: 'THEN2',
                type1:
                {
                    kind: 'TypeVar',
                    id: '1',
                    name: 'CASEWHENid=1THEN?+idWHENid=2THEN2WHENid=3then?ELSE1END',
                    type: '?'
                },
                type2: { kind: 'TypeVar', id: '17', name: '2', type: 'int' },
                mostGeneralType: true
            },
            {
                expression: 'then?',
                type1:
                {
                    kind: 'TypeVar',
                    id: '1',
                    name: 'CASEWHENid=1THEN?+idWHENid=2THEN2WHENid=3then?ELSE1END',
                    type: '?'
                },
                type2: { kind: 'TypeVar', id: '18', name: '?', type: '?' },
                mostGeneralType: true
            },
            {
                expression: 'ELSE1',
                type1:
                {
                    kind: 'TypeVar',
                    id: '1',
                    name: 'CASEWHENid=1THEN?+idWHENid=2THEN2WHENid=3then?ELSE1END',
                    type: '?'
                },
                type2: { kind: 'TypeVar', id: '19', name: '1', type: 'int' },
                mostGeneralType: true
            },
            {
                expression: 'ELSE1',
                type1: { kind: 'TypeVar', id: '14', name: '?+id', type: 'double' },
                type2: { kind: 'TypeVar', id: '19', name: '1', type: 'int' },
                mostGeneralType: true
            },
            {
                expression: 'ELSE1',
                type1: { kind: 'TypeVar', id: '17', name: '2', type: 'int' },
                type2: { kind: 'TypeVar', id: '19', name: '1', type: 'int' },
                mostGeneralType: true
            },
            {
                expression: 'ELSE1',
                type1: { kind: 'TypeVar', id: '18', name: '?', type: '?' },
                type2: { kind: 'TypeVar', id: '19', name: '1', type: 'int' },
                mostGeneralType: true
            }
        ]

        const substitutions = {};
        unify(constraints, substitutions);

        const expected = {
            '1':
            {
                kind: 'TypeVar',
                id: '14',
                name: '?+id',
                type: 'double',
                list: undefined
            },
            '15':
            {
                kind: 'TypeVar',
                id: '16',
                name: 'id',
                type: 'double',
                list: undefined
            },
            '16': { kind: 'TypeVar', id: '14', name: '?+id', type: 'double' },
            '17':
            {
                kind: 'TypeVar',
                id: '14',
                name: '?+id',
                type: 'double',
                list: undefined
            },
            '18':
            {
                kind: 'TypeVar',
                id: '14',
                name: '?+id',
                type: 'double',
                list: undefined
            },
            '19':
            {
                kind: 'TypeVar',
                id: '14',
                name: '?+id',
                type: 'double',
                list: undefined
            }
        }

        assert.deepStrictEqual(substitutions, expected);
    })

    it('int+int', () => {

        const typeInt: TypeVar = {
            kind: 'TypeVar',
            id: '0',
            name: 'id',
            type: 'int'
        }

        const typeNumber: TypeVar = {
            kind: 'TypeVar',
            id: '1',
            name: 'id',
            type: 'number'
        }

        const typeVarLeft: TypeVar = {
            kind: 'TypeVar',
            id: '2',
            name: '?',
            type: '?'
        }

        const typeVarRight: TypeVar = {
            kind: 'TypeVar',
            id: '3',
            name: '?',
            type: '?'
        }

        const typeVarResult: TypeVar = {
            kind: 'TypeVar',
            id: '4',
            name: '?',
            type: '?'
        }

        const constraints: Constraint[] = [
            {
                expression: 'id+id',
                type1: typeVarResult,
                type2: typeNumber,
                mostGeneralType: true
            },
            {
                expression: 'id',
                type1: typeVarLeft,
                type2: typeNumber,
                mostGeneralType: true
            },
            {
                expression: 'value',
                type1: typeVarRight,
                type2: typeNumber,
                mostGeneralType: true
            },
            {
                expression: 'id',
                type1: typeVarLeft,
                type2: typeInt,
                mostGeneralType: true
            },
            {
                expression: 'value',
                type1: typeVarRight,
                type2: typeInt,
                mostGeneralType: true
            },
            {
                expression: 'value',
                type1: typeVarLeft,
                type2: typeVarRight,
                mostGeneralType: true
            },
            {
                expression: 'value',
                type1: typeVarResult,
                type2: typeVarRight,
                mostGeneralType: true
            },
            {
                expression: 'value',
                type1: typeVarResult,
                type2: typeVarLeft,
                mostGeneralType: true
            }
        ]

        const substitutions: SubstitutionHash = {};
        unify(constraints, substitutions);

        console.log("unify===", substitutions);
        assert.deepStrictEqual(substitutions[2].type, 'bigint');
        assert.deepStrictEqual(substitutions[3].type, 'bigint');
        assert.deepStrictEqual(substitutions[4].type, 'bigint');
    })

    it('int+double', () => {

        const typeInt: TypeVar = {
            kind: 'TypeVar',
            id: '0',
            name: 'id',
            type: 'int'
        }

        const typeDouble: TypeVar = {
            kind: 'TypeVar',
            id: '10',
            name: 'id',
            type: 'double'
        }

        const typeNumber: TypeVar = {
            kind: 'TypeVar',
            id: '1',
            name: 'id',
            type: 'number'
        }

        const typeVarLeft: TypeVar = {
            kind: 'TypeVar',
            id: '2',
            name: '?',
            type: '?'
        }

        const typeVarRight: TypeVar = {
            kind: 'TypeVar',
            id: '3',
            name: '?',
            type: '?'
        }

        const typeVarResult: TypeVar = {
            kind: 'TypeVar',
            id: '4',
            name: '?',
            type: '?'
        }

        const constraints: Constraint[] = [
            {
                expression: 'id+double_value',
                type1: typeVarResult,
                type2: typeNumber,
                mostGeneralType: true
            },
            {
                expression: 'id',
                type1: typeVarLeft,
                type2: typeNumber,
                mostGeneralType: true
            },
            {
                expression: 'value',
                type1: typeVarRight,
                type2: typeNumber,
                mostGeneralType: true
            },
            {
                expression: 'id',
                type1: typeVarLeft,
                type2: typeInt,
                mostGeneralType: true
            },
            {
                expression: 'value',
                type1: typeVarRight,
                type2: typeDouble,
                mostGeneralType: true
            },
            {
                expression: 'value',
                type1: typeVarLeft,
                type2: typeVarRight,
                mostGeneralType: true
            },
            {
                expression: 'value',
                type1: typeVarResult,
                type2: typeVarRight,
                mostGeneralType: true
            },
            {
                expression: 'value',
                type1: typeVarResult,
                type2: typeVarLeft,
                mostGeneralType: true
            }
        ]

        const substitutions: SubstitutionHash = {};
        unify(constraints, substitutions);

        console.log("unify===", substitutions);
        assert.deepStrictEqual(substitutions[2].type, 'double');
        assert.deepStrictEqual(substitutions[3].type, 'double');
        assert.deepStrictEqual(substitutions[4].type, 'double');
    })

    it('int+?', () => {

        const typeInt: TypeVar = {
            kind: 'TypeVar',
            id: '0',
            name: 'id',
            type: 'int'
        }

        const typeParam: TypeVar = {
            kind: 'TypeVar',
            id: '10',
            name: '?',
            type: '?'
        }

        const typeNumber: TypeVar = {
            kind: 'TypeVar',
            id: '1',
            name: 'id',
            type: 'number'
        }

        const typeVarLeft: TypeVar = {
            kind: 'TypeVar',
            id: '2',
            name: '?',
            type: '?'
        }

        const typeVarRight: TypeVar = {
            kind: 'TypeVar',
            id: '3',
            name: '?',
            type: '?'
        }

        const typeVarResult: TypeVar = {
            kind: 'TypeVar',
            id: '4',
            name: '?',
            type: '?'
        }

        const constraints: Constraint[] = [
            {
                expression: 'id+double_value',
                type1: typeVarResult,
                type2: typeNumber,
                mostGeneralType: true
            },
            {
                expression: 'id',
                type1: typeVarLeft,
                type2: typeNumber,
                mostGeneralType: true
            },
            {
                expression: 'value',
                type1: typeVarRight,
                type2: typeNumber,
                mostGeneralType: true
            },
            {
                expression: 'id',
                type1: typeVarLeft,
                type2: typeInt,
                mostGeneralType: true
            },
            {
                expression: 'value',
                type1: typeVarRight,
                type2: typeParam,
                mostGeneralType: true
            },
            {
                expression: 'value',
                type1: typeVarLeft,
                type2: typeVarRight,
                mostGeneralType: true
            },
            {
                expression: 'value',
                type1: typeVarResult,
                type2: typeVarRight,
                mostGeneralType: true
            },
            {
                expression: 'value',
                type1: typeVarResult,
                type2: typeVarLeft,
                mostGeneralType: true
            }
        ]

        const substitutions: SubstitutionHash = {};
        unify(constraints, substitutions);

        console.log("unify===", substitutions);
        assert.deepStrictEqual(substitutions[2].type, 'number');
        assert.deepStrictEqual(substitutions[3].type, 'number');
        assert.deepStrictEqual(substitutions[4].type, 'number');
    })

    it('bigint+?', () => {

        const typeInt: TypeVar = {
            kind: 'TypeVar',
            id: '0',
            name: 'id',
            type: 'bigint'
        }

        const typeParam: TypeVar = {
            kind: 'TypeVar',
            id: '10',
            name: '?',
            type: '?'
        }

        const typeNumber: TypeVar = {
            kind: 'TypeVar',
            id: '1',
            name: 'id',
            type: 'number'
        }

        const typeVarLeft: TypeVar = {
            kind: 'TypeVar',
            id: '2',
            name: '?',
            type: '?'
        }

        const typeVarRight: TypeVar = {
            kind: 'TypeVar',
            id: '3',
            name: '?',
            type: '?'
        }

        const typeVarResult: TypeVar = {
            kind: 'TypeVar',
            id: '4',
            name: '?',
            type: '?'
        }

        const constraints: Constraint[] = [
            {
                expression: 'id+double_value',
                type1: typeVarResult,
                type2: typeNumber,
                mostGeneralType: true
            },
            {
                expression: 'id',
                type1: typeVarLeft,
                type2: typeNumber,
                mostGeneralType: true
            },
            {
                expression: 'value',
                type1: typeVarRight,
                type2: typeNumber,
                mostGeneralType: true
            },
            {
                expression: 'id',
                type1: typeVarLeft,
                type2: typeInt,
                mostGeneralType: true
            },
            {
                expression: 'value',
                type1: typeVarRight,
                type2: typeParam,
                mostGeneralType: true
            },
            {
                expression: 'value',
                type1: typeVarLeft,
                type2: typeVarRight,
                mostGeneralType: true
            },
            {
                expression: 'value',
                type1: typeVarResult,
                type2: typeVarRight,
                mostGeneralType: true
            },
            {
                expression: 'value',
                type1: typeVarResult,
                type2: typeVarLeft,
                mostGeneralType: true
            }
        ]

        const substitutions: SubstitutionHash = {};
        unify(constraints, substitutions);

        console.log("unify===", substitutions);
        assert.deepStrictEqual(substitutions[2].type, 'number');
        assert.deepStrictEqual(substitutions[3].type, 'number');
        assert.deepStrictEqual(substitutions[4].type, 'number');
    })
});