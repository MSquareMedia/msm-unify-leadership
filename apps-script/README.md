# Receiving applications

Each application is posted to a Google Apps Script web app. It stores the resume in Drive, adds a row to a Sheet, emails the application to hr@msmunify.com with the resume attached, and sends the candidate a thank-you written for the seat they chose.

0. Fast path: run `python3 build/build.py`, open `apps-script/MSM-Leadership-Applications.gs` (Code.gs and Thanks.gs combined), paste it into a new Apps Script project, then jump to step 4.
1. Create a Google Sheet with a tab named `Applications`. Copy the Sheet ID from its URL.
2. Create a Drive folder for resumes. Copy the folder ID from its URL.
3. Go to script.google.com and create a project. Add two files: `Code.gs` and `Thanks.gs`, pasted from this folder. Fill in the Sheet ID and folder ID at the top of `Code.gs`.
4. Click Deploy, then New deployment, type Web app. Execute as: Me. Who has access: Anyone. Authorize when asked.
5. Copy the Web app URL into `applyEndpoint` in `config.js`.
6. Submit a test application from the live page. Confirm the Sheet row, the Drive file, the email to hr@msmunify.com and the candidate email.

Send mail as hr@: deploy the script while signed in as the HR mailbox, or add hr@msmunify.com as a "Send mail as" alias on the deploying account. Candidate replies go to hr@msmunify.com either way.

The thank-you copy lives in `build/roles.json` (`thanks.lead` and `thanks.ready` for each role). After editing it, run `python3 build/build.py` and paste the new `Thanks.gs` into the script.

The service levels in the emails (acknowledge in 2 working days, outcome in 5) come from `build/site.json`. They are recommended targets in the Talent Playbook, so HR should confirm them before launch.

Resumes and answers are personal data. Keep the Sheet and folder private to the talent team.
