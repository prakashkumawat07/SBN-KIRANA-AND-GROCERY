# SBN KIRANA AND GROCERY

Full-stack grocery e-commerce application with a separate customer storefront and admin dashboard.

## Tech Stack
- React + Vite
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication + bcryptjs

## Features
- Customer registration and login
- Product catalog, search and category filters
- Shopping cart and checkout
- COD / demo UPI order flow
- Customer order history
- Contact messages
- Separate role-based admin dashboard
- Admin product CRUD, price and inventory management
- Admin order status management
- Customer and support-message views
- Dashboard KPIs and revenue overview

## Structure
```text
client/   Customer website
admin/    Separate admin dashboard
server/   REST API + MongoDB
```

## Setup
1. Run `npm install`
2. Run `npm run install:all`
3. Copy `server/.env.example` to `server/.env`
4. Start MongoDB or use a MongoDB Atlas connection string
5. Run `npm run seed`
6. Run `npm run dev`

Store: `http://localhost:5173`  
Admin: `http://localhost:5174`  
API: `http://localhost:5000`


**SBN KIRANA AND GROCERY — Full Stack E-commerce Web Application**  
Built a responsive grocery e-commerce platform using React, Node.js, Express and MongoDB with JWT authentication, product search/filtering, cart and checkout flows, order tracking, and a separate role-based admin dashboard for product CRUD, inventory, customers, orders and support messages.
