# Opportunity Navigator

Personalized student roadmaps for skills, internships, scholarships, hackathons, and other opportunities.

## Requirements

- Node.js 18.18 or newer
- npm

## Install

Open PowerShell in the project folder:

```powershell
Set-Location D:\Vortex
npm.cmd install
```

If PowerShell cannot find `node` or `npm.cmd`, add the user-scoped Node.js installation to the current terminal's PATH:

```powershell
$nodeDir = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.20.0-win-x64"
$env:PATH = "$nodeDir;$env:PATH"
node --version
npm.cmd --version
```

If Node.js is installed elsewhere, replace `$nodeDir` with its installation folder. Open a new terminal after changing the Windows PATH permanently.

## Run Locally

From the project folder:

```powershell
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000). Next.js will select another port if 3000 is already in use. Press `Ctrl+C` in the terminal to stop the server.

## Production

Build and run the production app:

```powershell
npm.cmd run build
npm.cmd start
```

## Lint

```powershell
npm.cmd run lint
```

## Gemini API

AI generation is optional. Without a key, the app returns a labeled preview roadmap. To enable Gemini, add your key to `.env.local`:

```text
GEMINI_API_KEY="your-api-key"
```

Restart the development server after changing `.env.local`. Keep this file private and do not commit the API key.