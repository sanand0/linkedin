# LinkedIn Archive

A Node.js tool that converts your LinkedIn posts and comments into a beautiful, searchable HTML archive with RSS feed support.

## Usage

In [LinkedIn Settings](https://www.linkedin.com/settings/) > Data privacy > Get a copy of your data and request the _full_ archive [Ref](https://www.linkedin.com/help/linkedin/answer/a1339364).

Unzip `Shares.csv` and `Comments.csv` into this project directory and run:

```bash
npm run build
```

Open `index.html` in your browser. Subscribe to `feed.xml` for RSS updates.

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

Images and PDFs are released on GitHub releases at <https://github.com/sanand0/linkedin/releases/tag/main> created via:

```bash
gh release create main --title "Assets" --notes "Images, PDFs, and other LinkedIn post attachments"
```

Upload via:

```bash
# Upload single file
gh release upload main $FILE
# Upload and overwrite all
gh release upload main --clobber *.pdf *.png *.webp *.jpe?g
```

## Deployment

This project includes a GitHub Actions workflow that automatically builds and deploys your archive to GitHub Pages whenever you update your CSV files.

## License

MIT License - Feel free to use and modify as needed.
