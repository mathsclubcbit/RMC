# Enhance MPL Registration and Participant Dashboard

## Summary

This pull request enhances the Mathematics Premier League registration and participant dashboard experience with IPL team preferences, reliable team logos, participant profile completion, and improved WhatsApp actions.

## Changes Made

### Preferred IPL Team

- Removed IPL team selection from the registration form.
- Added all 10 IPL 2026 teams to the team leader dashboard selector:
  - Chennai Super Kings
  - Delhi Capitals
  - Gujarat Titans
  - Kolkata Knight Riders
  - Lucknow Super Giants
  - Mumbai Indians
  - Punjab Kings
  - Rajasthan Royals
  - Royal Challengers Bengaluru
  - Sunrisers Hyderabad
- Added validation so only a valid IPL team can be saved.
- Stored the selection in `mpl_players.preferred_ipl_team`.
- Added a leader-only dashboard selector for teams without a saved preference.
- Added a waiting state for team members until their leader makes a selection.
- Added an authenticated API endpoint allowing only team leaders to save the preference.
- Displayed the leader's saved preference to every team member.

### Participant Dashboard

- Added a dedicated preferred IPL team card showing:
  - Team logo
  - Team name
  - Preferred IPL Team label
- The card is shown only after a valid preference has been saved.
- Team leaders without a preference see a styled selection card.
- Team members without a leader-selected preference see a waiting state instead.
- Added a WhatsApp team invitation action for both team leaders and regular team members.
- Kept the official WhatsApp group action available from the dashboard.
- Improved button hierarchy, spacing, contrast, hover states, and WhatsApp brand colors.

### Registration Success Screen

- Removed the `Share on WhatsApp` action from the success screen.
- The success screen now provides:
  - `Join WhatsApp Group`
  - `Go to Dashboard`
- The official WhatsApp group action is now the primary green button.

### Admin Dashboard

- Added the preferred IPL team name to the player details table.
- Added IPL team name search support.
- IPL logos are intentionally not shown in the admin dashboard.

### IPL Logo Assets

- Replaced blocked external IPL logo URLs with local assets.
- Added local logo assets under `public/assets/ipl/`.
- Updated the shared IPL team catalog to use application-served paths such as `/assets/ipl/CSK.svg`.
- This avoids external hotlink restrictions and ensures logos load reliably in participant dashboards.

### Database

- Updated the MPL schema with the `preferred_ipl_team` column.
- Added the migration:

```text
supabase/migrations/019_mpl_preferred_ipl_team.sql
```

Apply this migration in Supabase before testing or deploying.

## Configuration

The official WhatsApp group button uses:

```text
NEXT_PUBLIC_WHATSAPP_GROUP_LINK
```

Set this variable in `.env.local` for local development and in the deployment environment for production.

## Security and Data Ownership

- The preferred team update endpoint requires an authenticated Supabase session.
- Only team leaders can update the preferred IPL team, and the selected team is shared with their squad.
- IPL team values are validated against the shared supported-team catalog before saving.
- `.env.local` is intentionally excluded from this pull request.

## Validation

- Focused ESLint completed with zero errors.
- All 10 local IPL logo assets were verified.
- `git diff --check` completed without whitespace errors.
- Existing `<img>` optimization warnings remain in the MPL UI and are unrelated to the feature behavior.

## Deployment Checklist

- [ ] Apply `supabase/migrations/019_mpl_preferred_ipl_team.sql`.
- [ ] Configure `NEXT_PUBLIC_WHATSAPP_GROUP_LINK`.
- [ ] Verify the MPL registration flow.
- [ ] Verify saving a preferred IPL team from the participant dashboard.
- [ ] Verify the IPL logo and name card for participants.
- [ ] Verify WhatsApp group joining and team invitations.
- [ ] Verify the admin dashboard shows the IPL team name without the logo.
