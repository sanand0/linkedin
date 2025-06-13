# LinkedIn Archive

Static HTML archive of my LinkedIn posts and comments.

## Getting your data

1. Open [LinkedIn data export](https://www.linkedin.com/mypreferences/d/mydata/general).
2. Request a download of the "Larger data archive" selecting **Shares** and **Comments**.
3. After receiving the archive, unzip it and replace `Shares.csv` and `Comments.csv` in this repository.

## Build

Run `uv run publish.py` to generate the HTML pages and `rss.xml`. The GitHub Actions workflow in `.github/workflows/deploy.yml` runs this and deploys the result to GitHub Pages.

The pages use [Bootstrap 5.3.6](https://getbootstrap.com/) with minimal custom styling in `style.css`.
