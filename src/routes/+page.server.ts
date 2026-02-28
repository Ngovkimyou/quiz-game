import type { PageServerLoad } from './$types';
// import { Server } from 'socket.io';

// // In your backend file
// const io = new Server(3000, {
//   cors: {
//     origin: "http://localhost:5173", // Your SvelteKit dev port
//     methods: ["GET", "POST"],
//   },
// });

export const load: PageServerLoad = async ({ locals }) => {
	return {
		name: locals.name,
		score: locals.score,
		registered_date: locals.registered_date
	};
};
