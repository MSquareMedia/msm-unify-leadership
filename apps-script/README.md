# Backend: applications, Sheet and email

When someone submits the form on the site, this Google Apps Script web app does five things:

1. Checks the answers, blocks abuse and ignores double clicks.
2. Saves the resume to a private Drive folder.
3. Adds one row to the **Applications** tab of the Google Sheet. The **Dashboard** tab counts applications per seat and per status.
4. Emails **HR** (`hr@msmunify.com`): the position, name, email and phone at the top, then the profile, the 90-day answer, the resume attached, and buttons to open the resume, open the row in the Sheet, or reply.
5. Emails the **candidate** a personal note about the exact seat they chose: their own words quoted back, what lands on that seat's desk first, what success looks like in 12 months, a question to prepare for the first conversation, and what happens next.

No servers and no stored passwords. It runs inside your Google Workspace.

## Deploy (about 5 minutes)

Sign in at https://script.google.com **as the account the emails should come from**. For mail to arrive from `hr@msmunify.com`, use the HR mailbox. (See "Sender" below.)

1. **New project.** Open **Project settings** and tick **Show "appsscript.json" manifest file in editor**.
2. Replace the contents of `appsscript.json` with `apps-script/appsscript.json` from this repo.
3. Create two script files and paste in: `Code.gs` (from this repo) and `Thanks.gs`. Generate `Thanks.gs` with `python3 build/build.py`. Or paste `MSM-Leadership-Applications.gs`, which is both combined, into one file.
4. Check the two IDs at the top of `Code.gs`: `SHEET_ID` and `FOLDER_ID`. The account running the script needs edit access to both.
5. Pick the function **testSubmission** and click **Run**. Approve the permissions (Sheets, Drive, send email). It sends a sample application through the whole flow, with both emails going to `hr@msmunify.com`. Check the Sheet row, the Drive file and the two emails.
6. **Deploy, New deployment, Web app.** Execute as **Me**. Who has access **Anyone**. Copy the Web app URL, which ends in `/exec`.
7. Put that URL into the repository variable `APPLY_ENDPOINT` (Settings, Secrets and variables, Actions, Variables). The deploy pipeline injects it into `config.js` at build time. For a manual build, put it into `applyEndpoint` in `config.js`.
8. Open the `/exec` URL in a browser. You should see `{"ok":true,...}`.

After you change anything in the script, use **Deploy, Manage deployments, Edit, New version**. The URL stays the same.

## Sender

Apps Script sends mail as the account that owns the deployment.

- **Deploy as `hr@msmunify.com`.** Mail comes from hr@, replies go to hr@. Share the Sheet and the Drive folder with that mailbox as an editor first.
- **Deploy as a personal account.** Mail shows the display name "MSM Unify HR" but the address of that account. Replies still go to `hr@msmunify.com`.

## The Sheet

Statuses (dropdown, colour-coded): New, Acknowledged, In conversation, Interview, Offer, Hired, Not moving forward, On hold. Use the **Owner** and **Notes** columns for the team. The **Email delivery** column records whether HR and the candidate were emailed, and the error if not.

Applications are saved to the Sheet before any email is sent, so an email problem never loses a candidate.

If the Applications tab is ever deleted or the Sheet is replaced, run `setup()` to rebuild the layout and the Dashboard.

## Limits and safeguards

- Resume: PDF, DOC or DOCX, up to 5 MB.
- Up to 4 submissions per email address per 6 hours. A repeat of the same seat within 10 minutes is ignored.
- Answers are stored as text, so a value that starts with `=` can never run as a formula.
- Google allows about 100 emails a day on a standard Workspace account. Each application sends two, so roughly 50 applications a day.
- Applications past row 1000 need the Sheet formatting extended.

## Change the email copy

Edit `build/roles.json` (`thanks.lead`, `thanks.ready`, plus the role's `owns` and `milestones`), run `python3 build/build.py`, and paste the new `Thanks.gs` into the script. The structure of the emails lives in `Code.gs`.

Service levels in the emails (reply within 2 working days, outcome within 5) come from `build/site.json`. HR should confirm them.

## Test without Google

```bash
node apps-script/test/harness.js
```

Runs the real `Code.gs` against stand-ins for Sheets, Drive and Mail. It checks validation, the row, both emails for all 12 seats, double submits, rate limits and formula safety, and writes sample emails to `apps-script/test/out/`.

Resumes and answers are personal data. Keep the Sheet and the folder limited to the talent team.
