# MSM Unify Leadership Careers

A recruitment microsite for MSM Unify's open leadership roles. One page, one shareable link per role, an on-site application, and per-role emails to HR and to each candidate.

Live: https://www.msmunify.com/hirethenextleadership/

## What is in here

| Path | What it is |
| --- | --- |
| `index.html`, `styles.css`, `app.js`, `config.js` | The page. Plain HTML, CSS and JavaScript, no framework. |
| `build/roles.json` | The single source of truth for every role: story, mandate, share copy, thank-you copy, 90-day prompts. |
| `build/gallery.json` | The photo reels. |
| `build/site.json` | Public site URL, HR email, service levels. |
| `build/build.py` | Generates `roles.js`, one page per role, share images, the sitemap and the email copy. |
| `apps-script/` | The backend: validates each application, saves the resume, fills the Google Sheet, emails HR and sends the candidate a personal note. Includes a test harness. |
| `assets/` | Logo, photography and award graphic. |
| `fonts/` | Poppins (SIL Open Font License), used only to draw share images. |

## Build

Requires Python 3 and Pillow.

```bash
python3 build/build.py
```

This writes `roles.js`, `roles/<id>/index.html`, `og/*.png`, `sitemap.xml`, `robots.txt`, and `apps-script/Thanks.gs` plus the combined `apps-script/MSM-Leadership-Applications.gs`. These are generated, so they are not committed. To change a role, edit `build/roles.json` and rebuild.

Set the public address before a production build:

```json
{ "siteUrl": "https://www.msmunify.com/hirethenextleadership/" }
```

in `build/site.json`. Every canonical link, share image and caption uses it.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Run the build first.

## Receiving applications

1. Follow `apps-script/README.md` to deploy the backend as a Google Apps Script web app (about 5 minutes).
2. Paste the `/exec` URL into `applyEndpoint` in `config.js`.
3. Submit a test application and check the Sheet row, the Drive file, the email to HR and the candidate email.

Until `applyEndpoint` is set, the live page shows "Applications open shortly" and keeps the form closed. On localhost and Vercel previews it runs in preview mode and sends nothing.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`: it checks the build, builds a Docker image (the site is built inside the image) and deploys it to the Azure VM. The backend URL is injected at build time from the repository variable `APPLY_ENDPOINT`, so `config.js` does not need editing. The Docker build removes the `build/` and `apps-script/` folders from what is served.

## Content rules

- No em dashes, no plus signs after figures, and "and" instead of "&" in titles.
- Titles follow the Talent Playbook. "Founder and Director" is written exactly that way.
- Figures come from MSM Unify's own published numbers. Confirm any new figure before it goes on the page.

## Before publishing

- Confirm permission for every person shown in `assets/show/` and the other photos.
- Confirm the IPO section with legal or compliance.
- Confirm the service levels in `build/site.json` with HR.
