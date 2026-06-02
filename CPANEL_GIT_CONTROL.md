# cPanel Git Control Setup

## Repository

- Suggested GitHub repository: `https://github.com/Nimz20/Central-Domain.git`
- Branch: `main`
- Suggested cPanel repository path: `/home/westfie1/repositories/Central-Domain`
- Live document root in `.cpanel.yml`: `/home/westfie1/public_html/centraldomain.co.za/`
- Deployment file: `.cpanel.yml`

## First-Time cPanel Setup

1. In cPanel, open **SSH Access** and generate or import a key dedicated to GitHub.
2. Authorize the key in cPanel.
3. Copy the public key into GitHub under **Central-Domain > Settings > Deploy keys**.
4. Give the key read access. Write access is not needed for cPanel deployments.
5. In cPanel, open **Git Version Control** and choose **Create**.
6. Turn on **Clone a Repository**.
7. Use the GitHub repository URL and repository path listed above.
8. Select the `main` branch.
9. After the repository is created, use **Manage > Pull or Update**.
10. Use **Deploy HEAD Commit** to publish the pulled version.

## Deployment Behavior

The deployment script copies only the live static site files into:

`/home/westfie1/public_html/centraldomain.co.za/`

It does not copy local briefing files, `.DS_Store`, `.claude`, or Git metadata.

## Quick Verification

After deployment, check:

- `https://www.centraldomain.co.za/`
- `https://www.centraldomain.co.za/#rate-card`
- `https://www.centraldomain.co.za/#checkout`
- `https://www.centraldomain.co.za/services/custom-web-development`
- `https://www.centraldomain.co.za/sitemap.xml`

