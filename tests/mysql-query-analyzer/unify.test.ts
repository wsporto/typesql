
import { SubstitutionHash } from "../../src/mysql-query-analyzer/parse";
import { Constraint, freshVar } from "../../src/mysql-query-analyzer/collect-constraints";
import { unify } from "../../src/mysql-query-analyzer/unify";

describe('Unification tests', () => {

    it('unify1', () => {

        const u1 = freshVar('u1', 'int');
        const u2 = freshVar('u2', '?');

        const constraints: Constraint[] = [
            {
                expression: 'expr1',
                type1: u1,
                type2: u2
            }
        ]

        const substitutions: SubstitutionHash = {};
        unify(constraints, substitutions);

        // console.log("substitutions=", substitutions);
    })

    it('unify2', () => {
        const constraints: Constraint[] = [
            {
                expression: 'then?',
                type1: { kind: 'TypeVar', id: 1, name: 'CASEWHENid=1then?elseidEND', type: '?' },
                type2: { kind: 'TypeVar', id: 7, name: '?', type: '?' }
            },
            {
                expression: 'elseid',
                type1: { kind: 'TypeVar', id: 1, name: 'CASEWHENid=1then?elseidEND', type: '?' },
                type2: { kind: 'TypeVar', id: 8, name: 'id', type: 'int' }
            },
            {
                expression: 'elseid',
                type1: { kind: 'TypeVar', id: 7, name: '?', type: '?' },
                type2: { kind: 'TypeVar', id: 8, name: 'id', type: 'int' }
            }
        ]

        const substitutions: SubstitutionHash = {};
        unify(constraints, substitutions);

    })

});