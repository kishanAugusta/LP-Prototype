# Labor Planner — Client Prototype

Interactive, shareable prototype of Mastronardi Produce’s Labor Planner. Every control works: SSO personas, Planner grid, Summary analytics, and Admin. Data lives in the browser (no Azure required).

## Run it locally (show on your machine)

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

**Self-exploration guide (send this with the prototype):**
- In the app: **Exploration guide** on the sign-in screen and in the header
- Printable / PDF: [http://localhost:5173/guide.html](http://localhost:5173/guide.html) (File → Print → Save as PDF)
- Markdown copy in the repo: [`GUIDE.md`](./GUIDE.md)

## Share with the client

**Same office / Wi-Fi:** start the app with `npm run dev` and send them the Network address Vite prints (for example `http://192.168.x.x:5173`).

**Remote link (recommended):** deploy the built app to Vercel or Netlify and send the HTTPS URL.

```bash
npm run build
npx vercel --yes
```

Or drag the `dist` folder onto [https://app.netlify.com/drop](https://app.netlify.com/drop).

## What to demo

1. Sign in as **Farm Planner**. Select **North Farm** — commodities filter to Beef, TOV, Campari.
2. Pick **Clipping**, enter **5** people, click-and-drag six slots — hours go up by **15.0**.
3. **Apply Recommendation**, overwrite cells, **Submit Schedule**.
4. **Summary → View Notes** for the audit drawer.
5. Log out. **Site Manager** sees Summary only. **System Admin** sees Admin (SSO lookup, users, farms/commodities/activities).

Past days are locked. Changing a submitted week asks for a reason. Empty grids cannot be submitted.

## Reset

Header → **Exploration guide** → **Reset prototype data**.
