# GitHub workflow — Milestone 2

> Replace `YOUR_GITHUB_USERNAME` in the remote URL with your GitHub username. Create an empty public repository named `world-explorer` on GitHub first.

## 1. First push
```bash
git init
git branch -M main
git add index.html styles.css app.js README.md GIT_WORKFLOW.md
git commit -m "chore: initialize World Explorer project"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/world-explorer.git
git push -u origin main
```

## 2. Feature branch and meaningful commits
Make each commit after completing and testing the described change. Do not create fake commits just to hit the minimum.

```bash
git switch -c feature/country-discovery
git add index.html styles.css
git commit -m "feat: build responsive discovery layout"
git add app.js
git commit -m "feat: fetch and render country data"
git add app.js styles.css
git commit -m "feat: add country search and region filters"
git add app.js
git commit -m "feat: add population and area sorting"
git add app.js
git commit -m "feat: add country detail modal and border navigation"
git add app.js
git commit -m "feat: persist favorites in local storage"
git add app.js
git commit -m "feat: compare two countries side by side"
git add app.js styles.css
git commit -m "feat: add dark mode preference"
git add app.js styles.css
git commit -m "feat: add loading error and empty states"
git add styles.css index.html
git commit -m "style: polish responsive states and accessibility"
git add README.md GIT_WORKFLOW.md
git commit -m "docs: document setup api and git workflow"
git push -u origin feature/country-discovery
```

## 3. Create a Pull Request (PR)
1. Open the repository on GitHub.
2. Click **Compare & pull request** for `feature/country-discovery`.
3. Title: `Build responsive World Explorer country discovery app`.
4. Describe the features and test checklist.
5. Create the PR, review the diff, then click **Merge pull request**.
6. Update your local main branch:

```bash
git switch main
git pull origin main
git branch -d feature/country-discovery
```

## 4. Second branch
Create another branch for a genuine improvement (for example, accessibility or README screenshots):

```bash
git switch -c docs/presentation-and-screenshots
# Update README.md with your actual Vercel URL and screenshots.
git add README.md
git commit -m "docs: add live demo and project screenshots"
git push -u origin docs/presentation-and-screenshots
```

Open and merge a second PR if appropriate. This gives you two branches in your history and a clear review trail. The milestone requires at least two branches and one merged PR; verify your GitHub history before submission.

## 5. Useful commands
```bash
git status
git log --oneline --graph --decorate --all
git branch -a
git remote -v
git diff
git add .
git commit -m "fix: describe the actual fix"
git push
```

## Important
- Git does not automatically update comments. Update code comments/README when behavior changes, then commit and push those edits.
- Make commits for real, small pieces of work, not all at once with fabricated history.
