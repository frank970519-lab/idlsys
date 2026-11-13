# iDLSys

The website for the interdisciplinary Deep Learning System Lab in the School of Electrical and Computer Engineering at The University of Sydney.

## Preview locally

From the repository root, run:

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000/>. The site uses static HTML, CSS and JavaScript and requires no build step.

## Publish a fork with GitHub Pages

1. Fork this repository.
2. In the fork, open **Settings → Pages** and choose **Deploy from a branch**.
3. Select the default branch and **/ (root)**, then select **Save**.
4. Open the site URL shown in **Settings → Pages** once deployment finishes.

Links and assets use relative paths, so the site also works under a renamed fork or a custom domain.

## Edit the site

- Update news in `news/index.html` and the latest three entries in `index.html`.
- Edit publication entries under `research/data/`, `research/training/` and `research/inference/`.
- Update the lab profile in `people/index.html` and visit information in `contact/index.html`.
- Shared styles are in `styles.css`. The rotating keyword sphere is in `keyword-cloud.js`.
