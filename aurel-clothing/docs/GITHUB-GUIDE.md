# Put the code on your GitHub profile

## 1. Extract and open the project

On Windows, right-click the ZIP and choose **Extract All**. Open the inner `aurel-clothing` folder in your editor. You should see `index.html`, `app.js`, and `package.json` directly inside it.

Push these extracted files, not the ZIP itself. Install Git if the `git` command is unavailable. You can use Git Bash on Windows or your editor's terminal.

## 2. Create an empty repository

On GitHub, choose **New repository** under your own account. Suggested name: `aurel-clothing`. Choose the visibility you want for your profile. Leave the README, `.gitignore`, and license initialization options unchecked; this download already includes documentation and ignore rules. Create the repository and copy its HTTPS remote URL.

## 3. Push the code

Run these commands in the extracted project folder. Replace `YOUR-USERNAME` with your GitHub username, and adjust the repository name if you chose another one.

```sh
git init -b main
git add .
git commit -m "Add AUREL clothing storefront"
git remote add origin https://github.com/YOUR-USERNAME/aurel-clothing.git
git push -u origin main
```

Complete GitHub authentication when prompted. If Git requests your commit identity, set your name and the email address you want associated with commits, then retry the commit:

```sh
git config user.name "Your Name"
git config user.email "YOUR-COMMIT-EMAIL"
```

Refresh your GitHub repository to see the code and README.

## 4. Push later changes

After editing and checking the website:

```sh
npm run check
git add .
git commit -m "Describe your changes"
git push
```

The included `.gitignore` excludes installed dependencies, local environment files, and ZIP archives. `package-lock.json` should be committed.

This guide uploads source code to your profile. It does not create a payment backend or deploy a live shop.

## Official references

- [Create a new repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)
- [Add locally hosted code to GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
