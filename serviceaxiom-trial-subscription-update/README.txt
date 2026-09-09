SERVICEAXIOM TRIAL AND SUBSCRIPTION BILLING

Plan
- 14-day trial
- No card required at signup
- $29.99 USD monthly Stripe subscription

Existing organizations are marked active so current development accounts are
not locked out. Organizations created after the migration begin in trialing
status with a 14-day expiration date.

Required environment variables
- STRIPE_SECRET_KEY (already used by ServiceAxiom)
- STRIPE_SERVICEAXIOM_PRICE_ID
- STRIPE_SUBSCRIPTION_WEBHOOK_SECRET
- NEXT_PUBLIC_APP_URL

The existing /api/stripe/webhook remains dedicated to payments homeowners make
to contractors. The new /api/stripe/subscription-webhook handles money
contractors pay ServiceAxiom.

Subscription webhook events
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.paid
- invoice.payment_failed

Stripe's customer portal must be activated before Manage subscription works.

