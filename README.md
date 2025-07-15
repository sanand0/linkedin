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

## Deployment

This project includes a GitHub Actions workflow that automatically builds and deploys your archive to GitHub Pages whenever you update your CSV files.

## License

MIT License - Feel free to use and modify as needed.
