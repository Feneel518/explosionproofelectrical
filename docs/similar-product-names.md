# Similar product names during creation

The New Product form now checks similar names after a 300 ms typing pause. Suggestions appear below the name and slug fields. Edit mode is unchanged.

The lookup searches original and reviewed product names and pending product-creation requests. It handles joined words such as wellglass, partial words and small spelling mistakes. Matching category improves ordering without excluding other categories. FLP/WP and Non-FLP distinctions influence ranking, and numeric specifications are not treated as spelling mistakes.

Up to five matches show their current name, category and variant count. Original names appear when they matched an alias. Existing products open in a new tab so the creation form is preserved. Inactive products are labelled, deleted products are excluded, and pending requests show their approval state. Suggestions guide reuse but do not automatically change the form, block submission or merge records.

The server action requires master-read access, validates the input and returns only the fields needed for suggestions. Generic prefixes alone do not trigger database queries. Failed lookups show a product-search link. Stale responses are ignored when the query changes.

Verification: eight matching/action tests passed, plus TypeScript and lint checks. The rendered suggestion component was checked on desktop and mobile for product links, keyboard navigation, pending requests, empty/error results and out-of-order responses. Read-only queries against the configured catalog confirmed original-name, joined-word and typo searches find the current Well Glass product. No business records were written. This change requires deployment of the updated application to appear on the hosted site.

Tests: `node --test scripts/similar-product-names.test.cjs`.
