---
title: "Engineering and operations"
description: "Learn the dashboard's design system, PWA and notification behavior, CI checks, static build, and deployment configuration."
---

> **In one line:** this section explains the shared UI rules and the path from source files to a static deployment.

The dashboard uses the AmazeUI package, local UI primitives, Tailwind CSS,
Framer Motion, and Lucide icons. It also configures Serwist for a service
worker and web-push UI. Production builds export static files; CI checks code
quality, types, tests, and the build.

## Pages in this section

- [Design system and accessibility](./design-system-and-accessibility.md)
- [Offline behavior and notifications](./offline-and-notifications.md)
- [Testing and build](./testing-and-build.md)
- [Deployment and environments](./deployment-and-environments.md)
