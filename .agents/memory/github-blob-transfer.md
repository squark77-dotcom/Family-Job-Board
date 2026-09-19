---
name: Large Git object transfer
description: Reliable handling of large binary and lockfile blobs when reconstructing Git history through the authenticated GitHub API.
---

When transferring large Git objects through shell-mediated base64 output, split the encoded data into bounded chunks and reassemble it before uploading. A successful API response does not prove the uploaded blob matches the local object.

**Why:** Large output can be truncated while still looking like a valid base64 string, producing a different blob and therefore a different tree.

**How to apply:** Compare Git object sizes and file-level blob SHAs after upload. For large objects, use fixed-size chunks below the output limit and remove only transport-added line endings before concatenation.