/**
 * Serializes async work per key, within this running process.
 *
 * WHY THIS EXISTS: Apps-Engine's IPersistence only exposes
 * readByAssociations() (full-document read) and updateByAssociations()
 * (full-document replace) — there is no $inc, no findOneAndUpdate, no
 * compare-and-swap available to app code. That means every read-modify-write
 * in this app (UserStatusStore.escalate, FlagLogStore.log) is exposed to lost
 * updates whenever two hook invocations for the same user run concurrently.
 *
 * Confirmed via load test: firing 12 identical spam messages for one user
 * with true concurrency (Promise.all, same tick) vs the same 12 messages
 * fired sequentially reproducibly undercounted totalFlags by ~40-60% across
 * repeated runs, and in most runs also produced 2-3 separate antispam-status
 * documents for the same user (a second race in the read-then-upsert on
 * UserStatusStore.get() -> save()).
 *
 * Since the persistence layer gives us no atomic primitive to fix this with,
 * we close the race one level up: callers wrap their read-modify-write in
 * withKeyLock(key, fn), and this queues same-key calls to run one at a time,
 * in submission order, regardless of how many arrive in the same tick.
 *
 * LIMITATION: this only serializes calls within a single running instance of
 * this app. On a horizontally-scaled Rocket.Chat deployment (multiple server
 * processes each running their own copy of this app), calls on different
 * instances are NOT serialized against each other and the race remains open
 * across instances. This is the strongest fix available given what the
 * Apps-Engine persistence API exposes to app code — it is not a complete fix
 * for a multi-instance deployment.
 */

const queues = new Map<string, Promise<unknown>>();

export async function withKeyLock<T>(
	key: string,
	fn: () => Promise<T>,
): Promise<T> {
	const previous = queues.get(key) ?? Promise.resolve();

	// Run fn() after whatever's ahead of it in the queue settles — and run it
	// regardless of whether the previous entry resolved or rejected, so one
	// failed call never wedges every later call for the same key.
	const run = previous.then(fn, fn);

	// Keep the chain alive for the next caller. This tracking promise must
	// never itself reject (it's only used to sequence future calls), so we
	// swallow both outcomes here — the real result/error still flows to the
	// caller of withKeyLock() through `run`, unaffected by this line.
	queues.set(
		key,
		run.then(
			() => undefined,
			() => undefined,
		),
	);

	return run;
}
