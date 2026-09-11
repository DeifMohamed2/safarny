# Safarny

Travel marketplace built with **Express.js**, **Node.js**, **EJS**, and **MongoDB**.

## Prerequisites

A local `mongod` instance on port **27017**. No Docker.

```bash
mongod --dbpath /data/db
```

## Run

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

Open [http://localhost:5170](http://localhost:5170).

`npm run seed` upserts demo data by `_id` and is safe to re-run. `npm run seed:reset` drops app collections first (keeps sessions unless you pass `--all`).

`GET /health` returns `{ ok, db }`.

## Demo accounts

Password for all accounts: `123Qwe`

| Role | Email | Lands on |
| --- | --- | --- |
| Traveler | `ahmedali@email.com` | `/` |
| Company | `company@redsea.com` | `/company/dashboard` |
| Company | `company@nileheritage.com` | `/company/dashboard` |
| Company | `company@haramain.com` | `/company/dashboard` |
| Admin | `admin@safarny.com` | `/admin/dashboard` |

## Stack

- Express 5 server-rendered pages
- MongoDB via Mongoose (`mongodb://127.0.0.1:27017/safarny`)
- Session auth stored in MongoDB (`connect-mongo`)
- English / Arabic via `/lang/en` and `/lang/ar`
- Tailwind CSS (browser runtime) plus Swiper for carousels

## Routes

| Path | Notes |
| --- | --- |
| `/` | Home |
| `/search` | Trip search |
| `/trips`, `/trips/:id`, `/trips/offers` | Catalog, details, offers |
| `/umrah` | Umrah packages |
| `/register/company` | Public company signup |
| `/profile`, `/booking-history`, `/contact-us`, `/tickets` | Signed-in traveler account |
| `/company/dashboard` | Company portal |
| `/admin/dashboard` | Admin portal |
