export const fmt = (/** @type {any} */ n) =>
	new Intl.NumberFormat().format(n || 0);

export const formatDate = (/** @type {string | number | Date} */ date) =>
	date
		? new Date(date).toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			})
		: "Never";

export const clamp = (/** @type {number} */ x) => Math.max(0, Math.min(100, x));
