import os
import sys
import markdown
from bs4 import BeautifulSoup
from datetime import datetime

def create_html_from_markdown(input_md_file, output_html_file, footer_image_path, title="Upwork Proposal"):
    """Convert markdown to HTML using python-markdown"""
    if not os.path.exists(input_md_file):
        print(f"Input file not found at {input_md_file}. Please check the path.")
        return False
        
    # Read markdown file
    with open(input_md_file, 'r', encoding='utf-8') as file:
        markdown_text = file.read()
    
    # Convert markdown to HTML
    html = markdown.markdown(
        markdown_text,
        extensions=[
            'markdown.extensions.fenced_code',
            'markdown.extensions.tables',
            'markdown.extensions.codehilite',
            'markdown.extensions.nl2br'
        ]
    )
    
    # Create complete HTML document
    full_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{title}</title>
    <style>
        @page {{
            size: letter;
            margin: 1.5cm;
            @bottom-center {{
                content: url({footer_image_path});
                width: 100px;
            }}
        }}
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            color: #333;
        }}
        .container {{
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
        }}
        h1, h2, h3, h4 {{
            color: #333;
            margin-top: 1.5em;
            margin-bottom: 0.75em;
        }}
        h1 {{
            font-size: 24pt;
            border-bottom: 1px solid #ccc;
            padding-bottom: 10px;
        }}
        h2 {{
            font-size: 20pt;
        }}
        h3 {{
            font-size: 16pt;
        }}
        h4 {{
            font-size: 14pt;
        }}
        p {{
            margin-bottom: 1em;
        }}
        ul, ol {{
            margin-bottom: 1em;
            padding-left: 2em;
        }}
        code {{
            background-color: #f5f5f5;
            padding: 2px 4px;
            border-radius: 4px;
            font-family: Courier, monospace;
        }}
        pre {{
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            white-space: pre-wrap;
            font-family: Courier, monospace;
        }}
        blockquote {{
            border-left: 4px solid #ccc;
            padding-left: 15px;
            margin-left: 0;
            color: #555;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 1em;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }}
        th {{
            background-color: #f2f2f2;
            font-weight: bold;
        }}
        hr {{
            border: 0;
            height: 1px;
            background-color: #ccc;
            margin: 2em 0;
        }}
        img {{
            max-width: 100%;
            height: auto;
        }}
        .title {{
            text-align: center;
            font-size: 28pt;
            margin-bottom: 2em;
        }}
        strong {{
            font-weight: bold;
        }}
        em {{
            font-style: italic;
        }}
        .footer {{
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            font-size: 10pt;
            color: #777;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="title">{title}</div>
        {html}
    </div>
</body>
</html>
"""
    
    # Write the HTML file
    with open(output_html_file, 'w', encoding='utf-8') as file:
        file.write(full_html)
        
    return True

def convert_html_to_pdf(input_html, output_pdf):
    """Convert HTML to PDF using WeasyPrint"""
    try:
        # Only import weasyprint here to avoid errors if it's not installed
        from weasyprint import HTML
        
        HTML(input_html).write_pdf(output_pdf)
        print(f"PDF created: {output_pdf}")
        return True
        
    except ImportError:
        print("Error: WeasyPrint is not installed.")
        print("Please install it using: pip install weasyprint")
        print("Note: WeasyPrint has some system dependencies. See:")
        print("  https://doc.courtbouillon.org/weasyprint/stable/first_steps.html")
        return False
    except Exception as e:
        print(f"Error creating PDF: {e}")
        return False

def markdown_to_pdf(input_md_file, output_pdf_file, footer_image_path, document_title="Upwork Proposal"):
    """Convert markdown to PDF via HTML using WeasyPrint"""
    # Create a temporary HTML file
    temp_html = os.path.splitext(output_pdf_file)[0] + ".html"
    
    # Convert markdown to HTML
    if create_html_from_markdown(input_md_file, temp_html, footer_image_path, document_title):
        # Convert HTML to PDF
        result = convert_html_to_pdf(temp_html, output_pdf_file)
        
        # Optionally delete the temporary HTML file
        # os.remove(temp_html)
        
        return result
    return False

if __name__ == "__main__":
    today_date = datetime.today().strftime('%Y-%m-%d')

    # Set default values (assumes running from the script directory)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    input_file = os.path.join(script_dir, "sample_proposal.md")
    output_file = os.path.join(script_dir, f"Upwork Proposal {today_date}.pdf")
    footer_image_path = os.path.join(script_dir, 
                                   "png-clipart-upwork-freelancer-mountain-view-job-fiverr-basic-skill-text-logo.png")
    document_title = "Upwork Proposal"
    
    # Print values
    print(f"Input file: {input_file}")
    print(f"Output file: {output_file}")
    print(f"Footer image: {footer_image_path}")
    print(f"Document title: {document_title}")
    
    # Check if the footer image exists
    if not os.path.exists(footer_image_path):
        print(f"Footer image not found at {footer_image_path}. Continuing without footer image.")
    
    # Convert markdown to PDF
    if markdown_to_pdf(input_file, output_file, footer_image_path, document_title):
        print(f"Successfully created PDF: {output_file}")
    else:
        print("PDF conversion failed. See error messages above.")