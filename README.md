# Gunter's Forge

A storefront for Gunter. Customers can order gear and check their place in line, while Gunter manages orders and inventory from a password-protected workspace. The forge also includes a mining minigame where players collect resources to help supply the blacksmith.

Built for the 2026 KU High School Design Computer Science Competition.

## Setup

Requires [Node.js](https://nodejs.org/?utm_source=chatgpt.com) 22.5 or newer.

```
npm install
npm start
```

Open [http://localhost](http://localhost?utm_source=chatgpt.com) in a browser. Set `PORT` to use a different port, e.g. `PORT=3000 npm start`.

## Usage

- Shop – enter your name and quantity, then tap Order. Save the order ID.
- Queue – enter your order ID to see your position in line and estimated wait time.
- Workspace – Gunter unlocks the password-protected workspace to manage active orders, track inventory, restock materials, and mark orders as completed.
- Mine – play a mining minigame, manage your energy, collect iron, coal, and gold, and try to beat your best score.

## Features

- Order any of Gunter's four items: Sword, Plate Armor, Chain Mail, or Cooking Pot
- Live queue position lookup and estimated wait times
- Password-protected workspace for managing and completing orders
- Inventory tracking for iron, coal, leather, and gold
- Automatic material deductions when customers place orders
- Resource restocking to help keep the forge supplied
- Interactive mining minigame with limited energy and collectible resources
- Persistent mining high score tracking
- Orders and inventory stored in a SQLite database
- Mobile-friendly layout with a medieval theme

## Project Structure

```
public/      Frontend (HTML, CSS, JavaScript)
server.js    Express backend and API routes
mine.js      Mining minigame backend
db.js        SQLite database access
```

## Team Contributions

- Eric: developed whole backend and sqlite db, connected the frontend to backend, then adds background to UI.
- Maaz: developed the Shop and Mini-Game system, as well as the materials system in the Workshop and connection from the Mini-Game to the Workshop.
- Aliakbar: developed the queue and workshop system, as well as the wait time system. Password locked the workspace
