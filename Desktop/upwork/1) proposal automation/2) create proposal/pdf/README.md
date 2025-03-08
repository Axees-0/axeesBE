# Markdown to PDF Converter

This tool converts Markdown documents to professionally formatted PDF files, perfect for creating Upwork proposals or other professional documents.

## Features

- Converts Markdown to visually pleasing PDFs
- Supports standard Markdown syntax (headings, lists, code blocks, tables, etc.)
- Adds a custom footer image to each page
- Customizable document title
- Proper styling and formatting

## Installation

### Setup with Virtual Environment (Recommended)

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Usage

1. Create your proposal in Markdown format (see `sample_proposal.md` for an example)
2. Run the converter script:

```bash
python weasyprint_converter.py
```

This will automatically convert the sample proposal to a PDF. The script uses default paths for:
- Input file: `sample_proposal.md` in the current directory
- Output file: `Upwork Proposal YYYY-MM-DD.pdf` in the current directory
- Footer image: The Upwork logo PNG in the current directory

## Markdown Tips

For best results, follow these Markdown conventions:

- Use `#` for main headings, `##` for subheadings, etc.
- Use `-` for unordered lists
- Use `1.`, `2.`, etc. for ordered lists
- Wrap text in `**bold**` for emphasis
- Create tables using the standard Markdown table syntax
- Use code blocks with triple backticks (```)
- Use `---` for horizontal rules

## Example

See `sample_proposal.md` for a complete example of a well-formatted proposal.

## Customizing the Output

To customize the PDF styling, edit the CSS in the `full_html` template inside the `weasyprint_converter.py` script.

## Custom Files

To use your own Markdown file, edit line 308 in `weasyprint_converter.py` to point to your custom file:

```python
input_file = "/path/to/your/markdown/file.md"
```

You can also customize the output path, footer image, and document title in the same section.

## License

This project is available under the MIT License.