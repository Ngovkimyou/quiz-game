// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {

			id: number | string | undefined
			name: string | undefined;
			score: Value;
			registered_date: Value;

		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
