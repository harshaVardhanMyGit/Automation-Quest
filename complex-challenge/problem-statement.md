# Complex TestAutothon Challenge: Fulfillment Console

Automate a fulfillment console used by warehouse operators and supervisors.

- Users authenticate as `operator` or `supervisor`; invalid credentials return `401`.
- Operators can search inventory and create orders; orders return `201`.
- Orders exceeding available stock return `409`.
- Supervisors can restock; operators receive `403` for restock.
- The UI preserves login, supports inventory search and order creation, and works on mobile.
- Normal API responses must remain below 500 ms.
- Evidence must cover positive, negative, authorization, mobile, and SLA behavior.
