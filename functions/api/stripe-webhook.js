// Stripe webhook: checkout.session.completed, invoice.paid, customer.subscription.deleted.
// Endpoint in the Stripe dashboard: https://mykiezberlin.com/api/stripe-webhook
import { db, json, noDb } from "../_lib/util.js";
import { handleStripeEvent, verifyStripeEvent } from "../_lib/werbung.js";

export async function onRequestPost({ request, env }) {
  const event = await verifyStripeEvent(request, env);
  if (!event) return json({ error: "signature" }, 400);
  const database = await db(env);
  if (!database) return noDb();
  await handleStripeEvent(event, database, env);
  return json({ received: true });
}
