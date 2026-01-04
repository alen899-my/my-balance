import io
import pdfplumber
import pikepdf


def unlock_pdf(file_bytes: bytes, password: str | None):
    # 🚀 FAST PATH: try opening without password
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            # If this works, PDF is NOT encrypted
            return file_bytes
    except Exception:
        # PDF is encrypted → continue
        pass

    # 🔐 Encrypted PDF but no password
    if not password:
        raise ValueError("PDF is password protected")

    # 🔓 Unlock using pikepdf ONLY when required
    try:
        with pikepdf.open(io.BytesIO(file_bytes), password=password) as pdf:
            output = io.BytesIO()
            pdf.save(output)
            return output.getvalue()
    except Exception:
        raise ValueError("Invalid PDF password")
