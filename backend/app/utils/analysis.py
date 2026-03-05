import re

def classify_category(payee: str) -> str:
    if not payee:
        return "Personal"
    p = payee.upper()

    categories = {
        "Food & Dining": [
            "ZOMATO", "SWIGGY", "BLINKIT", "INSTAMART", "ZEPTO", "DUNZO",
            "RESTAURANT", "HOTEL", "CAFE", "BAKES", "BAKERY", "TEA", "COFFEE",
            "PIZZA", "BURGER", "KFC", "MCDONALDS", "DOMINOS", "SUBWAY",
            "BIRYANI", "HALWA", "MEAT", "CHICKEN", "DINER", "DHABA",
        ],
        "Shopping": [
            "AMAZON", "FLIPKART", "MYNTRA", "MEESHO", "NYKAA", "AJIO",
            "SNAPDEAL", "SHOPSY", "TATACLIQ", "RELIANCE DIGITAL",
            "RETAIL", "SUPERMARKET", "GROCERY", "MALL", "STORE", "MART",
            "DMART", "BIGBASKET", "GROFERS", "BLINKIT", "JIOMART",
            "MORE RETAIL", "LULU", "LIFESTYLE", "PANTALOONS", "WESTSIDE",
        ],
        "Bills & Utilities": [
            "KSEB", "BESCOM", "MSEDCL", "TNEB", "BSES", "TPDDL", "CESC",
            "ELECTRIC", "ELECTRICITY", "WATER", "GAS",
            "BROADBAND", "WIFI", "INTERNET", "RECHARGE",
            "AIRTEL", "JIO", "VI ", "BSNL", "VODAFONE",
            "TATA SKY", "DISH TV", "D2H", "SITICABLE",
            "KERALAVISION", "ASIANET", "SUN DIRECT",
            "POSTPAID", "PREPAID",
        ],
        "Entertainment/Gaming": [
            "NETFLIX", "HOTSTAR", "PRIME VIDEO", "AMAZON PRIME",
            "SPOTIFY", "APPLE MUSIC", "GAANA", "WYNK",
            "YOUTUBE", "SONY LIV", "VOOT", "ZEE5", "MXPLAYER",
            "STEAM", "PLAYSTATION", "XBOX", "GAMES",
            "DREAM11", "MY11CIRCLE", "MPL", "WINZO", "FANTASYPOWER",
            "PAYTM GAMES", "LUDO", "RUMMY",
        ],
        "Transport/Fuel": [
            "PETROL", "DIESEL", "FUEL",
            "HP ", "HPCL", "INDIAN OIL", "IOCL", "BHARAT PETROLEUM", "BPCL",
            "SHELL", "ESSAR",
            "UBER", "OLA", "RAPIDO", "BOUNCE",
            "IRCTC", "RAILWAYS", "RAILWAY", "METRO",
            "REDBUS", "MAKEMYTRIP", "YATRA", "IXIGO", "CLEARTRIP", "GOIBIBO",
            "AIRPORT", "AIR", "INDIGO", "SPICEJET", "AIRINDIA", "VISTARA",
        ],
        "Health & Fitness": [
            "HOSPITAL", "CLINIC", "HEALTH", "MEDICAL",
            "APOLLO", "FORTIS", "MANIPAL", "AIIMS",
            "MEDPLUS", "NETMEDS", "PHARMEASY", "1MG", "PRACTO",
            "PHARMACY", "CHEMIST", "LAB", "DIAGNOSTICS",
            "GYM", "FITNESS", "WORKOUT", "CROSSFIT", "YOGA", "CULT.FIT",
            "PROTEIN", "SUPPLEMENT",
        ],
        "Automotive": [
            "REPAIR", "SERVICE", "GARAGE", "WORKSHOP",
            "MOTORS", "HONDA", "SUZUKI", "TYRE", "TYRES",
            "WASH", "SPARE", "PARTS", "ACCESSORIES",
            "MARUTI", "TATA MOTORS", "HYUNDAI",
        ],
        "Insurance": [
            "LIC", "IRDAI", "INSURANCE", "POLICY",
            "STAR HEALTH", "BAJAJ ALLIANZ", "HDFC LIFE",
            "ICICI PRUDENTIAL", "SBI LIFE", "MAX LIFE",
            "GENERAL INSURANCE", "TERM PLAN",
        ],
        "EMI & Loans": [
            "EMI", "LOAN", "LENDING", "CREDILA", "BAJAJ FINANCE",
            "HOME LOAN", "CAR LOAN", "PERSONAL LOAN",
            "HDFC CREDILA", "SBI LOAN", "ICICI LOAN",
            "NACH", "ACH", "MANDATE", "REPAYMENT", "INSTALMENT",
        ],
        "Investments": [
            "MUTUAL FUND", "ZERODHA", "GROWW", "UPSTOX", "NUVAMA",
            "NSE", "BSE", "SEBI", "DEMAT", "STOCKS", "SIP",
            "SMALLCASE", "FISDOM", "PAYTM MONEY", "ANGEL",
            "RD", "FD", "FIXED DEPOSIT", "RECURRING",
        ],
    }

    for category, keywords in categories.items():
        if any(key.upper() in p for key in keywords):
            return category

    return "Personal"


def extract_clean_name(text):
    """Legacy helper kept for backward compatibility."""
    if not text:
        return "Internal Transfer"
    match = re.search(r'/\s*([^/@\s]+)@', text)
    if match:
        return match.group(1).strip().title()
    parts = text.split('/')
    if len(parts) > 2:
        return parts[2].strip().title()
    return text[:15].strip().title()
