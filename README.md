# Gunter's Forge

A storefront for Gunter, the blacksmith of Mautern. Customers order gear and check their place in line Gunter manages the queue from a password-protected workspace.

Built for the 2026 KU High School Design Computer Science Competition.

## Setup

Requires [Node.js](https://nodejs.org/) 22.5 or newer.

```bash
npm install
npm start
```

Open http://localhost in a browser. Set `PORT` to use a different port, e.g. `PORT=3000 npm start`.

## Usage

- **Shop** – enter your name and quantity, then tap **Order**. Save the order ID.
- **Queue** – enter your order ID to see your position in line.
- **Workspace** – Gunter unlocks with the password, sees active orders, and taps **Done** when one is finished.

## Features

- Order any of Gunter's four items: Sword, Plate Armor, Chain Mail, Cooking Pot
- Live queue position lookup
- Password-protected workspace for managing and completing orders
- Orders stored in a SQLite database, shared across devices and kept after restarts
- Mobile-friendly layout with a medieval theme

## Project Structure

```
public/      Frontend (HTML, CSS, JavaScript)
server.js    Express backend and API routes
db.js        SQLite database access
```

## Team Contributions

- Eric
- Maaz
- Aliakbar