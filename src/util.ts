export const indexGroupBy = <T, Q>(array: T[], predicate: (value: T, index: number, array: T[]) => Q) => {
	return array.reduce((map, value, index, array) => {
		const key = predicate(value, index, array);
		map.get(key)?.push(index) ?? map.set(key, [index]);
		return map;
	}, new Map<Q, number[]>());
}