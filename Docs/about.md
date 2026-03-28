AccessAI


Welcome ,this is Access AIessentially an accessibility super-app with multiple tools under one roof, each solving a different accessibility challenge.
The focus areas are: Employment, Visual, Mobility, Hearing & Speech, and Cognitive accessibility.

Skeleton
- A home dashboard with all 5 accessibility modules as tappable cards
- Each card opens a modal showing what that module will do
- A pulsing "building" tag on each — because im building it right now

Tech Stack :
Frontend: Kotlin Multiplatform — it's basically Java's modern cousin, built by JetBrains. You write once, deploy to iOS, Android, and desktop.
Backend: Java (Spring Boot) — enterprise gold standard, scales like a dream, every bank uses it.
Key Libraries:

Compose Multiplatform for UI (handles all platforms)
Ktor for networking
Room for local database
Retrofit for API calls
--
Jetpack Compose for Android UI
SwiftUI for iOS
Accessibility frameworks baked into each platform. Then a solid REST API layer in Java connecting everything.

Why this works: You push to App Store, Google Play, Microsoft Store — all from one codebase. Java ecosystem is battle-tested for accessibility compliance, WCAG standards, everything enterprises demand.
