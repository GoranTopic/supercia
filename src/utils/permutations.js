import { read_json, write_json } from './utils.js'
import spanish_alphbet from './resources/spanish_alphabet.js'

const get_permutations = () => {
		let perm_filename = './resources/generated/spanish_permutations.json',
				chars = spanish_alphbet,
				length = 4, // max number without running out of heap space,
				// might have to try with python
				// try to read permutations file
				permutations = read_json(perm_filename);
		// if something has changed ot not found
		if(permutations === null || permutations.length !== length || permutations.chars !== chars){
				// generate new permutations file 
				console.log('generating permutations...')
				permutations = permutator(chars, length);
				permutations = shuffle(permutations);
				console.log(`permutations done.\n${permutations.length} permutations generated`)
				console.log('saving permutations...')
				permutations = { chars, length, permutations };
				write_json(permutations, perm_filename)
		}
		return permutations;
}

const shuffle = unshuffled => 
		unshuffled
				.map(value => ({ value, sort: Math.random() }))
				.sort((a, b) => a.sort - b.sort)
				.map(({ value }) => value)

const permutator = (string, length) => {
		let permutations = []
		// Generator object
		const gen = permsWithRepn(string, length);
		// Search without needing to generate whole set:
		let
		nxt = gen.next(),
				i = 0,
				alpha = nxt.value,
				psi = alpha;
		while (!nxt.done && 'crack' !== toLower(concat(nxt.value))) {
				psi = nxt.value;
				permutations.push(psi.join(""));
				nxt = gen.next();
				i++;
		}
		return permutations;
};
// PERMUTATION GENERATOR ------------------------------
// permsWithRepn :: [a] -> Int -> Generator [a]
function* permsWithRepn(xs, intGroup) {
		const
		vs = Array.from(xs),
				intBase = vs.length,
				intSet = Math.pow(intBase, intGroup);
		if (0 < intBase) {
				let index = 0;
				while (index < intSet) {
						const
						ds = unfoldr(
								v => 0 < v ? (() => {
										const rd = quotRem(v, intBase);
										return Just(Tuple(vs[rd[1]], rd[0]))
								})() : Nothing(),
								index++
						);
						yield replicate(
								intGroup - ds.length,
								vs[0]
						).concat(ds);
				};
		}
};
// GENERIC FUNCTIONS ----------------------------------
// Just :: a -> Maybe a
const Just = x => ({
		type: 'Maybe',
		Nothing: false,
		Just: x
});
// Nothing :: Maybe a
const Nothing = () => ({
		type: 'Maybe',
		Nothing: true,
});
// Tuple (,) :: a -> b -> (a, b)
const Tuple = (a, b) => ({
		type: 'Tuple',
		'0': a,
		'1': b,
		length: 2
});
// concat :: [[a]] -> [a]
// concat :: [String] -> String
const concat = xs =>
		0 < xs.length ? (() => {
				const unit = 'string' !== typeof xs[0] ? (
						[]
				) : '';
				return unit.concat.apply(unit, xs);
		})() : [];
// index (!!) :: [a] -> Int -> a
// index (!!) :: String -> Int -> Char
const index = (xs, i) => xs[i];
// quotRem :: Int -> Int -> (Int, Int)
const quotRem = (m, n) =>
		Tuple(Math.floor(m / n), m % n);
// replicate :: Int -> a -> [a]
const replicate = (n, x) =>
		Array.from({
				length: n
		}, () => x);
// show :: a -> String
const show = x => JSON.stringify(x);
// toLower :: String -> String
const toLower = s => s.toLocaleLowerCase();
// unfoldr(x => 0 !== x ? Just([x, x - 1]) : Nothing(), 10);
// --> [10,9,8,7,6,5,4,3,2,1]
// unfoldr :: (b -> Maybe (a, b)) -> b -> [a]
const unfoldr = (f, v) => {
		let
		xr = [v, v],
				xs = [];
		while (true) {
				const mb = f(xr[1]);
				if (mb.Nothing) {
						return xs
				} else {
						xr = mb.Just;
						xs.push(xr[0])
				}
		}
};

 export { get_permutations }
