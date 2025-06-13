# LinkedIn Archive

A Node.js tool that converts your LinkedIn posts and comments into a beautiful, searchable HTML archive with RSS feed support.

## Features

- **Modern Design**: Clean, responsive Bootstrap 5 interface
- **Monthly Organization**: Posts grouped by month for easy browsing
- **RSS Feed**: Stay updated with your latest activity
- **Automated Build**: GitHub Actions workflow for continuous deployment
- **Minimal Dependencies**: Pure Node.js with no external packages

## Getting Your LinkedIn Data

To use this tool, you'll need to export your LinkedIn data:

1. **Go to LinkedIn Settings**

   - Visit [LinkedIn Settings & Privacy](https://www.linkedin.com/settings/)
   - Navigate to "Data privacy" section

2. **Request Your Data**

   - Click "Get a copy of your data"
   - Select "Want something in particular? Select the data files you're most interested in"
   - Check the boxes for:
     - **Posts** (this generates Shares.csv)
     - **Comments** (this generates Comments.csv)

3. **Download and Extract**
   - LinkedIn will email you when your data is ready (usually within 24-72 hours)
   - Download the ZIP file and extract it
   - Copy `Shares.csv` and `Comments.csv` to this project directory

For detailed instructions, see:

- [LinkedIn Help: Downloading Your Account Data](https://www.linkedin.com/help/linkedin/answer/a1339364)
- [LinkedIn Help: Managing Your Account Data](https://www.linkedin.com/help/linkedin/answer/a1181981)

## Usage

1. **Add Your Data Files**

   ```bash
   # Place these files in the project root:
   # - Shares.csv (your LinkedIn posts)
   # - Comments.csv (your LinkedIn comments)
   ```

2. **Generate the Archive**

   ```bash
   npm run build
   ```

3. **View Your Archive**
   - Open `index.html` in your browser
   - Browse posts by month
   - Subscribe to `feed.xml` for RSS updates

## Project Structure

```
├── Shares.csv          # Your LinkedIn posts (not tracked)
├── Comments.csv        # Your LinkedIn comments (not tracked)
├── publish.js          # Main conversion script
├── style.css           # Custom styling
├── package.json        # Node.js configuration
├── index.html          # Generated archive index (not tracked)
├── YYYY-MM.html        # Generated monthly pages (not tracked)
├── feed.xml            # Generated RSS feed (not tracked)
└── .github/workflows/  # GitHub Actions deployment
```

## Deployment

This project includes a GitHub Actions workflow that automatically builds and deploys your archive to GitHub Pages whenever you update your CSV files.

## License

MIT License - Feel free to use and modify as needed.
