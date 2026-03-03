class BaseParser:
    def parse_page(self, page) -> list:
        """Parse a single pdfplumber Page object. Return list of raw transaction dicts."""
        raise NotImplementedError

    def parse(self, pdf) -> list:
        """Parse all pages of a pdfplumber PDF object."""
        all_txns = []
        for page in pdf.pages:
            all_txns.extend(self.parse_page(page))
        return all_txns
