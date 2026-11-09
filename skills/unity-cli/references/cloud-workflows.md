# Inspect and run cloud builds and Pipeline Automation jobs

Read [cloud-automation.md](cloud-automation.md) for every command in
both groups, context/authentication, per-command filters and sorting,
output fields, pagination (including the leaves that refuse `--page`/`--limit`
rather than ignoring them), errors, and redaction. `pipeline cloud-build` works with Build Automation;
`pipeline automation` works with Pipeline Automation. Neither needs a running Editor
or the local Pipeline package. Use numeric organization IDs for service accounts.
The inventory commands are read-only. The commands that act on work start and
cancel builds, download artifacts, trigger pipelines, and follow or act on jobs;
`builds cancel`, `jobs terminate` and `jobs reject` ask first unless `--yes` is
given, and none of them change configuration.

JSON/NDJSON return full API-shaped results under `data`, as Collab does; NDJSON
has one terminal result, without item frames. Preserve native fields and free-form
metadata, subject to the reference's bounded secret protections and public-API
redaction assumption. Table projections remain separate. Explicit local build
targets retain `_local`; missing targets aren't local. These conventions apply
to follow-up cloud-automation work too.
