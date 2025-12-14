Scripts and documentation for archiving conversations with Gemini (via gemini.google.com/app).

Intended workflow:
Open the target Gemini Apps chat in the browser.
Then, run `bookmarklet.url` to prepare the page (for example, by removing extraneous elements).
Next, archive the page using [https://github.com/gildas-lormeau/SingleFile].
Finally, run `finalize.js`.

The role of `finalize.js` is to do the following:
1. Remodel the DOM (for example, removing the infinite scroller).
2. Consolidate the CSS.
3. Restore scripting functionality (for example, to the copy button).
4. Prepare the page for printing (for example, to a PDF).
5. Base64-inline all required assets using the fetch-and-cache pattern.
6. Reduce the file size where appropriate.

The script `minify.js` creates `bookmarklet.url`.

TODO features (human contributions welcome, not to be implemented by AI unless directed):
1. Archive user attachments and immersive deliverables...
2. Export to raw Markdown transcript...
3. Improve printing quality...
4. Code block syntax highlighting...
5. User message rendering (Markdown/LaTeX)...

